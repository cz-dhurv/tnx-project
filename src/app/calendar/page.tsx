"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: number;
  day: number;
  title: string;
  category: "Exam" | "Assignment" | "Study Session" | "Personal";
  time: string;
}

export default function CalendarModule() {
  const [selectedDay, setSelectedDay] = useState<number>(22);
  const [filter, setFilter] = useState<string>("All");
  
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, day: 12, title: "OS Lab Shell Script", category: "Assignment", time: "11:59 PM" },
    { id: 2, day: 15, title: "Machine Learning Group Review", category: "Study Session", time: "3:00 PM" },
    { id: 3, day: 22, title: "Math 202 Midterm Exam", category: "Exam", time: "10:00 AM" },
    { id: 4, day: 24, title: "CS 301 Project Draft", category: "Assignment", time: "11:59 PM" },
    { id: 5, day: 25, title: "AI Healthcare Seminar", category: "Personal", time: "2:00 PM" },
    { id: 6, day: 28, title: "Database Normalization Prep", category: "Study Session", time: "5:00 PM" },
  ]);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent["category"]>("Study Session");
  const [newEventTime, setNewEventTime] = useState("12:00 PM");

  const categories: CalendarEvent["category"][] = ["Exam", "Assignment", "Study Session", "Personal"];

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    setEvents([
      ...events,
      {
        id: Date.now(),
        day: selectedDay,
        title: newEventTitle.trim(),
        category: newEventCategory,
        time: newEventTime,
      },
    ]);
    setNewEventTitle("");
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(events.filter((evt) => evt.id !== id));
  };

  const getCategoryStyles = (cat: CalendarEvent["category"]) => {
    switch (cat) {
      case "Exam":
        return "bg-rose-500 text-white dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20";
      case "Assignment":
        return "bg-violet-500 text-white dark:bg-violet-500/20 dark:text-violet-400 border-violet-500/20";
      case "Study Session":
        return "bg-indigo-500 text-white dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20";
      case "Personal":
        return "bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  const getCategoryDot = (cat: CalendarEvent["category"]) => {
    switch (cat) {
      case "Exam": return "bg-rose-500";
      case "Assignment": return "bg-violet-500";
      case "Study Session": return "bg-indigo-500";
      case "Personal": return "bg-emerald-500";
    }
  };

  // October 2026 Grid setup
  // October 2026 starts on a Thursday (4 blank slots if Sunday is start)
  const daysInMonth = 31;
  const blankDays = 4;
  const calendarCells = Array.from({ length: blankDays + daysInMonth }, (_, i) => {
    if (i < blankDays) return null;
    return i - blankDays + 1;
  });

  const filteredEvents = events.filter((e) => {
    if (filter === "All") return true;
    return e.category === filter;
  });

  const activeDayEvents = filteredEvents.filter((e) => e.day === selectedDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10"
    >
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-indigo-500" />
          Interactive Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organize classes, assignment deadlines, and exam schedules.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/40 pb-4">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-2">
          <Filter className="w-4 h-4" /> Filter Category:
        </span>
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
              filter === cat
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-card border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Calendar Grid (Takes 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-6">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">October 2026</h2>
            <div className="flex gap-1">
              <button className="p-2 border border-border/40 rounded-xl hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 border border-border/40 rounded-xl hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-bold text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dayEvents = filteredEvents.filter((e) => e.day === day);
              const isSelected = selectedDay === day;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square rounded-2xl border transition-all relative flex flex-col items-center justify-center cursor-pointer group",
                    isSelected
                      ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-card border-border/30 hover:border-indigo-500/40 hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  
                  {/* Event indicator dots */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1.5 flex gap-1 justify-center w-full">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <span
                          key={evt.id}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected ? "bg-white" : getCategoryDot(evt.category)
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Details & Add Event Form */}
        <div className="space-y-6">
          
          {/* Day Events Card */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
            <div className="border-b border-border/40 pb-3">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Event List</span>
              <h2 className="text-sm font-bold text-foreground">
                Events for October {selectedDay}, 2026
              </h2>
            </div>

            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {activeDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-muted/40 border border-border/20 rounded-xl flex items-center justify-between group hover:border-border/60 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block leading-tight">{evt.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", getCategoryStyles(evt.category))}>
                        {evt.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {evt.time}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="text-muted-foreground hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {activeDayEvents.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs leading-normal">
                  No events scheduled for this day. Click the form below to create one!
                </div>
              )}
            </div>
          </div>

          {/* Add Event Form */}
          <form onSubmit={handleAddEvent} className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-500" /> New Deadline / Event
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Event Title</label>
              <input
                type="text"
                placeholder="e.g. Prep Class Presentation"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Category</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-xl shadow cursor-pointer transition-colors"
            >
              Add to Oct {selectedDay}
            </button>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
