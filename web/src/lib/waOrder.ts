/** Template WA transaksi (tanpa keranjang). */
export function buildMarketplaceWaMessage(
  storeName: string,
  userName: string,
  block: string,
  productName: string,
): string {
  return `Halo ${storeName}, saya ${userName} dari ${block}, ingin memesan ${productName}.`
}
