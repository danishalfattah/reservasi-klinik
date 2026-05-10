# Reservasi Klinik

Sistem Reservasi Klinik adalah aplikasi manajemen jadwal dan booking klinik modern dengan fitur pembayaran terintegrasi. Dibangun menggunakan Next.js 16 (App Router), Prisma ORM v7, PostgreSQL, dan Tailwind CSS v4.

## Prasyarat (Prerequisites)

- **Node.js**: Versi 20 atau di atasnya
- **pnpm**: Package manager utama (`npm install -g pnpm`)
- **PostgreSQL**: Lokal, Docker, atau layanan cloud seperti Supabase

## Cara Pemasangan Lokal

1. **Kloning Repositori & Instalasi Dependensi:**
   ```bash
   pnpm install
   ```

2. **Pengaturan Variabel Environment:**
   Buat file `.env` di root project dan isi variabel berikut:
   ```env
   DATABASE_URL="postgres://<token>:<password>@db.prisma.io:5432/postgres?sslmode=require"

   JWT_SECRET="isi-dengan-string-acak-minimal-32-karakter"
   JWT_EXPIRES_IN="7d"

   MIDTRANS_SERVER_KEY="Mid-server-xxxx"
   MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
   MIDTRANS_IS_PRODUCTION="false"

   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
   NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION="false"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```
   `DATABASE_URL` didapat dari dashboard [Prisma Postgres](https://console.prisma.io) → project → **Connect**.

3. **Generate Prisma Client & Jalankan Migration:**
   ```bash
   pnpm prisma generate
   pnpm prisma migrate deploy
   ```

4. **Injeksi Data Percobaan (Seeding):**
   Isi basis data dengan data tiruan (Admin, Dokter, Pasien, Reservasi):
   ```bash
   pnpm prisma db seed
   ```

5. **Nyalakan Development Server:**
   ```bash
   pnpm dev
   ```
   Buka `http://localhost:3000` di browser.

## Akun Pengujian (Test Accounts)

Proses seeding otomatis mendaftarkan akun-akun berikut dengan **password yang sama: `password123`**:

| Role | Email | Fungsi |
|------|-------|--------|
| **Admin** | `admin@test.com` | Mengelola data dokter, jadwal, dan memantau seluruh pasien |
| **Dokter** | `dr.andi@test.com` | Mengelola jadwal praktik dan melihat daftar reservasi pasien |
| **Dokter** | `dr.budi@test.com` | Spesialis Dokter Gigi |
| **Dokter** | `dr.citra@test.com` | Spesialis Dokter Anak |
| **Pasien** | `patient1@test.com` | Membuat reservasi dan melakukan pembayaran via Midtrans |
| **Pasien** | `patient2@test.com` s/d `patient5@test.com` | Akun pasien tambahan |

## Deployment (Vercel + Prisma Postgres)

1. Buat project di [Prisma Console](https://console.prisma.io) dan ambil connection string dari halaman **Connect**
2. Set `DATABASE_URL` dan semua env var lain di **Vercel → Settings → Environment Variables**
3. Push ke GitHub — Vercel otomatis build dengan `prisma generate && next build`
4. Jalankan migration ke database production:
   ```bash
   npx prisma migrate deploy
   ```

## Teknologi Utama

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Database** | PostgreSQL via Prisma ORM v7 + PrismaPg Adapter |
| **Styling** | Tailwind CSS v4, Framer Motion, Lucide React |
| **Pembayaran** | Midtrans Snap API |
| **Auth** | Custom JWT berbasis cookie (jose) |
| **Validasi** | Zod |
| **Deployment** | Vercel + Prisma Postgres |

## Fitur Utama

- **Autentikasi** — Register & login dengan role: Admin, Dokter, Pasien
- **Manajemen Dokter** — Admin dapat mengelola data dan jadwal praktik dokter
- **Booking Reservasi** — Pasien memilih dokter, tanggal, dan jam; sistem otomatis cek slot dan nomor antrian
- **Pembayaran** — Integrasi Midtrans Snap dengan verifikasi status transaksi server-to-server
- **Dashboard Dokter** — Dokter dapat melihat jadwal praktik dan daftar pasien yang booking
