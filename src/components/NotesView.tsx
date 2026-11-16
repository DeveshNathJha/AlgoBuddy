'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProblemNote, ProgrammingLanguage } from '@/lib/types';
import { languageLabel } from '@/lib/config';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotesViewProps {
  currentProblemTitle: string;
  currentProblemText: string;
  currentLanguage: ProgrammingLanguage;
  onOpenProblem: (note: ProblemNote) => void;
}

const STORAGE_KEY = 'algobuddy_user_notes';

function loadNotes(): ProblemNote[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(notes: ProblemNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    toast.error('Could not save: browser storage is full or blocked.');
  }
}

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function NotesView({ currentProblemTitle, currentProblemText, currentLanguage, onOpenProblem }: NotesViewProps) {
  const [notes, setNotes] = useState<ProblemNote[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Open the note that belongs to the current problem, if any.
  useEffect(() => {
    const all = loadNotes();
    setNotes(all);
    const existing = all.find((n) => (n.problemText ? n.problemText === currentProblemText : n.problemTitle === currentProblemTitle));
    setEditingId(existing?.id || null);
    setDraft(existing?.content || '');
  }, [currentProblemTitle, currentProblemText]);

  const editing = notes.find((n) => n.id === editingId);
  const savedContent = editing?.content ?? '';
  const isDirty = draft.trim() !== savedContent.trim();

  const save = () => {
    if (!draft.trim()) {
      toast.warning('Write something first.');
      return;
    }
    let updated: ProblemNote[];
    if (editing) {
      updated = notes.map((n) => (n.id === editing.id ? { ...n, content: draft, updatedAt: today(), language: currentLanguage } : n));
    } else {
      const note: ProblemNote = {
        id: `note_${Date.now()}`,
        problemTitle: currentProblemTitle || 'Untitled problem',
        problemText: currentProblemText,
        content: draft,
        language: currentLanguage,
        createdAt: today(),
        updatedAt: today(),
      };
      updated = [note, ...notes];
      setEditingId(note.id);
    }
    setNotes(updated);
    persist(updated);
    toast.success('Note saved.');
  };

  const remove = (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    persist(updated);
    if (editingId === id) {
      setEditingId(null);
      setDraft('');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? notes.filter((n) => n.problemTitle.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : notes;
  }, [notes, query]);

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h2 className="text-lg font-semibold text-fg">Notes</h2>
        <p className="text-sm text-fg-subtle">Your revision notes: tricky edge cases, the key insight, mistakes you made. Saved in this browser.</p>
      </div>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="section-label">{editing ? 'Editing note for' : 'New note for'}</p>
            <p className="font-medium text-fg truncate">{editing?.problemTitle || currentProblemTitle || 'Untitled problem'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {editing && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setDraft('');
                }}
                className="btn-ghost btn-sm"
              >
                New note
              </button>
            )}
            <button onClick={save} disabled={!isDirty} className="btn-primary btn-sm">
              {isDirty ? 'Save' : 'Saved'}
            </button>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={'Key insight: ...\nEdge case I missed: ...\nAsked in: ...'}
          rows={6}
          className="input resize-y leading-relaxed"
        />
        <p className="text-xs text-fg-subtle">Stored only in this browser. Clearing site data deletes your notes.</p>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-fg">All notes ({notes.length})</h3>
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="input pl-8 py-1.5" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-subtle">{notes.length === 0 ? 'No notes yet.' : 'No notes match your search.'}</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((note) => (
              <li key={note.id} className={`py-3 ${note.id === editingId ? 'bg-accent/5 -mx-2 px-2 rounded-lg' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => {
                      setEditingId(note.id);
                      setDraft(note.content);
                    }}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="font-medium text-fg truncate">{note.problemTitle}</p>
                    <p className="text-xs text-fg-subtle">
                      {languageLabel(note.language)} · {note.updatedAt}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted whitespace-pre-wrap line-clamp-3">{note.content}</p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.problemText && (
                      <button onClick={() => onOpenProblem(note)} className="btn-ghost btn-sm" title="Load this problem into the editor">
                        Open problem
                      </button>
                    )}
                    <button onClick={() => remove(note.id)} className="btn-ghost p-1.5 hover:text-danger" aria-label="Delete note">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
