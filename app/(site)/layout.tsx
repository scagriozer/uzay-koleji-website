import { draftMode } from 'next/headers';
import type { ReactNode } from 'react';
import VisualEditingClient from '../../src/sanity/VisualEditingClient';
import { SanityLive } from '../../src/sanity/live';
import { RawShell } from '../../src/blog/RawShell';
import { consentGtmHead, cookieBanner, gtmNoscript, trackingTail } from '../../src/blog/shell';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { isEnabled } = await draftMode();
  return (
    <html lang="tr" data-draft={isEnabled ? '' : undefined}>
      <head>
        <RawShell html={consentGtmHead} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: gtmNoscript }} />
        <RawShell html={cookieBanner} />
        {children}
        <RawShell html={trackingTail} />
        {isEnabled && (
          <>
            <SanityLive />
            <VisualEditingClient />
          </>
        )}
      </body>
    </html>
  );
}
