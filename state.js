const { pipe, today, DEF, parseHash } = require('./_redis');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const d = today(), K = s => `aq:${d}:${s}`;
    const r = await pipe([
      ['GET', K('last')],
      ['HGETALL', K('t')],
      ['GET', K('cur')],
      ['GET', K('call')],
      ['GET', 'aq:cfg'],
    ]);
    res.status(200).json({
      date: d,
      last: Number(r[0] || 0),
      cur: r[2] != null ? Number(r[2]) : null,
      call: r[3] ? JSON.parse(r[3]) : null,
      cfg: { ...DEF, ...(r[4] ? JSON.parse(r[4]) : {}) },
      q: Object.values(parseHash(r[1])).sort((a, b) => a.no - b.no),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
