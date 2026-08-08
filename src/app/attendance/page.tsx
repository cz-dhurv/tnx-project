"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  UserCheck,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassSubject {
  id: number;
  code: string;
  name: string;
  attended: number;
  total: number;
}

export default function AttendanceTracker() {
  const [subjects, setSubjects] = useState<ClassSubject[]>([
    { id: 1, code: "CS 301", name: "Operating Systems & Kernels", attended: 21, total: 29 },
    { id: 2, code: "MATH 202", name: "Discrete Structures & Linear Algebra", attended: 25, total: 30 },
    { id: 3, code: "DS 105", name: "Introduction to Machine Learning", attended: 28, total: 32 },
    { id: 4, code: "CS 305", name: "Database Engineering Systems", attended: 18, total: 22 },
  ]);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    setSubjects([
      ...subjects,
      {
        id: Date.now(),
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        attended: 0,
        total: 0,
      },
    ]);
    setNewCode("");
    setNewName("");
  };

  const handleUpdate = (id: number, type: "attend" | "miss" | "remove_attend" | "remove_miss") => {
    setSubjects(
      subjects.map((sub) => {
        if (sub.id === id) {
          let att = sub.attended;
          let tot = sub.total;

          if (type === "attend") {
            att += 1;
            tot += 1;
          } else if (type === "miss") {
            tot += 1;
          } else if (type === "remove_attend") {
            if (att > 0 && tot > 0) {
              att -= 1;
              tot -= 1;
            }
          } else if (type === "remove_miss") {
            if (tot > att) {
              tot -= 1;
            }
          }
          return { ...sub, attended: att, total: tot };
        }
        return sub;
      })
    );
  };

  // Helper calculations for specific subjects
  const getSubjectMetrics = (sub: ClassSubject) => {
    const percent = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
    const isSafe = percent >= 75;

    // Consecutive classes to attend to reach 75%
    // (attended + x) / (total + x) >= 0.75  =>  x >= 3 * total - 4 * attended
    const neededToRecover = !isSafe
      ? Math.max(0, Math.ceil(3 * sub.total - 4 * sub.attended))
      : 0;

    // Consecutive classes you can miss before dropping below 75%
    // attended / (total + y) >= 0.75  =>  y <= (4 * attended - 3 * total) / 3
    const canMiss = isSafe
      ? Math.max(0, Math.floor((4 * sub.attended - 3 * sub.total) / 3))
      : 0;

    return {
      percent: Math.round(percent * 10) / 10,
      isSafe,
      neededToRecover,
      canMiss,
    };
  };

  // Aggregate metrics
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 0;

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
          <UserCheck className="w-6 h-6 text-indigo-500" />
          Attendance Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log lectures daily, track academic compliance, and review safe-threshold criteria.
        </p>
      </div>

      {/* Aggregate Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card/60 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Overall lectures</span>
            <div className="text-lg font-bold text-foreground">
              {totalAttended} <span className="text-xs text-muted-foreground">attended of</span> {totalClasses}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Overall Compliance</span>
            <span className={cn(overallPercentage >= 75 ? "text-emerald-500" : "text-rose-500")}>
              {overallPercentage}%
            </span>
          </div>
          <div className="w-full bg-muted dark:bg-muted/30 h-2.5 rounded-full overflow-hidden border border-border/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                overallPercentage >= 75 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"
              )}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <div className={cn(
            "px-4 py-2 rounded-xl border font-bold text-xs shadow-sm flex items-center gap-1.5",
            overallPercentage >= 75
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          )}>
            {overallPercentage >= 75 ? (
              <>
                <CheckCircle className="w-4 h-4" /> Safe Threshold Status
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" /> Compliance Warning
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table & Controllers (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground">Course Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                    <th className="pb-3 pr-2">Subject</th>
                    <th className="pb-3 text-center">Lectures attended</th>
                    <th className="pb-3 text-center">Percentage</th>
                    <th className="pb-3 text-right">Quick Logging</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {subjects.map((sub) => {
                    const metrics = getSubjectMetrics(sub);
                    return (
                      <tr key={sub.id} className="group hover:bg-muted/10 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="font-bold text-foreground">{sub.code}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[150px] sm:max-w-none">{sub.name}</div>
                        </td>
                        <td className="py-4 text-center font-bold text-foreground">
                          {sub.attended} / {sub.total}
                        </td>
                        <td className="py-4 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-bold",
                            metrics.isSafe
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          )}>
                            {metrics.percent}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdate(sub.id, "attend")}
                              className="px-2.5 py-1 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer text-[10px]"
                            >
                              + Present
                            </button>
                            <button
                              onClick={() => handleUpdate(sub.id, "miss")}
                              className="px-2.5 py-1 bg-muted border border-border/40 hover:bg-muted/70 text-foreground font-semibold rounded-lg transition-colors cursor-pointer text-[10px]"
                            >
                              + Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Course Form */}
          <form onSubmit={handleAddSubject} className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-500" /> Add Subject Course
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="e.g. CS 402"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="bg-muted/40 text-xs rounded-xl px-4 py-2 border border-border/40 outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="e.g. Compiler Construction"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted/40 text-xs rounded-xl px-4 py-2 border border-border/40 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-xl shadow cursor-pointer transition-colors"
            >
              Add Course
            </button>
          </form>
        </div>

        {/* Warning & Insights Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-foreground">Compliance Metrics</h2>
            
            <div className="space-y-4">
              {subjects.map((sub) => {
                const metrics = getSubjectMetrics(sub);
                return (
                  <div key={sub.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{sub.code}</span>
                      <span className={metrics.isSafe ? "text-emerald-500" : "text-rose-500"}>
                        {metrics.percent}%
                      </span>
                    </div>

                    {metrics.isSafe ? (
                      <div className="text-[10px] text-emerald-500 leading-normal flex items-start gap-1">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          Safe. You can miss up to <strong>{metrics.canMiss}</strong> class{metrics.canMiss !== 1 && "es"} consecutively before dropping below 75%.
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-rose-500 leading-normal flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          Action Required: Attend <strong>{metrics.neededToRecover}</strong> lecture{metrics.neededToRecover !== 1 && "s"} consecutively to restore 75%.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
