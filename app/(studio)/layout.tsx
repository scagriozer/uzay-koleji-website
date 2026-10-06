import type { ReactNode } from 'react';

export const metadata = {
  title: 'Uzay Koleji Panel',
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
