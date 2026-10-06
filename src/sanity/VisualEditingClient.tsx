'use client';

import { VisualEditing, type HistoryAdapter } from '@sanity/visual-editing/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

// Sayfalar vanilla JS ile init olduğundan Studio'dan gelen gezinme SPA yerine tam sayfa yüklemesi yapar.
export default function VisualEditingClient() {
  const router = useRouter();
  const navigateRef = useRef<Parameters<HistoryAdapter['subscribe']>[0] | null>(null);

  const history = useMemo<HistoryAdapter>(
    () => ({
      subscribe: (navigate) => {
        navigateRef.current = navigate;
        navigate({ type: 'push', url: `${location.pathname}${location.search}${location.hash}` });
        return () => {
          navigateRef.current = null;
        };
      },
      update: (update) => {
        if (update.type === 'push' || update.type === 'replace') location.assign(update.url);
        else if (update.type === 'pop') window.history.back();
      },
    }),
    [],
  );

  useEffect(() => {
    const onPop = () => navigateRef.current?.({ type: 'pop', url: location.pathname + location.search + location.hash });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <VisualEditing
      portal
      history={history}
      refresh={(payload) => {
        if (payload.source === 'manual') return false;
        return new Promise<void>((resolve) => {
          router.refresh();
          resolve();
        });
      }}
    />
  );
}
