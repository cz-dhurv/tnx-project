"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquareText,
  UploadCloud,
  FileText,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Loader2,
  CheckCircle,
  ArrowRight,
  BookOpen,
  AlertCircle,
  RefreshCw,
  FileWarning,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────

interface Citation {
  citation_id: number;
  document_id: string;
  filename: string;
  page: number | null;
  section: string | null;
  chunk_id: string;
  snippet: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  citations?: Citation[];
  isStreaming?: boolean;
  error?: boolean;
}

interface UploadedDocument {
  document_id: string;
  filename: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  chunk_count: number;
  topics: string[];
  error_message?: string;
}

// ── Component ─────────────────────────────────────────

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I'm your AI Campus Tutor. Upload a course syllabus, lecture slides, or PDF textbooks, or select a topic on the left to start our study session!",
      time: "", // Fixed hydration mismatch: initialized empty, set in useEffect
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Topics
  const [topics, setTopics] = useState<string[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load documents on mount
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome"
          ? {
              ...m,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : m
      )
    );
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success && data.data) {
        setDocuments(data.data);
        // Collect topics from all ready documents
        const allTopics = data.data
          .filter((d: UploadedDocument) => d.status === "ready")
          .flatMap((d: UploadedDocument) => d.topics || []);
        if (allTopics.length > 0) {
          setTopics(allTopics);
        }
      }
    } catch {
      // Silently fail on initial load — backend might not be up yet
    }
  };

  // ── Chat Send ─────────────────────────────────────

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsTyping(true);

      // Create placeholder for AI response
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        sender: "ai",
        text: "",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isStreaming: true,
        citations: [],
      };
      setMessages((prev) => [...prev, aiMsg]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: text,
            mode: documents.some((d) => d.status === "ready") ? "rag" : "chat",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let citations: Citation[] = [];
        let newConversationId = conversationId;

        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE events in buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              const dataStr = line.slice(5).trim();
              if (!dataStr) continue;

              try {
                const eventData = JSON.parse(dataStr);

                switch (eventType) {
                  case "message_start":
                    if (eventData.conversation_id) {
                      newConversationId = eventData.conversation_id;
                    }
                    break;

                  case "token":
                    if (eventData.content) {
                      fullText += eventData.content;
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === aiMsgId
                            ? { ...m, text: fullText, isStreaming: true }
                            : m
                        )
                      );
                    }
                    break;

                  case "citations":
                    if (eventData.sources) {
                      citations = eventData.sources;
                    }
                    break;

                  case "message_end":
                    // Finalize message
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMsgId
                          ? {
                              ...m,
                              text: fullText,
                              isStreaming: false,
                              citations,
                            }
                          : m
                      )
                    );
                    break;

                  case "error":
                    throw new Error(
                      eventData.message || "Stream error"
                    );
                }
              } catch (parseErr) {
                // Skip malformed JSON lines
                if (
                  parseErr instanceof Error &&
                  parseErr.message !== "Stream error"
                ) {
                  // ignore parse errors
                }
              }
            }
          }
        }

        // Set conversation ID for future messages
        if (newConversationId) {
          setConversationId(newConversationId);
        }

        // Ensure message is finalized
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, text: fullText || "I couldn't generate a response. Please try again.", isStreaming: false, citations }
              : m
          )
        );
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  text: "Sorry, I encountered an error. Please try again.",
                  isStreaming: false,
                  error: true,
                }
              : m
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, documents, isTyping]
  );

  // ── File Upload ───────────────────────────────────

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate early progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 85));
      }, 300);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      const data = await res.json();

      if (data.success && data.data) {
        setUploadProgress(100);

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);

          const doc = data.data as UploadedDocument;
          setDocuments((prev) => [doc, ...prev.filter(d => d.document_id !== doc.document_id)]);

          // Add new topics
          if (doc.topics && doc.topics.length > 0) {
            setTopics((prev) => {
              const newTopics = doc.topics.filter((t: string) => !prev.includes(t));
              return [...newTopics, ...prev];
            });
          }

          // Add system message
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              sender: "ai",
              text: `📚 I've successfully processed **${doc.filename}** (${doc.chunk_count} sections indexed). ${doc.topics.length > 0 ? `I found these topics: ${doc.topics.slice(0, 3).join(", ")}. ` : ""}What would you like to study?`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }, 500);
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          text: `❌ Upload failed: ${error instanceof Error ? error.message : "Please try again."}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          error: true,
        },
      ]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Topic Selection ───────────────────────────────

  const selectTopic = (topic: string) => {
    setActiveTopic(topic);
    handleSend(`Explain the core ideas of: "${topic}"`);
  };

  // ── Retry Failed Message ──────────────────────────

  const retryMessage = (messageIndex: number) => {
    // Find the user message before the failed AI message
    const msgs = [...messages];
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (msgs[i].sender === "user") {
        // Remove the failed AI message
        setMessages((prev) => prev.filter((_, idx) => idx !== messageIndex));
        handleSend(msgs[i].text);
        break;
      }
    }
  };

  // ── Render ────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 pb-4"
    >
      {/* Left panel: File upload & Topic breakdown */}
      <div className="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0">
        {/* Upload Card */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-500" />
            Study Materials Upload
          </h2>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Upload PDFs (lecture notes, textbooks, slides) to unlock custom AI
            guides and practice questions.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
          />

          <button
            onClick={handleFileUploadClick}
            disabled={isUploading}
            className={cn(
              "w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
              isUploading
                ? "bg-muted/10 border-indigo-500/20"
                : "border-border/60 hover:border-indigo-500/40 hover:bg-muted/30"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 w-full px-4">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-foreground">
                  Processing document...
                </span>
                <div className="w-full bg-muted dark:bg-muted/30 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {uploadProgress}% processed
                </span>
              </div>
            ) : documents.length > 0 ? (
              <div className="flex flex-col items-center gap-1.5 text-center px-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">
                  {documents.filter((d) => d.status === "ready").length} document
                  {documents.filter((d) => d.status === "ready").length !== 1
                    ? "s"
                    : ""}{" "}
                  indexed
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Click to upload more
                </span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-foreground block">
                    Click to upload file
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    PDF, TXT, DOCX, or MD up to 25MB
                  </span>
                </div>
              </>
            )}
          </button>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg bg-muted/30"
                >
                  <FileText className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                  <span className="truncate flex-1 text-foreground">
                    {doc.filename}
                  </span>
                  {doc.status === "ready" && (
                    <span className="text-emerald-500 text-[9px] font-medium">
                      ✓
                    </span>
                  )}
                  {doc.status === "processing" && (
                    <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                  )}
                  {doc.status === "failed" && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unlocked Topics Panel */}
        <div className="flex-1 min-h-[250px] p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col gap-4 overflow-hidden">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Course Syllabus Topics
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {topics.length > 0
                ? "Click a topic to launch a mock AI lecture."
                : "Upload a document to unlock topics."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => selectTopic(topic)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border text-xs leading-normal transition-all cursor-pointer flex items-center justify-between group",
                  activeTopic === topic
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "bg-card border-border/40 hover:border-border/80 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate max-w-[190px]">{topic}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-indigo-500" />
              </button>
            ))}
            {topics.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <FileWarning className="w-8 h-8 mb-2" />
                <span className="text-xs">No topics yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Live Chat interface */}
      <div className="flex-1 flex flex-col rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden h-full">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-border/40 bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                AI Copilot Tutor
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Always active • RAG-powered
              </p>
            </div>
          </div>
          {activeTopic && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-500">
              <GraduationCap className="w-3.5 h-3.5" />
              Studying:{" "}
              {activeTopic.length > 25
                ? activeTopic.substring(0, 25) + "..."
                : activeTopic}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-3.5 max-w-[85%] md:max-w-[75%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8.5 h-8.5 rounded-xl border flex items-center justify-center shadow-sm",
                    msg.sender === "user"
                      ? "bg-muted/40 border-border/40 text-foreground"
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                  )}
                >
                  {msg.sender === "user" ? (
                    <User className="w-4.5 h-4.5" />
                  ) : (
                    <Bot className="w-4.5 h-4.5" />
                  )}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div
                    className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed border",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground border-primary"
                        : msg.error
                        ? "bg-red-500/10 text-foreground border-red-500/30"
                        : "bg-card text-foreground border-border/40"
                    )}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-md font-bold mb-2 mt-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-3" {...props} />,
                        a: ({node, ...props}) => <a className="text-indigo-500 hover:underline" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-1 rounded-sm align-middle" />
                    )}
                  </div>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && !msg.isStreaming && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {msg.citations.map((cite) => (
                        <div
                          key={cite.chunk_id}
                          className="group relative inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-medium text-indigo-600 dark:text-indigo-400 cursor-help"
                          title={cite.snippet}
                        >
                          <FileText className="w-2.5 h-2.5" />
                          [{cite.citation_id}] {cite.filename}
                          {cite.page && ` p.${cite.page}`}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[9px] text-muted-foreground block",
                        msg.sender === "user" ? "text-right" : ""
                      )}
                    >
                      {msg.time}
                    </span>
                    {msg.error && msg.sender === "ai" && (
                      <button
                        onClick={() => retryMessage(idx)}
                        className="text-[9px] text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI is Typing loader */}
          {isTyping &&
            !messages.some((m) => m.isStreaming) && (
              <div className="flex gap-3.5 max-w-[75%]">
                <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="flex items-center gap-2 p-3 px-4 bg-card border border-border/40 rounded-2xl">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Tutor is thinking...
                  </span>
                </div>
              </div>
            )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border/40 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex gap-2.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about the lecture material, code snippets, or definitions..."
              className="flex-1 bg-muted/40 text-sm rounded-xl px-4 py-3 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="px-4.5 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all shadow flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
