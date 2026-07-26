"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquareText,
  FileText,
  Briefcase,
  CalendarDays,
  UserCheck,
  Calendar,
  Mail,
  LineChart,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Tutor", href: "/ai-tutor", icon: MessageSquareText, badge: "AI" },
    { name: "AI Notes Gen", href: "/ai-notes", icon: FileText, badge: "New" },
    { name: "Placement Hub", href: "/placement", icon: Briefcase },
    { name: "Study Planner", href: "/planner", icon: CalendarDays },
    { name: "Attendance", href: "/attendance", icon: UserCheck },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Email Assistant", href: "/email-assistant", icon: Mail },
    { name: "Analytics", href: "/analytics", icon: LineChart },
  ];

  const sidebarVariants = {
    expanded: { width: "260px" },
    collapsed: { width: "80px" }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card/60 dark:bg-card/40 backdrop-blur-md border-r border-border/40 py-6 px-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 text-white">
          <GraduationCap className="w-6 h-6 animate-pulse" />
        </div>
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="font-bold text-lg leading-none bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                CampusAI
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">LMS Copilot</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-indigo-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "text-primary scale-110" : "group-hover:scale-110"
                )} />

                <AnimatePresence mode="wait">
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium flex-1 truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge && isOpen && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                    item.badge === "AI" 
                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" 
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border/40 pt-4 space-y-1.5 px-1">
        <Link href="/settings" onClick={() => setIsMobileOpen(false)}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300 cursor-pointer">
            <Settings className="w-5 h-5" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* Sign Out Button */}
        <div
          onClick={() => {
            setIsMobileOpen(false);
            window.dispatchEvent(new CustomEvent("campusai-signout"));
          }}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* User Card */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl mt-2 bg-muted/40 border border-border/20",
          isOpen ? "px-3" : "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow">
            JD
          </div>
          {isOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-foreground leading-none">John Doe</span>
              <span className="text-[10px] text-muted-foreground truncate mt-0.5">john.doe@university.edu</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        animate={isOpen ? "expanded" : "collapsed"}
        variants={sidebarVariants}
        className="hidden md:block h-screen sticky top-0 z-30 flex-shrink-0"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative h-full">
          {navContent}
          
          {/* Collapse Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute top-8 -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow hover:shadow-md transition-all duration-200 z-50 cursor-pointer"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Drawer (Overlay and Sidebar container) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-[280px] h-full flex flex-col z-50"
            >
              {navContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
