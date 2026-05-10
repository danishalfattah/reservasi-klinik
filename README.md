# Reservasi Klinik

Sistem Reservasi Klinik adalah aplikasi manajemen jadwal dan booking rumah sakit/klinik modern dengan fitur pembayaran terintegrasi. Dibangun menggunakan teknologi *stack* Next.js, Prisma ORM, dan Tailwind CSS (v4) untuk tampilan visual antarmuka premium (glassmorphism & dark-mode ready).

## Prasyarat (Prerequisites)

- **Node.js**: Versi 20 atau di atasnya.
- **pnpm**: Package manager utama (`npm install -g pnpm`).
- **PostgreSQL**: Harus terinstal di lokal, atau Anda bisa menggunakan container Docker/Supabase.

## Cara Pemasangan Lokal

1. **Kloning Repositori & Instalasi Dependensi:**
   ```bash
   pnpm install
   ```

2. **Pengaturan Variabel Environment (.env):**
   Salin berkas konfigurasi bawaan dan sesuaikan (terutama `DATABASE_URL`):
   ```bash
   cp .env.example .env
   ```

3. **Sinkronisasi Skema & Generate Prisma Client:**
   Jalankan perintah ini untuk mendorong struktur tabel dari Prisma ke dalam Database PostgreSQL Anda:
   ```bash
   pnpm prisma db push
   pnpm prisma generate
   ```

4. **Injeksi Data Percobaan (Seeding):**
   Isi basis data dengan berbagai data tiruan agar Anda bisa langsung mencoba sistem (Admin, Dokter, Pasien, Reservasi):
   ```bash
   pnpm prisma db seed
   ```

5. **Nyalakan Development Server:**
   ```bash
   pnpm dev
   ```
   Buka `http://localhost:3000` di peramban (browser) Anda.

## Akun Pengujian (Test Accounts)

Proses *seeding* di langkah nomor 4 otomatis mendaftarkan akun-akun berikut dengan **Password yang sama untuk semuanya: `password123`**:

| Role     | Email               | Fungsi |
|----------|---------------------|--------|
| **Admin**  | `admin@test.com`    | Memantau dan mengubah data dokter, mengatur master jadwal seluruh klinik. |
| **Dokter** | `dr.andi@test.com`  | Menerima reservasi, dan memantau status pasien (ada juga dr.budi / dr.citra). |
| **Pasien** | `patient1@test.com` | Melakukan pemesanan janji temu secara online dan bertransaksi via Midtrans QRIS. (Bisa juga patient2 - patient5) |

## API & Testing
Kami juga menyertakan koleksi Postman yang mencakup seluruh _endpoints_ di dalam folder `docs/postman_collection.json`. Anda bisa meng-_import_-nya ke aplikasi Postman Anda untuk melakukan _smoke testing_ manual.

## Teknologi Utama
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (Prisma ORM dengan PrismaPg Adapter v7)
- **Styling**: Tailwind CSS v4, Lucide React, Framer Motion
- **Pembayaran**: Midtrans Snap API & Webhook
- **Auth**: Custom JWT berbasis cookie (`jose` package untuk kompabilitas *Edge Runtime* Middleware).
