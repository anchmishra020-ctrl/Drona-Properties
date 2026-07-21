/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Notebook, Trash2, Plus, Search, Calendar } from 'lucide-react';
import { UserNote } from '../types';
import { safeStorage } from '../services/storage';

interface UserNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function UserNotesDrawer({ isOpen, onClose, username }: UserNotesDrawerProps) {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Save key
  const storageKey = `terralink_notes_${username.toLowerCase()}`;

  // Load notes
  useEffect(() => {
    if (isOpen) {
      const savedNotes = safeStorage.getItem(storageKey);
      if (savedNotes) {
        try {
          setNotes(JSON.parse(savedNotes));
        } catch (e) {
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
    }
  }, [isOpen, storageKey]);

  // Save notes to storage
  const saveNotes = (updatedNotes: UserNote[]) => {
    setNotes(updatedNotes);
    safeStorage.setItem(storageKey, JSON.stringify(updatedNotes));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newNoteText.trim();
    if (!text) return;

    const newNote: UserNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: text,
      createdAt: new Date().toISOString(),
    };

    saveNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((note) => note.id !== id);
    saveNotes(updated);
  };

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-natural-bg border-l border-natural-border shadow-2xl z-50 flex flex-col h-full text-natural-text"
          >
            {/* Header */}
            <div className="p-6 bg-[#F2EDE7] border-b border-natural-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-natural-sage text-white rounded-lg flex items-center justify-center shadow-xs">
                  <Notebook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-natural-title">My Notes</h3>
                  <p className="text-[10px] text-natural-muted font-medium uppercase tracking-wider">
                    Private Notepad • {username}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-natural-bg text-natural-muted hover:text-natural-title border border-natural-border flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note creation input */}
            <div className="p-6 border-b border-natural-border bg-white space-y-4">
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="block text-xs font-bold text-natural-muted uppercase tracking-wider">
                  Write Quick Note
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add reminders, client info, or quick site codes..."
                    className="w-full p-3 bg-natural-bg border border-natural-border rounded-xl text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="bg-natural-sage hover:bg-natural-sage-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                </div>
              </form>
            </div>

            {/* Notes List with search */}
            <div className="flex-1 flex flex-col min-h-0 bg-natural-bg">
              {/* Search */}
              {notes.length > 0 && (
                <div className="px-6 py-3 border-b border-natural-border bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-natural-subtle" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search my notes..."
                      className="w-full pl-9 pr-4 py-2 bg-natural-bg border border-natural-border rounded-lg text-xs text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-1 focus:ring-natural-sage focus:border-natural-sage transition"
                    />
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {filteredNotes.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {filteredNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-white rounded-xl border border-natural-border shadow-xs hover:shadow-sm transition flex flex-col justify-between gap-3 group relative"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm text-natural-title whitespace-pre-wrap leading-relaxed flex-1 font-sans">
                            {note.content}
                          </p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-natural-subtle hover:text-red-500 opacity-60 hover:opacity-100 transition p-1 hover:bg-red-50 rounded cursor-pointer shrink-0"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-natural-subtle font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-natural-muted py-12">
                    <Notebook className="w-10 h-10 text-natural-subtle mb-2.5 opacity-50" />
                    {searchQuery ? (
                      <>
                        <h4 className="text-sm font-semibold text-natural-title">No search results</h4>
                        <p className="text-xs mt-1 text-natural-subtle">Try searching with a different keyword</p>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold text-natural-title">No notes yet</h4>
                        <p className="text-xs mt-1 text-natural-subtle max-w-[240px]">
                          Your private notes, checklists, and reminders will appear here. Only you can see them!
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
