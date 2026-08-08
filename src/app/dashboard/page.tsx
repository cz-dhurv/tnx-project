"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  Briefcase,
  Mail,
  Clock,
  TrendingUp,
  Award,
  Flame,
  Check,
  Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Goal {
  id: number;
  text: string;
  subject: string;
  completed: boolean;
  xp: number;
  emoji: string;
  color: string;
}

interface FloatingXP {
  id: number;
  x: number;
  y: number;
  amount: number;
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, text: "Revise CPU Schedulers in Chapter 3", subject: "Operating Systems", completed: false, xp: 50, emoji: "💻", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" },
    { id: 2, text: "Complete Discrete Math assignment proofs", subject: "Discrete Math", completed: true, xp: 40, emoji: "📐", color: "bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border-violet-100 dark:border-violet-900/30" },
    { id: 3, text: "Draft internship follow-up email", subject: "Placement Hub", completed: false, xp: 30, emoji: "📝", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" },
    { id: 4, text: "Practice Gradient Descent formulas", subject: "Machine Learning", completed: false, xp: 60, emoji: "🧠", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" },
  ]);

  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalSubject, setNewGoalSubject] = useState("Machine Learning");
  
  // Floating XP particles state
  const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([]);
  
  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  const handleToggleGoal = (id: number, e: React.MouseEvent) => {
    setGoals(
      goals.map((g) => {
        if (g.id === id) {
          const nextCompleted = !g.completed;
          if (nextCompleted) {
            triggerXPEffect(g.xp, e);
          }
          return { ...g, completed: nextCompleted };
        }
        return g;
      })
    );
  };

  const triggerXPEffect = (amount: number, e: React.MouseEvent) => {
    const newXP: FloatingXP = {
      id: Date.now(),
      x: e.clientX - 25,
      y: e.clientY - 25,
      amount,
    };
    
    setFloatingXPs((prev) => [...prev, newXP]);
    
    window.dispatchEvent(
      new CustomEvent("xp-gained", { detail: { amount } })
    );

    setTimeout(() => {
      setFloatingXPs((prev) => prev.filter((item) => item.id !== newXP.id));
    }, 1000);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    let emoji = "📚";
    let color = "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400";
    
    if (newGoalSubject === "Operating Systems") {
      emoji = "💻";
      color = "bg-indigo-50 text-indigo-600 border-indigo-100";
    } else if (newGoalSubject === "Discrete Math") {
      emoji = "📐";
      color = "bg-violet-50 text-violet-600 border-violet-100";
    } else if (newGoalSubject === "Placement Hub") {
      emoji = "📝";
      color = "bg-emerald-50 text-emerald-600 border-emerald-100";
    } else if (newGoalSubject === "Machine Learning") {
      emoji = "🧠";
      color = "bg-indigo-50 text-indigo-600 border-indigo-100";
    }

    setGoals([
      ...goals,
      {
        id: Date.now(),
        text: newGoalText.trim(),
        subject: newGoalSubject,
        completed: false,
        xp: Math.floor(Math.random() * 3 + 2) * 10,
        emoji,
        color,
      },
    ]);
    setNewGoalText("");
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10"
    >
      {/* Floating XP Particles Overlay */}
      <AnimatePresence>
        {floatingXPs.map((fxp) => (
          <motion.div
            key={fxp.id}
            initial={{ opacity: 0, y: fxp.y, x: fxp.x, scale: 0.5 }}
            animate={{ opacity: 1, y: fxp.y - 80, scale: 1.3 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed pointer-events-none z-50 flex items-center gap-1 font-bold text-sm text-indigo-600 dark:text-indigo-400 drop-shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>+{fxp.amount} XP</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Minimal Header welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome back, John Doe
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Here is your academic overview for today. Completed <strong>{completedCount}</strong> of <strong>{goals.length}</strong> tasks.
          </p>
        </div>

        {/* Badges in header */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/20 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 fill-orange-500 stroke-none animate-pulse" />
            <span>5 Day Streak</span>
          </div>

          {/* Level Progress */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20 text-xs font-bold shadow-sm">
            <Zap className="w-4 h-4" />
            <span>Scholar Lv. 3</span>
          </div>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Academic GPA", value: "3.84 / 4.0", desc: "Top 5% of class roster", icon: Award, accent: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20" },
          { title: "Weekly Focus", value: "24.5 hrs", desc: "+3 hrs vs last week", icon: Clock, accent: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20" },
          { title: "Attendance", value: "82.4%", desc: "Above 75% required safety", icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20" },
          { title: "Copilot Prompts", value: "48 Run", desc: "Notes & Chat query history", icon: Sparkles, accent: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20" },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-200/80 bg-card hover:border-indigo-500/30 shadow-sm transition-all duration-300 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">{stat.title}</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:translate-x-0.5 transition-transform duration-200">{stat.value}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{stat.desc}</span>
            </div>
            <div className={cn("p-2.5 rounded-xl border", stat.accent)}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Goals & Toolkit (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Checklist Card */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-card shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  Daily Study Goals
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ticking off items triggers floating XP boosts.</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={(e) => handleToggleGoal(goal.id, e)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none group",
                      goal.completed
                        ? "bg-muted/10 border-slate-200/40 opacity-60"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 hover:border-indigo-500/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        goal.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-700 bg-card group-hover:border-indigo-500"
                      )}>
                        {goal.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs">{goal.emoji}</span>
                      <span className={cn("text-xs font-semibold text-slate-800 dark:text-slate-200", goal.completed && "line-through text-slate-400 dark:text-slate-500")}>
                        {goal.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold border", goal.color)}>
                        {goal.subject}
                      </span>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold",
                        goal.completed ? "bg-muted text-slate-400" : "bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400"
                      )}>
                        +{goal.xp} XP
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {goals.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No tasks left! Add a study target below.
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Declare a new task..."
                className="flex-1 bg-white dark:bg-slate-900 text-xs rounded-xl px-4 py-3 border border-slate-200/80 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 dark:border-slate-800"
              />
              <div className="flex gap-2">
                <select
                  value={newGoalSubject}
                  onChange={(e) => setNewGoalSubject(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200/80 outline-none focus:border-indigo-500 dark:border-slate-800"
                >
                  <option value="Machine Learning">🧠 ML</option>
                  <option value="Operating Systems">💻 OS</option>
                  <option value="Discrete Math">📐 Math</option>
                  <option value="Placement Hub">📝 CV Prep</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add Goal
                </button>
              </div>
            </form>
          </div>

          {/* Quick Toolkit */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Academic Toolkit</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { title: "Ask AI Tutor", desc: "Solve study problems with AI chat", href: "/ai-tutor", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20" },
                { title: "AI Notes Gen", desc: "Compile textbooks in markdown", href: "/ai-notes", icon: BookOpen, color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20" },
                { title: "Recruiter Prep", desc: "Resume scorer & mock Q&As", href: "/placement", icon: Briefcase, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20" },
              ].map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <div className="group p-5 rounded-2xl border border-slate-200/80 bg-card hover:shadow-sm hover:border-indigo-500/30 transition-all duration-300 space-y-4 cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform duration-200", action.color)}>
                      <action.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {action.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Schedules & warning alerts */}
        <div className="space-y-8">
          
          {/* Deadlines Widget */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-card shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Deadlines & Schedules
              </h2>
              <Link href="/calendar" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
                Full Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {[
                { title: "Math 202 Midterm Exam", date: "Oct 22, 10:00 AM", badge: "Midterm", icon: "📐", color: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100" },
                { title: "CS 301 Lab Submission", date: "Oct 24, 11:59 PM", badge: "Project", icon: "💻", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100" },
                { title: "AI/ML Seminar Lecture", date: "Oct 25, 2:00 PM", badge: "Lecture", icon: "🧠", color: "bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border-violet-100" },
              ].map((evt, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex gap-3 group hover:border-indigo-500/20 transition-all cursor-default">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-card border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-base shadow-sm">
                    {evt.icon}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{evt.title}</h4>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold border", evt.color)}>
                        {evt.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{evt.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance warning */}
          <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/[0.05] dark:border-rose-950/30 dark:bg-rose-950/[0.05] shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Attendance Alert</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Your attendance in <strong>CS 301 (Operating Systems)</strong> is currently at <strong className="text-rose-500 font-bold">72.4%</strong>.
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-200/40 dark:border-slate-800">
              💡 You need to attend **at least 2 consecutive lectures** to secure your safety compliance threshold.
            </div>
            <Link href="/attendance" className="block text-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100/50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 py-2.5 rounded-xl transition-all">
              Manage Attendance Logs
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
