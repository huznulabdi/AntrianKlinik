const { pipe, today, parseHash } = require('./_redis');
const TTL = 259200; // data hari ini disimpan 3 hari lalu terhapus otomatis

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const d = today(), K = s => `aq:${d}:${s}`;

    // Ambil nomor: terbuka untuk perangkat pendaftaran/kiosk
    if (b.action === 'ticket') {
      const [n] = await pipe([['INCR', K('last')]]);
      const it = { no: n, t: Date.now(), st: 'w' };
      const r = await pipe([
        ['HSET', K('t'), String(n), JSON.stringify(it)],
        ['EXPIRE', K('t'), TTL],
        ['EXPIRE', K('last'), TTL],
        ['HGETALL', K('t')],
      ]);
      const ahead = Object.values(parseHash(r[3])).filter(x => x.st === 'w' && x.no < n).length;
      return res.status(200).json({ ...it, ahead });
    }

    // Semua aksi di bawah ini butuh PIN operator (jika OPERATOR_PIN diisi)
    const PIN = process.env.OPERATOR_PIN;
    if (PIN && String(b.pin || '') !== PIN) return res.status(401).json({ error: 'PIN salah' });

    if (b.action === 'verify') return res.status(200).json({ ok: true });

    if (b.action === 'config') {
      const c = b.cfg || {};
      const cfg = {};
      ['clinic', 'tag', 'addr', 'tel', 'code'].forEach(k => { if (typeof c[k] === 'string') cfg[k] = c[k].slice(0, 120); });
      if (cfg.code) cfg.code = cfg.code.toUpperCase().slice(0, 2);
      await pipe([['SET', 'aq:cfg', JSON.stringify(cfg)]]);
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'reset') {
      await pipe([['DEL', K('last')], ['DEL', K('t')], ['DEL', K('cur')], ['DEL', K('call')]]);
      return res.status(200).json({ ok: true });
    }

    // Aksi antrian
    const [h, c] = await pipe([['HGETALL', K('t')], ['GET', K('cur')]]);
    const all = parseHash(h);
    const cur = c != null ? Number(c) : null;
    const cmds = [];
    const put = it => cmds.push(['HSET', K('t'), String(it.no), JSON.stringify(it)]);

    const callNo = no => {
      const it = all[no];
      if (!it) throw new Error('Nomor tidak ditemukan');
      if (cur && cur !== no && all[cur] && all[cur].st === 'c') { all[cur].st = 'd'; put(all[cur]); }
      it.st = 'c'; put(it);
      cmds.push(['SET', K('cur'), String(no)], ['EXPIRE', K('cur'), TTL]);
      cmds.push(['SET', K('call'), JSON.stringify({ no, ts: Date.now() })], ['EXPIRE', K('call'), TTL]);
    };

    switch (b.action) {
      case 'next': {
        const n = Object.values(all).filter(x => x.st === 'w').sort((a, b) => a.no - b.no)[0];
        if (!n) throw new Error('Tidak ada antrian menunggu');
        callNo(n.no); break;
      }
      case 'call': callNo(Number(b.no)); break;
      case 'recall': if (!cur) throw new Error('Belum ada nomor yang dipanggil'); callNo(cur); break;
      case 'done':
      case 'skip':
        if (cur && all[cur] && all[cur].st === 'c') { all[cur].st = b.action === 'done' ? 'd' : 's'; put(all[cur]); }
        break;
      default: throw new Error('Aksi tidak dikenal');
    }
    if (cmds.length) await pipe(cmds);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
