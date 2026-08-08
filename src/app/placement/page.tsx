"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Upload,
  Bot,
  User,
  Send,
  Star,
  CheckCircle,
  FileCheck,
  Building,
  Target,
  Sparkles,
  Loader2,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  sender: "interviewer" | "candidate";
  text: string;
}

export default function PlacementHub() {
  const [activeTab, setActiveTab] = useState<"resume" | "interview" | "jobs">("resume");

  // --- Resume Evaluation State ---
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeScore, setResumeScore] = useState(0);
  const [resumeFeedback, setResumeFeedback] = useState<string[]>([]);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // --- Mock Interview State ---
  const [selectedRole, setSelectedRole] = useState("Frontend Engineer");
  const [interviewStatus, setInterviewStatus] = useState<"idle" | "running" | "completed">("idle");
  const [interviewMessages, setInterviewMessages] = useState<Message[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isInterviewerThinking, setIsInterviewerThinking] = useState(false);
  const interviewEndRef = useRef<HTMLDivElement>(null);

  // --- Job Matcher Mock Data ---
  const mockJobs = [
    {
      id: 1,
      title: "Frontend Developer Intern",
      company: "Stripe",
      location: "San Francisco, CA (Hybrid)",
      match: 94,
      skills: ["React", "TypeScript", "Next.js"],
      salary: "$45 - $60 / hr",
      logo: "S",
      color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    },
    {
      id: 2,
      title: "Associate Product Manager Intern",
      company: "Google",
      location: "Mountain View, CA (Onsite)",
      match: 88,
      skills: ["Product Strategy", "User Research", "SQL"],
      salary: "$50 - $65 / hr",
      logo: "G",
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    },
    {
      id: 3,
      title: "AI Engineer Co-op",
      company: "OpenAI",
      location: "San Francisco, CA (Hybrid)",
      match: 81,
      skills: ["Python", "PyTorch", "LLMs"],
      salary: "$60 - $80 / hr",
      logo: "O",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    },
  ];

  // Auto-scroll interview
  useEffect(() => {
    interviewEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages, isInterviewerThinking]);

  // Handle Resume Upload & Eval
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEvaluating(true);
    setResumeFileName(file.name);
    
    setTimeout(() => {
      setResumeScore(84);
      setResumeFeedback([
        "Strong use of action verbs in your project details.",
        "Your education section matches top engineering expectations.",
        "⚠️ Focus: Add more quantitative metrics (e.g. 'Improved latency by 20%').",
        "⚠️ Focus: Your skills list is slightly cluttered; group them by category.",
      ]);
      setResumeUploaded(true);
      setIsEvaluating(false);
    }, 2000);
  };

  const triggerUploadClick = () => {
    resumeInputRef.current?.click();
  };

  // Start Interview
  const handleStartInterview = () => {
    setInterviewStatus("running");
    setQuestionCount(1);
    setInterviewMessages([
      {
        sender: "interviewer",
        text: `Welcome to your mock interview for the **${selectedRole}** role. Let's start with the basics. Can you explain why you are interested in this position, and walk me through a relevant project?`,
      },
    ]);
  };

  const handleSendInterviewAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewInput.trim()) return;

    const candidateMsg: Message = {
      sender: "candidate",
      text: interviewInput.trim(),
    };

    setInterviewMessages((prev) => [...prev, candidateMsg]);
    setInterviewInput("");
    setIsInterviewerThinking(true);

    setTimeout(() => {
      setIsInterviewerThinking(false);
      const nextCount = questionCount + 1;
      setQuestionCount(nextCount);

      if (nextCount > 3) {
        setInterviewStatus("completed");
        setInterviewMessages((prev) => [
          ...prev,
          {
            sender: "interviewer",
            text: `Excellent. That concludes our practice session! 

### Performance Score: 88/100

**Strengths**: You articulated architectural tradeoffs very clearly.
**Areas to Improve**: Ensure you address error handling and fallback patterns when building high-scale code.`,
          },
        ]);
      } else {
        let questionText = "";
        if (selectedRole === "Frontend Engineer") {
          questionText = nextCount === 2 
            ? "Excellent project summary. Now, explain how you would optimize a React application suffering from frequent re-renders."
            : "Great points. Finally, how do you handle state management across deeply nested components in Next.js? Discuss Server vs Client component differences.";
        } else if (selectedRole === "Data Scientist") {
          questionText = nextCount === 2
            ? "Interesting approach. How would you handle class imbalance in a classification dataset?"
            : "Perfect. Now, can you explain the bias-variance tradeoff in machine learning algorithms?";
        } else {
          questionText = nextCount === 2
            ? "Strong user perspective. How do you prioritize features on a product roadmap when working with limited engineering resources?"
            : "Excellent answer. Finally, how would you measure the success of launching a dark mode feature on our platform?";
        }

        setInterviewMessages((prev) => [
          ...prev,
          {
            sender: "interviewer",
            text: questionText,
          },
        ]);
      }
    }, 1500);
  };

  const handleResetInterview = () => {
    setInterviewStatus("idle");
    setInterviewMessages([]);
    setQuestionCount(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10"
    >
      {/* Module Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-500" />
          Placement Hub & CV Analyzer
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit your credentials, prep for technical mock interviews, and find match scores for campus recruitments.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40 gap-6">
        {[
          { id: "resume", label: "Resume Reviewer", icon: FileCheck },
          { id: "interview", label: "Mock Interviewer", icon: Bot },
          { id: "jobs", label: "Internship Matcher", icon: Target },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 -mb-[2px]",
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <TabIcon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Rendering */}
      <div className="mt-4">
        {activeTab === "resume" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Upload CV / Resume</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Upload your CV in PDF format. Our algorithm will score your formatting, wording, and compatibility w.r.t tech jobs.
                </p>
              </div>

              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeUpload}
                accept=".pdf"
                className="hidden"
              />

              <button
                onClick={triggerUploadClick}
                disabled={isEvaluating}
                className={cn(
                  "py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer mt-4",
                  isEvaluating ? "bg-muted/10 border-indigo-500/20" : "border-border/60 hover:border-indigo-500/40 hover:bg-muted/30"
                )}
              >
                {isEvaluating ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Calculating Score...</span>
                  </div>
                ) : resumeUploaded ? (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{resumeFileName}</span>
                    <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full mt-1">
                      Click to re-upload
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-foreground block">Click to upload CV</span>
                      <span className="text-[10px] text-muted-foreground">PDF formats only</span>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Assessment Panel */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm min-h-[300px] flex flex-col justify-center">
              {resumeUploaded ? (
                <div className="space-y-6">
                  {/* Score Indicator */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-4 border-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/5">
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{resumeScore}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">/100</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                        Impressive Credentials
                        <Sparkles className="w-4 h-4 text-violet-500 animate-spin" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-normal max-w-md">
                        Your CV ranks higher than 84% of candidates applying for frontend roles at university databases. Review critiques to boost to 95+.
                      </p>
                    </div>
                  </div>

                  {/* Feedback points */}
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Formatting & Content Critiques</h4>
                    <div className="space-y-2.5">
                      {resumeFeedback.map((tip, idx) => (
                        <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border/20 text-xs leading-normal">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <FileCheck className="w-12 h-12 mx-auto text-indigo-500/50 mb-3 animate-bounce" />
                  <h3 className="text-sm font-bold text-foreground">Awaiting Upload</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-normal">
                    Provide a resume to generate an instant rating report and professional critiques.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "interview" && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">
            {/* Left selector */}
            <div className="w-full lg:w-72 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm h-fit space-y-4">
              <h3 className="text-sm font-bold text-foreground">Configure Mock Session</h3>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Select Job Profile</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={interviewStatus === "running"}
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none"
                >
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              {interviewStatus === "idle" ? (
                <button
                  onClick={handleStartInterview}
                  className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Start Interview Prep
                </button>
              ) : (
                <button
                  onClick={handleResetInterview}
                  className="w-full py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Reset / Close Session
                </button>
              )}

              <div className="p-3.5 bg-muted/30 border border-border/20 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Rules</span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Session features 3 sequential questions. At the end, you'll receive a detailed critique report and composite grade score.
                </p>
              </div>
            </div>

            {/* Interview Chat Interface */}
            <div className="flex-1 flex flex-col rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden min-h-[400px]">
              {interviewStatus !== "idle" ? (
                <>
                  {/* Chat header */}
                  <div className="px-5 py-3 border-b border-border/40 bg-card flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Interactive Mock Board</span>
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 px-2 py-0.5 rounded-full font-bold">
                      Q {questionCount} of 3
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[350px]">
                    {interviewMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3 max-w-[85%] md:max-w-[75%]",
                          msg.sender === "candidate" ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
                          msg.sender === "candidate" ? "bg-muted/40 border-border" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                        )}>
                          {msg.sender === "candidate" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                          <div
                            className={cn(
                              "p-3.5 rounded-2xl text-xs leading-relaxed border",
                              msg.sender === "candidate" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border/40"
                            )}
                            style={{ whiteSpace: "pre-line" }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isInterviewerThinking && (
                      <div className="flex gap-3 max-w-[75%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5 p-3 bg-card border border-border/40 rounded-2xl">
                          <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Interviewer evaluates response...</span>
                        </div>
                      </div>
                    )}
                    <div ref={interviewEndRef} />
                  </div>

                  {/* Input container */}
                  {interviewStatus === "running" && (
                    <div className="p-4 border-t border-border/40 bg-card">
                      <form onSubmit={handleSendInterviewAnswer} className="flex gap-2">
                        <input
                          type="text"
                          value={interviewInput}
                          onChange={(e) => setInterviewInput(e.target.value)}
                          placeholder="Type your response here..."
                          className="flex-1 bg-muted/40 text-xs rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!interviewInput.trim()}
                          className="px-4 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-xs rounded-xl transition-all shadow flex items-center justify-center cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground py-16">
                  <Bot className="w-12 h-12 text-indigo-500/45 mb-2 animate-bounce" />
                  <h3 className="text-sm font-bold text-foreground">Awaiting Interviewee</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-normal">
                    Select a target job profile on the left and click start to initiate a live simulation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Matched Internships</h3>
                <p className="text-[11px] text-muted-foreground">Compatible roles matching your CV skills list.</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-semibold text-indigo-500">
                <TrendingUp className="w-3.5 h-3.5" />
                Updated Today
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between hover:shadow-md hover:border-border/80 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold border", job.color)}>
                          {job.logo}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                            {job.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {job.company}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 block">
                          {job.match}% Match
                        </span>
                        <span className="text-[9px] text-muted-foreground">compatibility</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
                        💲 {job.salary}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {job.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted/60 border border-border/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apply Action */}
                  <button
                    onClick={() => alert(`Simulated application to ${job.company} for "${job.title}". Submitted CV!`)}
                    className="w-full mt-5 py-2 bg-secondary text-secondary-foreground hover:bg-muted/80 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border border-border/20"
                  >
                    Apply Now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
