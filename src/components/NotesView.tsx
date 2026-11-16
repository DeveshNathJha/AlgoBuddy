'use client';

import React, { useState, useEffect } from 'react';
import { ProblemNote, ProgrammingLanguage } from '@/lib/types';
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  Calendar,
  Code2,
  Search,
  ExternalLink,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface NotesViewProps {
  currentProblemTitle: string;
  currentLanguage: ProgrammingLanguage;
  userEmail: string | null;
  onOpenAuthModal: () => void;
  onLoadProblem: (problemTitle: string) => void;
}

export default function NotesView({
  currentProblemTitle,
  currentLanguage,
  userEmail,
  onOpenAuthModal,
  onLoadProblem,
}: NotesViewProps) {
  const [notes, setNotes] = useState<ProblemNote[]>([]);
  const [activeNoteText, setActiveNoteText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('algobuddy_user_notes');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotes(parsed);
          // If a note exists for the current problem, load it
          const existing = parsed.find((n: ProblemNote) => n.problemTitle === currentProblemTitle);
          if (existing) {
            setActiveNoteText(existing.content);
            setSelectedNoteId(existing.id);
          }
        } catch (e) {
          console.error('Failed to parse notes from storage', e);
        }
      }
    }
  }, [currentProblemTitle]);

  // Save or update active note
  const handleSaveNote = () => {
    if (!userEmail) {
      onOpenAuthModal();
      toast.info('Sign in with your Google account to save and sync notes.');
      return;
    }

    if (!activeNoteText.trim()) {
      toast.warning('Note content cannot be empty.');
      return;
    }

    const now = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    let updated: ProblemNote[];

    if (selectedNoteId) {
      // Update existing
      updated = notes.map((n) =>
        n.id === selectedNoteId
          ? {
              ...n,
              content: activeNoteText,
              updatedAt: now,
              language: currentLanguage,
            }
          : n
      );
      toast.success('Note updated successfully!');
    } else {
      // Create new
      const newNote: ProblemNote = {
        id: 'note_' + Date.now(),
        problemTitle: currentProblemTitle || 'Custom Problem',
        content: activeNoteText,
        language: currentLanguage,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newNote, ...notes];
      setSelectedNoteId(newNote.id);
      toast.success('New note saved for this problem!');
    }

    setNotes(updated);
    localStorage.setItem('algobuddy_user_notes', JSON.stringify(updated));
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem('algobuddy_user_notes', JSON.stringify(updated));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
      setActiveNoteText('');
    }
    toast.info('Note deleted.');
  };

  const handleSelectSavedNote = (note: ProblemNote) => {
    setSelectedNoteId(note.id);
    setActiveNoteText(note.content);
  };

  const handleStartNewNote = () => {
    setSelectedNoteId(null);
    setActiveNoteText('');
  };

  // Filter notes by search
  const filteredNotes = notes.filter(
    (n) =>
      n.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Active Problem Note Editor Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Interview Notes &amp; Key Takeaways
              </span>
            </div>
            <p className="text-xs text-indigo-300/90 mt-0.5 font-medium">
              Linked to: <span className="text-slate-200">{currentProblemTitle || 'Active Problem'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedNoteId && (
              <button
                onClick={handleStartNewNote}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Note
              </button>
            )}

            <button
              onClick={handleSaveNote}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Note
            </button>
          </div>
        </div>

        {/* Note Textarea */}
        <textarea
          value={activeNoteText}
          onChange={(e) => setActiveNoteText(e.target.value)}
          placeholder="Jot down interview gotchas, recurrence relations, edge cases, or company tags (e.g. Asked in Amazon round 2)..."
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans resize-y"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Notes are linked directly to this question and saved in your account.</span>
          <span className="uppercase text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            {currentLanguage}
          </span>
        </div>
      </div>

      {/* 2. All Saved Notes Cheat-Sheet Drawer */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>My Revision Notebook ({notes.length})</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
            />
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            {notes.length === 0
              ? 'No notes saved yet. Write your first revision takeaway above!'
              : 'No notes match your search query.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectSavedNote(note)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{note.problemTitle}</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {note.updatedAt}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3 font-sans">
                    {note.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
