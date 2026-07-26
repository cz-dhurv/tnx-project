"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all credential fields.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("campusai_auth", "true");
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* Left Column: Form Card */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 bg-white dark:bg-slate-950 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-slate-50">
            CampusAI
          </span>
        </div>

        <div className="max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {isLogin ? "Sign in to CampusAI" : "Create scholar profile"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLogin ? "Enter credentials to access your study space." : "Initialize a portfolio and start earning XP."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@university.edu"
                  className="w-full bg-slate-50 dark:bg-slate-900 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 text-xs rounded-xl pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  {isLogin ? "Log In" : "Register"}
                </>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700"
            >
              {isLogin ? "New user? Create a profile" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Sidebar Display */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 dark:bg-slate-900 flex-col justify-between p-12 text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800 relative">
        <div className="absolute right-10 top-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Next.js 15+ Template</span>
        </div>

        <div className="space-y-6 max-w-sm my-auto">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            Smart LMS Copilot for Students
          </h1>
          
          <div className="space-y-4">
            {[
              { text: "Generate markdown revision files and textbooks in seconds.", icon: "📚" },
              { text: "Solve practice lecture question guides with AI Tutor.", icon: "🧙‍♂️" },
              { text: "Evaluate your CV compatibility scores w.r.t tech jobs.", icon: "🤖" },
              { text: "Maintain course compliance (consecutive classes safety analysis).", icon: "📊" },
            ].map((tip, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-normal">
                <span className="text-sm">{tip.icon}</span>
                <span className="text-slate-500 dark:text-slate-400">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          © 2026 CampusAI Portal. All mock assets validated.
        </div>
      </div>
    </div>
  );
}
