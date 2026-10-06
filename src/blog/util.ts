const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// "2026-04-20" -> "20 Nisan 2026"
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const SITE = 'https://uzay.k12.tr';
export const FOOTER_NOTE = 'Bu içerik bilgilendirme amaçlıdır. Güncel program ve kontenjan bilgisi için okulla iletişime geçiniz.';
