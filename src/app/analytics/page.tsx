"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  Legend
} from "recharts";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  Clock,
  UserCheck,
  Award,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for Mock Analytics
interface GpaData {
  semester: string;
  gpa: number;
}

interface StudyData {
  day: string;
  hours: number;
  subject: string;
}

interface AttendanceData {
  subject: string;
  percentage: number;
}

export default function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);

  // Avoid Hydration Warnings by checking mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  const gpaData: GpaData[] = [
    { semester: "Semester 1", gpa: 3.42 },
    { semester: "Semester 2", gpa: 3.58 },
    { semester: "Semester 3", gpa: 3.65 },
    { semester: "Semester 4", gpa: 3.82 },
    { semester: "Semester 5 (Current)", gpa: 3.84 },
  ];

  const studyData: StudyData[] = [
    { day: "Mon", hours: 3.5, subject: "Math 202" },
    { day: "Tue", hours: 4.5, subject: "CS 301 (OS)" },
    { day: "Wed", hours: 5.2, subject: "DS 105 (ML)" },
    { day: "Thu", hours: 2.8, subject: "CS 305 (DB)" },
    { day: "Fri", hours: 4.0, subject: "Math 202" },
    { day: "Sat", hours: 6.5, subject: "Research Project" },
    { day: "Sun", hours: 3.0, subject: "Exam Prep" },
  ];

  const attendanceData: AttendanceData[] = [
    { subject: "CS 301", percentage: 72.4 },
    { subject: "MATH 202", percentage: 83.3 },
    { subject: "DS 105", percentage: 87.5 },
    { subject: "CS 305", percentage: 81.8 },
  ];

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
          <LineChartIcon className="w-6 h-6 text-indigo-500" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualize semester GPA progression, weekly study time allocation, and attendance compliance rates.
        </p>
      </div>

      {mounted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* GPA Progression (Spline Area) */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                GPA Semester Progression
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Cumulative GPA growth across academic blocks.</p>
            </div>
            
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gpaData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="semester" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} domain={[3.0, 4.0]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      fontSize: "11px",
                      borderRadius: "8px",
                      color: "var(--foreground)"
                    }}
                  />
                  <Area type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGpa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Study Hours (Rounded Bar) */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                Weekly Study Allocation
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Hours logged studying across the past 7 days.</p>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      fontSize: "11px",
                      borderRadius: "8px",
                      color: "var(--foreground)"
                    }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {studyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? "#8b5cf6" : "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Attendance compliance (Column with Reference line) */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                Subject Attendance Comparison
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Comparing lectures attended against the 75% legal safety line.</p>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="subject" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      fontSize: "11px",
                      borderRadius: "8px",
                      color: "var(--foreground)"
                    }}
                  />
                  <ReferenceLine y={75} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: '75% Required', fill: '#ef4444', fontSize: 8, position: 'top' }} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {attendanceData.map((entry, index) => {
                      const isLow = entry.percentage < 75;
                      return (
                        <Cell key={`cell-${index}`} fill={isLow ? "#ef4444" : "#10b981"} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Insights Cards */}
          <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                Academic Health Score
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Summary of learning metrics aggregated by AI.</p>
            </div>

            <div className="space-y-3 mt-4">
              {[
                { title: "Average Study Efficiency", score: "88%", desc: "Calculated based on daily goal compliance rate.", icon: Sparkles, color: "text-violet-500" },
                { title: "Grade Progression", score: "+4.2%", desc: "GPA has consistently risen semester-on-semester.", icon: ArrowUpRight, color: "text-emerald-500" },
              ].map((insight, idx) => (
                <div key={idx} className="p-4 bg-muted/40 border border-border/20 rounded-xl flex gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-card border border-border/30 flex items-center justify-center shadow-sm", insight.color)}>
                    <insight.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-xs font-bold text-foreground">{insight.title}</h4>
                      <span className="text-xs font-black text-indigo-500">{insight.score}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{insight.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
          <span className="text-xs text-muted-foreground">Initializing charting engines...</span>
        </div>
      )}
    </motion.div>
  );
}
