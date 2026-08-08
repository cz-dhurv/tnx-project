"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { 
  Bell, 
  Sun, 
  Moon, 
  Flame, 
  Award, 
  Search, 
  Menu, 
  Check, 
  AlertTriangle, 
  Clock, 
  BookOpen 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavbarProps {
  setIsMobileOpen: (open: boolean) => void;
  streakCount?: number;
  level?: number;
  xpPoints?: number;
}

export default function Navbar({ setIsMobileOpen, streakCount = 5, level = 3, xpPoints = 420 }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "CS 301 Attendance Warning",
      description: "Your attendance in CS 301 has dropped to 72%. Attend 2 more classes to recover to 75%.",
      time: "10m ago",
      type: "warning",
      icon: AlertTriangle,
      read: false,
    },
    {
      id: 2,
      title: "AI Notes Generated",
      description: "Study notes for 'Machine Learning Foundations' are ready.",
      time: "2h ago",
      type: "success",
      icon: BookOpen,
      read: false,
    },
    {
      id: 3,
      title: "Upcoming Exam",
      description: "Math 202 Midterm is scheduled in 3 days.",
      time: "5h ago",
      type: "info",
      icon: Clock,
      read: true,
    },
  ]);

  // Avoid Hydration Mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/70 dark:bg-background/50 backdrop-blur-md border-b border-border/40 py-3.5 px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile menu & Page Title / Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes, schedules, courses..."
            className="w-full bg-muted/40 hover:bg-muted/60 focus:bg-background text-sm rounded-xl pl-10 pr-4 py-2 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right side: Gamification stats, Notifications, Profile, Theme Switcher */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Gamified elements */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold text-xs shadow-sm">
            <Flame className="w-4 h-4 fill-violet-500 stroke-violet-500 animate-bounce" />
            <span>{streakCount} Day Streak</span>
          </div>

          {/* Level Badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs shadow-sm">
            <Award className="w-4 h-4" />
            <span>Lv. {level} ({xpPoints} XP)</span>
          </div>
        </div>

        {/* Theme Switcher */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border/40 bg-card/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-border/40 bg-card/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Click outside backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Dropdown Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications</span>
                    <div className="flex gap-2">
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Mark read
                      </button>
                      <span className="text-muted-foreground text-xs">•</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const IconComponent = n.icon;
                        return (
                          <div
                            key={n.id}
                            className={cn(
                              "p-4 flex gap-3 transition-colors",
                              !n.read ? "bg-indigo-500/5 dark:bg-indigo-500/[0.02]" : "hover:bg-muted/20"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                              n.type === "warning" && "bg-rose-500/10 text-rose-500",
                              n.type === "success" && "bg-emerald-500/10 text-emerald-500",
                              n.type === "info" && "bg-indigo-500/10 text-indigo-500"
                            )}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className={cn("text-xs font-semibold", !n.read ? "text-foreground" : "text-muted-foreground")}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-normal">
                                {n.description}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <Check className="w-8 h-8 mb-2 text-indigo-500" />
                        <span className="text-xs font-semibold">You're all caught up!</span>
                        <p className="text-[10px] max-w-[200px] mt-1">
                          No new notifications. Good work keeping on track!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
