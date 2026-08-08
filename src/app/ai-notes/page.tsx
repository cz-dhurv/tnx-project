"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Clipboard,
  Download,
  Plus,
  Trash2,
  FolderOpen,
  Loader2,
  Check,
  FileDown,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedNote {
  id: number;
  topic: string;
  subject: string;
  type: string;
  content: string;
  date: string;
}

export default function AINotes() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [noteType, setNoteType] = useState("Detailed Guide");
  const [instructions, setInstructions] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeNoteContent, setActiveNoteContent] = useState<string | null>(null);
  const [activeNoteTitle, setActiveNoteTitle] = useState("");

  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([
    {
      id: 1,
      topic: "Introduction to Semaphores & Mutexes",
      subject: "Operating Systems",
      type: "Exam Cheat Sheet",
      content: `# Exam Cheat Sheet: Semaphores & Mutexes

## Definitions
- **Mutex**: A mutual exclusion object that allows only one thread to acquire the lock at a time. Used for locking critical sections.
- **Semaphore**: A signaling mechanism that regulates access to a finite pool of resources using a counter.
  - **Binary Semaphore**: Counter can only be 0 or 1.
  - **Counting Semaphore**: Counter can range over any non-negative integer.

## Key APIs (POSIX)
\`\`\`c
sem_t sem;
sem_init(&sem, 0, 1); // Initialize counter to 1
sem_wait(&sem);       // Decrement (P operation) - blocks if counter <= 0
sem_post(&sem);       // Increment (V operation) - wakes up waiting threads
\`\`\`

## Classic Synchronization Problems
1. **Producer-Consumer**: Solved using binary semaphores for buffer locking and counting semaphores for empty/full slot slots.
2. **Readers-Writers**: Writers require exclusive lock, readers can share locks as long as no writer holds it.`,
      date: "Oct 18, 2026",
    },
    {
      id: 2,
      topic: "Backpropagation Mathematical Derivation",
      subject: "Machine Learning",
      type: "Detailed Guide",
      content: `# Detailed Guide: Backpropagation Derivation

## Architecture Summary
Consider an $L$-layer neural network. Let:
- $w_{jk}^l$ be the weight connecting neuron $k$ in layer $(l-1)$ to neuron $j$ in layer $l$.
- $a_j^l$ be the activation output of neuron $j$ in layer $l$, where $a_j^l = \sigma(z_j^l)$ and $z_j^l = \sum_k w_{jk}^l a_k^{l-1} + b_j^l$.

## The 4 Core Equations of Backpropagation

### 1. Error in output layer ($L$)
$$\delta_j^L = \frac{\partial C}{\partial a_j^L} \sigma'(z_j^L)$$
In matrix form:
$$\delta^L = \nabla_a C \odot \sigma'(z^L)$$

### 2. Error in hidden layer ($l$)
$$\delta^l = ((W^{l+1})^T \delta^{l+1}) \odot \sigma'(z^l)$$

### 3. Rate of change of cost w.r.t Bias
$$\frac{\partial C}{\partial b_j^l} = \delta_j^l$$

### 4. Rate of change w.r.t Weights
$$\frac{\partial C}{\partial w_{jk}^l} = a_k^{l-1} \delta_j^l$$`,
      date: "Oct 15, 2026",
    },
  ]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setActiveNoteContent(null);

    // Simulate note generation with timer
    setTimeout(() => {
      const generatedText = `# AI Generated ${noteType}: ${topic}
Subject: ${subject}
Instructions applied: "${instructions || "None provided"}"

## Executive Summary
This document outlines key principles of **${topic}**. Compiled from lecture slides, textbooks, and online publications.

## Detailed Breakdown
1. **Fundamental Concepts**:
   - Primary definitions and properties of ${topic}.
   - Real-world relevance and integration details.
2. **Key Theorems / Formulae**:
   - Formula: $f(x) = \sigma(\mathbf{w}^T\mathbf{x} + b)$
   - Variables represent model configurations and weight parameters.
3. **Common Exam Questions**:
   - *Question 1*: How does this scale with larger datasets?
   - *Answer*: By employing parallel processing models.

## Implementation & Quick Reference
- Standard setup is straightforward. Ensure inputs are normalized for high accuracy.
- Keep learning rate around 0.01 to ensure optimal stability.`;

      const newNote: SavedNote = {
        id: Date.now(),
        topic: topic.trim(),
        subject,
        type: noteType,
        content: generatedText,
        date: new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      };

      setSavedNotes([newNote, ...savedNotes]);
      setActiveNoteContent(generatedText);
      setActiveNoteTitle(topic.trim());
      setIsGenerating(false);
      
      // Clear form
      setTopic("");
      setInstructions("");
    }, 1500);
  };

  const handleSelectSavedNote = (note: SavedNote) => {
    setActiveNoteContent(note.content);
    setActiveNoteTitle(note.topic);
  };

  const handleCopy = () => {
    if (!activeNoteContent) return;
    navigator.clipboard.writeText(activeNoteContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteSavedNote = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedNotes(savedNotes.filter((n) => n.id !== id));
    if (activeNoteContent && savedNotes.find((n) => n.id === id)?.topic === activeNoteTitle) {
      setActiveNoteContent(null);
      setActiveNoteTitle("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10"
    >
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          AI Notes Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Produce publication-quality markdown revision files in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Creator Form */}
        <div className="space-y-6">
          <form onSubmit={handleGenerate} className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Configure Generator
            </h2>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Topic Name</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Backpropagation, Huffman Coding..."
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                required
              />
            </div>

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subject / Course</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Data Science">Data Science</option>
                <option value="Physics">Physics</option>
              </select>
            </div>

            {/* Note Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Generation Format</label>
              <div className="grid grid-cols-2 gap-2">
                {["Detailed Guide", "Exam Cheat Sheet", "Short Summary", "Formulas Q&A"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNoteType(type)}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                      noteType === type
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-background border-border/40 hover:border-border/80 text-muted-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Custom Instructions (Optional)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Include code snippets in C++, focus heavily on complexity analysis..."
                rows={3}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Drafting Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Study Notes
                </>
              )}
            </button>
          </form>

          {/* Saved History card */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              Saved Library ({savedNotes.length})
            </h2>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {savedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectSavedNote(note)}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group",
                    activeNoteTitle === note.topic
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "bg-card border-border/40 hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1 overflow-hidden pr-2">
                    <span className="text-xs font-bold block truncate">{note.topic}</span>
                    <span className="text-[9px] text-muted-foreground block">
                      {note.subject} • {note.type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSavedNote(note.id, e)}
                    className="text-muted-foreground hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {savedNotes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No notes saved yet. Generate one to start!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Document Editor/Viewer */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm min-h-[500px] overflow-hidden">
          {activeNoteContent ? (
            <>
              {/* Note Top Bar Controls */}
              <div className="px-6 py-4 border-b border-border/40 bg-card flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
                    {activeNoteTitle}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Revision Material</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-muted/50 hover:bg-muted text-foreground border border-border/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => alert("Simulated PDF export. Downloading layout...")}
                    className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Note Content Viewer */}
              <div className="flex-1 p-8 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
                <div style={{ whiteSpace: "pre-line" }}>{activeNoteContent}</div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              {isGenerating ? (
                <div className="space-y-4 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI is reading slides and compiling...</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Synthesizing equations, references, and summaries...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-md space-y-3">
                  <BookOpen className="w-12 h-12 mx-auto text-indigo-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-foreground">No Document Active</h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Select a note from your saved library on the left, or input topics to draft a new reference guide.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
