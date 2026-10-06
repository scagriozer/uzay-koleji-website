import type { ReactNode } from 'react';

// Sayfalar public/ altından aynen sunuluyor; bu layout yalnız Next'in 404 sayfası için var.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
