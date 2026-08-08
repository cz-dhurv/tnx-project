"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Keyboard, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@university.edu");
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your CampusAI LMS Copilot preferences, credentials, and notification systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Navigation Menu */}
        <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm h-fit space-y-1">
          {[
            { label: "User Profile", icon: User, active: true },
            { label: "Notifications", icon: Bell, active: false },
            { label: "Security & Privacy", icon: Shield, active: false },
            { label: "Keyboard Shortcuts", icon: Keyboard, active: false },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  item.active
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/40 pb-3">
              Profile Configurations
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">University Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                  required
                />
              </div>
            </div>

            <h2 className="text-sm font-bold text-foreground border-b border-border/40 pb-3 pt-2">
              Notification Preferences
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/20 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Push Attendance Alerts</span>
                  <span className="text-[10px] text-muted-foreground">Notify me instantly if my attendance falls below 75%.</span>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotif}
                  onChange={(e) => setPushNotif(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/20 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Weekly Performance Summaries</span>
                  <span className="text-[10px] text-muted-foreground">Receive weekly metrics reports of study hours and GPA shifts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                {isSaved ? "Saved Successfully" : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
