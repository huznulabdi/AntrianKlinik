# Antrian Pendaftaran Online (Vercel)

Satu perangkat untuk **ambil nomor**, satu perangkat untuk **memanggil**, dan satu layar **display** (TV).
Semua tersinkron lewat internet (data disimpan di Upstash Redis, layar memperbarui diri tiap 1–4 detik).

## Cara deploy
1. Buat repositori GitHub baru, unggah isi folder ini (index.html, package.json, folder api/).
   (Alternatif: `npm i -g vercel` lalu jalankan `vercel` di folder ini.)
2. Di vercel.com klik **Add New → Project**, pilih repositori tadi, lalu **Deploy**
   (Framework Preset: *Other*, biarkan pengaturan lain default).
3. Buka proyek → tab **Storage** → **Create Database** → pilih **Upstash Redis** (paket Free) → hubungkan ke proyek.
   Vercel otomatis menambahkan variabel KV_REST_API_URL dan KV_REST_API_TOKEN.
4. Tab **Settings → Environment Variables**: tambahkan `OPERATOR_PIN` (mis. 1234) agar hanya petugas yang bisa memanggil dan mengubah pengaturan.
5. Tab **Deployments** → **Redeploy** supaya variabel baru terbaca.

## Cara pakai
- Perangkat pendaftaran/kiosk (tablet atau PC + printer): `https://NAMA-PROYEK.vercel.app/#ambil`
- Perangkat petugas pemanggil: `https://NAMA-PROYEK.vercel.app/#operator` (PIN diminta saat pertama kali)
- Layar TV: `https://NAMA-PROYEK.vercel.app/#display`, tekan F11, lalu klik layar sekali untuk mengaktifkan suara.

Antrian otomatis reset tiap hari mengikuti jam WITA (Makassar).
Cetak tiket otomatis tanpa dialog: jalankan Chrome dengan opsi `--kiosk-printing`.
