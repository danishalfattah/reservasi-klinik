/**
 * Cek apakah jam berada dalam range [jamMulai, jamSelesai)
 * Inclusive di awal, exclusive di akhir.
 */
export function isJamDalamRange(
  jam: string,
  jamMulai: string,
  jamSelesai: string
): boolean {
  return jam >= jamMulai && jam < jamSelesai;
}

/**
 * Hitung selisih hari kalender antara dua tanggal (mengabaikan jam).
 * Positive jika target setelah now, negative jika sebelum.
 */
export function hitungSelisihHari(target: Date, now: Date): number {
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = targetDay.getTime() - nowDay.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
