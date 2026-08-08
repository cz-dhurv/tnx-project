"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I'm your AI Campus Tutor. Upload a course syllabus, lecture slides, or PDF textbooks, or select a topic on the left to start our study session!",
      time: "2:30 PM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // Topics unlocked
  const [topics, setTopics] = useState<string[]>([
    "Introduction to Neural Networks",
    "Supervised vs Unsupervised Learning",
    "Linear & Logistic Regression",
  ]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI Response delay
    setTimeout(() => {
      let aiText = `That's a great question regarding "${text.length > 30 ? text.substring(0, 30) + '...' : text}". `;
      if (activeTopic) {
        aiText += `In the context of our active topic, **${activeTopic}**, this relates directly to core lectures. `;
      }
      aiText += "Here's a breakdown: \n\n1. **Core Concept**: We must analyze the boundary conditions and optimize the loss function.\n2. **Academic Context**: Typically, professors test this via proofs or practical programming worksheets.\n\nWould you like me to generate a practice quiz on this?";

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    // Simulate upload interval
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadedFile(file.name);
            // Unlock new topics
            setTopics([
              "Chapter 1: Perceptron Convergence & Feedforward Networks",
              "Chapter 2: Optimization via Stochastic Gradient Descent",
              "Chapter 3: Exploding & Vanishing Gradient Solutions",
              ...topics,
            ]);
            // Add system notification to chat
            setMessages((prevMsgs) => [
              ...prevMsgs,
              {
                id: Date.now(),
                sender: "ai",
                text: `📚 I have successfully parsed your document: **${file.name}**. I've extracted 3 key chapters and added them to your topics panel. What would you like to study first?`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const selectTopic = (topic: string) => {
    setActiveTopic(topic);
    setInputText(`Explain the core ideas of: "${topic}"`);
    handleSend(`Explain the core ideas of: "${topic}"`);
  };

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
            Upload PDFs (lecture notes, textbooks, slides) to unlock custom AI guides and practice questions.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
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
                <span className="text-xs font-semibold text-foreground">Processing document...</span>
                <div className="w-full bg-muted dark:bg-muted/30 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{uploadProgress}% uploaded</span>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center gap-1.5 text-center px-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{uploadedFile}</span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Fully Analyzed
                </span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-foreground block">Click to upload file</span>
                  <span className="text-[10px] text-muted-foreground">PDF, TXT, or DOCX up to 25MB</span>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Unlocked Topics Panel */}
        <div className="flex-1 min-h-[250px] p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col gap-4 overflow-hidden">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Course Syllabus Topics
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Click a topic to launch a mock AI lecture.</p>
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
              <p className="text-[10px] text-muted-foreground">Always active • Next.js 15 Engine</p>
            </div>
          </div>
          {activeTopic && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-500">
              <GraduationCap className="w-3.5 h-3.5" />
              Studying: {activeTopic.length > 25 ? activeTopic.substring(0, 25) + '...' : activeTopic}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3.5 max-w-[85%] md:max-w-[75%]",
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "flex-shrink-0 w-8.5 h-8.5 rounded-xl border flex items-center justify-center shadow-sm",
                msg.sender === "user"
                  ? "bg-muted/40 border-border/40 text-foreground"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
              )}>
                {msg.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Bubble */}
              <div className="space-y-1">
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed border",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border/40"
                  )}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {msg.text}
                </div>
                <span className={cn("text-[9px] text-muted-foreground block", msg.sender === "user" ? "text-right" : "")}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* AI is Typing loader */}
          {isTyping && (
            <div className="flex gap-3.5 max-w-[75%]">
              <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-center gap-2 p-3 px-4 bg-card border border-border/40 rounded-2xl">
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Tutor is compiling thoughts...</span>
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
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
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
