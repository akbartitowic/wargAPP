/** Sapaan berdasarkan jam (zona waktu Asia/Jakarta). Pakai `serverDate` dari API bila tersedia. */
export function getGreetingLabel(serverDate?: Date | null): string {
  const d = serverDate ?? new Date()
  const hour = Number(
    new Intl.DateTimeFormat('id-ID', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(d),
  )
  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}
