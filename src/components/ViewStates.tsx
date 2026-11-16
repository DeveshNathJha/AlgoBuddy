'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function LoadingState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="card h-full min-h-[320px] flex flex-col items-center justify-center p-10 text-center" role="status" aria-live="polite">
      <div className="w-9 h-9 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      <p className="text-sm text-fg-muted max-w-sm mt-1">{detail}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  note,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  note?: React.ReactNode;
}) {
  return (
    <div className="card h-full min-h-[320px] flex flex-col items-center justify-center p-10 text-center">
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="text-[15px] leading-7 text-fg-muted max-w-md mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary px-4 py-2">
          {actionLabel}
        </button>
      )}
      {note && <div className="mt-4 text-sm text-fg-subtle max-w-md">{note}</div>}
    </div>
  );
}

export function StaleBanner({ text, onRegenerate }: { text: string; onRegenerate: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2 text-sm text-fg">
      <span className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" /> {text}
      </span>
      <button onClick={onRegenerate} className="btn-ghost btn-sm shrink-0">
        Regenerate
      </button>
    </div>
  );
}
