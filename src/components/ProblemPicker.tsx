'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { DSA_PRESETS, PATTERN_ORDER, Difficulty } from '@/lib/presets';

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Easy: 'text-success bg-success/10',
  Medium: 'text-warning bg-warning/10',
  Hard: 'text-danger bg-danger/10',
};

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`chip ${DIFFICULTY_STYLE[difficulty]}`}>{difficulty}</span>;
}

interface ProblemPickerProps {
  presetId: string;
  onSelect: (presetId: string) => void;
}

/** Problem library, grouped by pattern, searchable by title, number or pattern. */
export default function ProblemPicker({ presetId, onSelect }: ProblemPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = DSA_PRESETS.find((p) => p.id === presetId);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const matches = DSA_PRESETS.filter(
      (p) => !q || p.title.toLowerCase().includes(q) || String(p.leetcode) === q || p.pattern.toLowerCase().includes(q)
    );
    return PATTERN_ORDER.map((pattern) => ({ pattern, items: matches.filter((p) => p.pattern === pattern) })).filter((g) => g.items.length);
  }, [query]);

  const choose = (id: string) => {
    setOpen(false);
    setQuery('');
    onSelect(id);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-secondary btn-sm max-w-[240px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current ? `#${current.leetcode} ${current.title}` : 'Problem library'}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[340px] max-w-[85vw] card shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, number or pattern"
                className="input pl-8 py-1.5"
              />
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1" role="listbox">
            {groups.length === 0 && (
              <p className="px-3 py-6 text-sm text-fg-muted text-center">
                Not in the library. Type its name or number in the problem box, and AlgoBuddy will look it up.
              </p>
            )}
            {groups.map((g) => (
              <div key={g.pattern} className="py-1">
                <p className="section-label px-3 py-1">{g.pattern}</p>
                {g.items.map((p) => (
                  <button
                    key={p.id}
                    role="option"
                    aria-selected={p.id === presetId}
                    onClick={() => choose(p.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-surface-2 ${
                      p.id === presetId ? 'bg-accent/10' : ''
                    }`}
                  >
                    <span className="truncate text-fg">
                      <span className="text-fg-subtle tabular-nums mr-1.5">#{p.leetcode}</span>
                      {p.title}
                    </span>
                    <DifficultyChip difficulty={p.difficulty} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
