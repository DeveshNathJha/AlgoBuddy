'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled client error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-lg font-semibold text-fg mb-1">Something went wrong</h2>
      <p className="text-sm text-fg-muted max-w-md mb-6">
        The page hit an unexpected problem. Your problem and code are saved in this browser, so reloading is safe.
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Reload page
        </button>
      </div>
    </div>
  );
}
