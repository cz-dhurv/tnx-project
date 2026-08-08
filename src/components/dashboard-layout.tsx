"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Gamified level progress states
  const [streak, setStreak] = useState(5);
  const [level, setLevel] = useState(3);
  const [xp, setXp] = useState(420);

  useEffect(() => {
    const handleXPGain = (e: Event) => {
      const amount = (e as CustomEvent).detail.amount;
      setXp((prev) => {
        const nextXp = prev + amount;
        if (nextXp >= 500) {
          setLevel((l) => l + 1);
          // Trigger a sound or custom animation if desired
          return nextXp - 500;
        }
        return nextXp;
      });
    };

    window.addEventListener("xp-gained", handleXPGain);
    return () => window.removeEventListener("xp-gained", handleXPGain);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar (Responsive) */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobileOpen={mobileSidebarOpen}
        setIsMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar
          setIsMobileOpen={setMobileSidebarOpen}
          streakCount={streak}
          level={level}
          xpPoints={xp}
        />

        {/* Scrollable Page Wrapper */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
