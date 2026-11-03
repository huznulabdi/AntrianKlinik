// Pembantu koneksi ke Upstash Redis (Vercel Marketplace) lewat REST, tanpa library tambahan.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function pipe(cmds) {
  if (!URL_ || !TOKEN) throw new Error('Database belum terhubung. Tambahkan Upstash Redis di tab Storage Vercel.');
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('Database error ' + r.status);
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// Tanggal hari ini menurut WITA (Makassar) agar antrian reset tepat tengah malam lokal.
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Makassar' });

const DEF = {
  clinic: 'Klinik Utama Alif Medika',
  tag: 'Melayani Setulus Hati',
  addr: 'Jl. Lagaligo, Bone Tua, Kec. Masamba, Kab. Luwu Utara',
  tel: '0821-9129-0092',
  code: 'A',
};

const parseHash = a => {
  const o = {};
  for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = JSON.parse(a[i + 1]);
  return o;
};

module.exports = { pipe, today, DEF, parseHash };
