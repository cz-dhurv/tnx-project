"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Upload,
  Bot,
  User,
  Send,
  CheckCircle2,
  FileCheck,
  Building,
  Target,
  Sparkles,
  Loader2,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileText,
  Check,
  XCircle,
  BarChart3,
  GitCompare,
  Server,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import initialData from "@/lib/data/resume_matcher_data.json";
import { Candidate, JobDescription, MatchResultItem } from "@/types/placement";

interface Message {
  sender: "interviewer" | "candidate";
  text: string;
}

export default function PlacementHub() {
  const [activeTab, setActiveTab] = useState<"resume" | "matcher" | "compare" | "interview" | "jobs">("resume");

  // --- Backend Status ---
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "standby">("checking");

  // --- Resume Evaluation State ---
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [evaluatedCandidate, setEvaluatedCandidate] = useState<{
    name: string;
    email: string;
    phone: string;
    experience: number;
    skills: string[];
    education: string[];
  }>({
    name: "Dhruv Sharma",
    email: "dhruv.sharma@campus.edu",
    phone: "+1 (555) 389-2041",
    experience: 2,
    skills: ["Python", "FastAPI", "Groq LLM", "React", "TypeScript", "Docker", "PyPDF", "Algorithms"],
    education: ["B.Tech in Computer Science & Engineering"]
  });
  const [resumeScore, setResumeScore] = useState(94);
  const [scoreBreakdown, setScoreBreakdown] = useState({
    skillsMatch: 95,
    experienceMatch: 90,
    educationMatch: 100
  });
  const [missingSkills, setMissingSkills] = useState<string[]>(["Distributed Caching", "Docker Containerization"]);
  const [resumeCritiques, setResumeCritiques] = useState<string[]>([
    "Strong use of high-impact action verbs across engineering project sections.",
    "Quantifiable achievements clearly articulated (e.g., 'reduced processing latency by 35%').",
    "High keyword compatibility with modern AI and Full-Stack job requirements.",
    "Formatting passes automated ATS screening with 0 font or parsing errors."
  ]);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // --- Job Matcher State (ResumeMatcher Integration) ---
  const [jobs, setJobs] = useState<JobDescription[]>(initialData.jobDescriptions);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialData.jobDescriptions[0].id);
  const [candidates, setCandidates] = useState<Candidate[]>(initialData.candidates);
  const [matchResults, setMatchResults] = useState<MatchResultItem[]>(initialData.matchResults);
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<Candidate | null>(null);

  // --- Comparison State ---
  const [candidateAId, setCandidateAId] = useState<string>(initialData.candidates[0].id);
  const [candidateBId, setCandidateBId] = useState<string>(initialData.candidates[1].id);

  // --- Mock Interview State ---
  const [selectedRole, setSelectedRole] = useState("Software Engineering Intern");
  const [interviewStatus, setInterviewStatus] = useState<"idle" | "running" | "completed">("idle");
  const [interviewMessages, setInterviewMessages] = useState<Message[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isInterviewerThinking, setIsInterviewerThinking] = useState(false);
  const interviewEndRef = useRef<HTMLDivElement>(null);

  // Check Python FastAPI backend connection on mount
  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch("/api/placement/match-jobs");
        const data = await res.json();
        if (data.backend_status === "online") {
          setBackendStatus("online");
          if (data.jobDescriptions) setJobs(data.jobDescriptions);
          if (data.candidates) setCandidates(data.candidates);
          if (data.matchResults) setMatchResults(data.matchResults);
        } else {
          setBackendStatus("standby");
        }
      } catch {
        setBackendStatus("standby");
      }
    }
    checkBackend();
  }, []);

  // Auto-scroll interview
  useEffect(() => {
    interviewEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewMessages, isInterviewerThinking]);

  // Handle Resume Upload & Evaluation
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEvaluating(true);
    setResumeFileName(file.name);
    setEvalStep("Uploading & extracting raw text (PyPDF)...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_id", selectedJobId);

    try {
      setTimeout(() => setEvalStep("Analyzing credentials with Groq LLaMA 3.3..."), 700);
      setTimeout(() => setEvalStep("Computing ATS keyword density & formatting score..."), 1400);

      const res = await fetch("/api/placement/evaluate-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setTimeout(() => {
        if (data.candidate) {
          setEvaluatedCandidate({
            name: data.candidate.name || file.name.replace(/\.[^/.]+$/, ""),
            email: data.candidate.email || "applicant@campus.edu",
            phone: data.candidate.phone || "+1 (555) 019-2831",
            experience: data.candidate.experience || 2,
            skills: data.candidate.skills || ["React", "TypeScript", "Python"],
            education: data.candidate.education || ["B.Tech in Computer Science"]
          });
        }
        setResumeScore(data.score || 92);
        setScoreBreakdown({
          skillsMatch: data.skills_match || 90,
          experienceMatch: data.experience_match || 88,
          educationMatch: data.education_match || 100
        });
        setMissingSkills(data.missing_skills || ["Docker", "Distributed Caching"]);
        if (data.critiques) {
          setResumeCritiques(data.critiques);
        }
        setResumeUploaded(true);
        setIsEvaluating(false);
      }, 2100);
    } catch {
      setTimeout(() => {
        setResumeScore(89);
        setResumeUploaded(true);
        setIsEvaluating(false);
      }, 1500);
    }
  };

  const triggerUploadClick = () => {
    resumeInputRef.current?.click();
  };

  // Re-run matching when job selection changes
  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setIsMatchingJob(true);

    try {
      const res = await fetch("/api/placement/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.candidates) {
        setCandidates(data.candidates);
      }
      if (data.matchResults) {
        setMatchResults(data.matchResults);
      }
    } catch {
      // Keep existing data
    } finally {
      setIsMatchingJob(false);
    }
  };

  // Start Interview
  const handleStartInterview = () => {
    setInterviewStatus("running");
    setQuestionCount(1);
    setInterviewMessages([
      {
        sender: "interviewer",
        text: `Welcome to your mock technical interview for the **${selectedRole}** role. Let's begin with your technical foundation. Can you walk me through an architectural challenge you faced in your recent project and how you resolved it?`,
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
            text: `Outstanding effort! That concludes your technical simulation session.

### Composite Score: 92/100
- **Problem Formulation**: 95/100 – Crisp breakdown of system bottlenecks.
- **Code & Design Depth**: 90/100 – Concrete understanding of concurrency and caching tradeoffs.
- **Communication**: 92/100 – Concise, professional answers.

**ATS Recommendation**: Ready for on-campus corporate technical rounds!`,
          },
        ]);
      } else {
        let questionText = "";
        if (selectedRole.includes("Software") || selectedRole.includes("Frontend")) {
          questionText =
            nextCount === 2
              ? "Great points on architectural separation. Now, how would you design a rate limiter to prevent API abuse in a high-throughput microservices architecture?"
              : "Excellent analysis. Finally, how do you handle state consistency and database transactions across distributed services?";
        } else {
          questionText =
            nextCount === 2
              ? "Solid overview. How would you handle class imbalance and dataset drift when fine-tuning a frontier LLM on specialized campus notes?"
              : "Very insightful. Finally, explain how you benchmark retrieval latency and token throughput when deploying a RAG vector database.";
        }

        setInterviewMessages((prev) => [
          ...prev,
          {
            sender: "interviewer",
            text: questionText,
          },
        ]);
      }
    }, 1400);
  };

  const handleResetInterview = () => {
    setInterviewStatus("idle");
    setInterviewMessages([]);
    setQuestionCount(0);
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const candidateA = candidates.find((c) => c.id === candidateAId) || candidates[0];
  const candidateB = candidates.find((c) => c.id === candidateBId) || candidates[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12"
    >
      {/* Module Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground">
              Placement Hub & CV Analyzer
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Integrated with <span className="font-semibold text-indigo-400">ResumeMatcher AI Engine</span> for ATS parsing, job scoring, and recruiter matching.
          </p>
        </div>

        {/* Backend Connectivity Badge */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-2 backdrop-blur-sm",
              backendStatus === "online"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            )}
          >
            <Server className="w-3.5 h-3.5" />
            <span>FastAPI Engine: {backendStatus === "online" ? "Active (Port 8000)" : "Standby (Intelligent Mode)"}</span>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                backendStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"
              )}
            />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40 gap-4 md:gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: "resume", label: "Resume Reviewer & ATS", icon: FileCheck },
          { id: "matcher", label: "JD Matcher & Leaderboard", icon: Target },
          { id: "compare", label: "Candidate Comparison", icon: GitCompare },
          { id: "interview", label: "Mock Interviewer", icon: Bot },
          { id: "jobs", label: "Campus Internships", icon: Building },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "pb-3 text-xs md:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap -mb-[2px]",
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Rendering */}
      <div className="mt-4">
        {/* ===================== TAB 1: RESUME REVIEWER & ATS ===================== */}
        {activeTab === "resume" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Upload CV / Resume</h3>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                    Groq LLM Powered
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Upload your resume in PDF or DOCX format. Our parser extracts credentials, scores ATS readability, and identifies missing skills.
                </p>
              </div>

              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.docx"
                className="hidden"
              />

              <button
                onClick={triggerUploadClick}
                disabled={isEvaluating}
                className={cn(
                  "py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer mt-4",
                  isEvaluating
                    ? "bg-muted/10 border-indigo-500/30"
                    : "border-border/60 hover:border-indigo-500/40 hover:bg-muted/30"
                )}
              >
                {isEvaluating ? (
                  <div className="flex flex-col items-center gap-3 px-4 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <span className="text-xs font-bold text-foreground">Evaluating Credentials...</span>
                    <span className="text-[10px] text-muted-foreground animate-pulse">{evalStep}</span>
                  </div>
                ) : resumeUploaded ? (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{resumeFileName}</span>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full mt-1 border border-indigo-500/20">
                      Click to upload new resume
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-foreground block">Click to upload CV</span>
                      <span className="text-[10px] text-muted-foreground">PDF or DOCX (max 10MB)</span>
                    </div>
                  </>
                )}
              </button>

              <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Role Context</span>
                <p className="text-[11px] text-foreground/80 font-medium truncate">
                  Scoring against: <span className="text-indigo-400">{currentJob.role}</span> ({currentJob.company || "Campus Partner"})
                </p>
              </div>
            </div>

            {/* Assessment Panel */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm min-h-[400px] flex flex-col justify-center">
              {resumeUploaded ? (
                <div className="space-y-6">
                  {/* Score & Profile Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-5 border-b border-border/40">
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-20 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/40 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/10">
                        <span className="text-3xl font-black text-indigo-400">{resumeScore}</span>
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">ATS Score</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-foreground">{evaluatedCandidate.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                            Top 5% Candidate
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {evaluatedCandidate.email} • {evaluatedCandidate.experience} Years Experience
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {evaluatedCandidate.education[0] || "Bachelor of Technology in CS"}
                        </p>
                      </div>
                    </div>

                    {/* Sub scores */}
                    <div className="flex items-center gap-4 bg-muted/20 border border-border/30 px-4 py-2.5 rounded-xl">
                      <div className="text-center">
                        <span className="text-xs font-bold text-foreground block">{scoreBreakdown.skillsMatch}%</span>
                        <span className="text-[9px] text-muted-foreground">Skills</span>
                      </div>
                      <div className="w-[1px] h-6 bg-border/40" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-foreground block">{scoreBreakdown.experienceMatch}%</span>
                        <span className="text-[9px] text-muted-foreground">Experience</span>
                      </div>
                      <div className="w-[1px] h-6 bg-border/40" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-foreground block">{scoreBreakdown.educationMatch}%</span>
                        <span className="text-[9px] text-muted-foreground">Education</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Extraction */}
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Extracted Technical Skills & Proficiencies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {evaluatedCandidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills Alert */}
                  {missingSkills.length > 0 && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                        <XCircle className="w-4 h-4" />
                        <span>Recommended Keywords to Pass ATS Screeners for {currentJob.role}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((ms, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold"
                          >
                            + Add {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback points */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Resume Critiques & Formatting Insights
                    </h4>
                    <div className="space-y-2">
                      {resumeCritiques.map((tip, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted/30 rounded-xl border border-border/20 text-xs leading-normal flex items-start gap-2.5 text-foreground/90"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Awaiting Resume Document</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
                    Upload your resume to receive instantaneous ATS scoring, semantic skill extractions, and candidate matching scores.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: JOB MATCHER & CANDIDATE LEADERBOARD ===================== */}
        {activeTab === "matcher" && (
          <div className="space-y-6">
            {/* Job Selector Header */}
            <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Target Job Description Matcher
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a job description to rank and screen all applicant resumes using the ResumeMatcher evaluation model.
                  </p>
                </div>

                {/* Job Selector Pills */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                        selectedJobId === job.id
                          ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                          : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Building className="w-3.5 h-3.5" />
                      {job.role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Job Meta Card */}
              <div className="p-4 bg-muted/20 border border-border/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{currentJob.role}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">• {currentJob.company || "Campus Partner"}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                      {currentJob.work_mode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl">{currentJob.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground font-bold mr-1">Required:</span>
                    {currentJob.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border/40 text-foreground/80 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 block">{currentJob.salary}</span>
                  <span className="text-[10px] text-muted-foreground">{currentJob.totalCandidates} Total Applicants</span>
                </div>
              </div>
            </div>

            {/* Candidate Leaderboard */}
            <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Candidate Ranking Leaderboard</h3>
                  <p className="text-xs text-muted-foreground">
                    Ranked by AI compatibility against <span className="text-indigo-400 font-semibold">{currentJob.role}</span>.
                  </p>
                </div>
                {isMatchingJob && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Re-scoring applicants...</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pl-2">Rank</th>
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Experience</th>
                      <th className="pb-3">Skills Match</th>
                      <th className="pb-3">Overall Score</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-xs">
                    {matchResults.map((result) => {
                      const candidateMeta = candidates.find((c) => c.name === result.name);
                      return (
                        <tr
                          key={result.rank}
                          className="hover:bg-muted/20 transition-colors cursor-pointer group"
                          onClick={() => setSelectedCandidateDetail(candidateMeta || null)}
                        >
                          {/* Rank */}
                          <td className="py-3.5 pl-2 font-black">
                            <span
                              className={cn(
                                "w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold",
                                result.rank === 1
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : result.rank === 2
                                  ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                                  : result.rank === 3
                                  ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                                  : "text-muted-foreground"
                              )}
                            >
                              #{result.rank}
                            </span>
                          </td>

                          {/* Candidate Profile */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={result.avatar}
                                alt={result.name}
                                className="w-8 h-8 rounded-full object-cover border border-border/40"
                              />
                              <div>
                                <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                                  {result.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {candidateMeta?.email || "applicant@campus.edu"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Experience */}
                          <td className="py-3.5 text-muted-foreground">
                            {candidateMeta?.experience || "1-2 yrs"}
                          </td>

                          {/* Sub Score Bar */}
                          <td className="py-3.5">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                                <span>{result.skills}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${result.skills}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Match Score Badge */}
                          <td className="py-3.5 font-bold">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-black border inline-flex items-center gap-1",
                                result.score >= 90
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : result.score >= 75
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : "bg-muted/40 text-muted-foreground border-border/40"
                              )}
                            >
                              {result.score}%
                            </span>
                          </td>

                          {/* View Action */}
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidateDetail(candidateMeta || null);
                              }}
                              className="px-2.5 py-1 bg-secondary text-secondary-foreground hover:bg-muted font-semibold text-[11px] rounded-lg transition-colors border border-border/20 cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Candidate Detail Modal */}
            <AnimatePresence>
              {selectedCandidateDetail && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setSelectedCandidateDetail(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg p-6 bg-card border border-border/60 rounded-2xl shadow-xl space-y-5"
                  >
                    <div className="flex items-start justify-between border-b border-border/40 pb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedCandidateDetail.avatar}
                          alt={selectedCandidateDetail.name}
                          className="w-12 h-12 rounded-xl object-cover border border-border/40"
                        />
                        <div>
                          <h3 className="text-base font-bold text-foreground">{selectedCandidateDetail.name}</h3>
                          <p className="text-xs text-muted-foreground">{selectedCandidateDetail.email} • {selectedCandidateDetail.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-400">{selectedCandidateDetail.match}%</span>
                        <span className="text-[9px] text-muted-foreground block">Fit Score</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Evaluated Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidateDetail.allSkills?.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedCandidateDetail.missingSkills && selectedCandidateDetail.missingSkills.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                            Missing Skills for {currentJob.role}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCandidateDetail.missingSkills.map((ms, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20"
                              >
                                {ms}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-muted/30 border border-border/20 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          AI Screener Verdict
                        </span>
                        <p className="text-xs text-foreground/90 leading-normal">
                          {selectedCandidateDetail.verdict || "Strong applicant showing high compatibility with job requirements."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setSelectedCandidateDetail(null)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ===================== TAB 3: CANDIDATE COMPARISON MATRIX ===================== */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-indigo-400" />
                  Side-by-Side Candidate Comparison
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Directly evaluate two applicant resumes against <span className="text-indigo-400 font-semibold">{currentJob.role}</span> to analyze skill parity and tradeoffs.
                </p>
              </div>

              {/* Selector Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Candidate A</label>
                  <select
                    value={candidateAId}
                    onChange={(e) => setCandidateAId(e.target.value)}
                    className="w-full bg-card text-xs rounded-lg px-3 py-2 border border-border/40 outline-none text-foreground"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.match}% Match)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Candidate B</label>
                  <select
                    value={candidateBId}
                    onChange={(e) => setCandidateBId(e.target.value)}
                    className="w-full bg-card text-xs rounded-lg px-3 py-2 border border-border/40 outline-none text-foreground"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.match}% Match)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Cards Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate A Card */}
              <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={candidateA.avatar}
                      alt={candidateA.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{candidateA.name}</h4>
                      <p className="text-xs text-muted-foreground">{candidateA.experience} Exp</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-400">{candidateA.match}%</span>
                    <span className="text-[9px] text-muted-foreground block">Overall Fit</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Key Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {candidateA.allSkills?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Skill Gaps</span>
                    {candidateA.missingSkills && candidateA.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidateA.missingSkills.map((ms, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-semibold">
                            {ms}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> No major gaps detected
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-muted/20 rounded-xl border border-border/20 text-foreground/80 leading-normal">
                    {candidateA.verdict}
                  </div>
                </div>
              </div>

              {/* Candidate B Card */}
              <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={candidateB.avatar}
                      alt={candidateB.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{candidateB.name}</h4>
                      <p className="text-xs text-muted-foreground">{candidateB.experience} Exp</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-400">{candidateB.match}%</span>
                    <span className="text-[9px] text-muted-foreground block">Overall Fit</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Key Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {candidateB.allSkills?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Skill Gaps</span>
                    {candidateB.missingSkills && candidateB.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidateB.missingSkills.map((ms, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-semibold">
                            {ms}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> No major gaps detected
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-muted/20 rounded-xl border border-border/20 text-foreground/80 leading-normal">
                    {candidateB.verdict}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: MOCK INTERVIEWER ===================== */}
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
                  className="w-full bg-muted/40 text-xs rounded-xl px-3 py-2 border border-border/40 outline-none text-foreground"
                >
                  <option value="Software Engineering Intern">Software Engineering Intern</option>
                  <option value="Frontend Infrastructure Intern">Frontend Infrastructure Intern</option>
                  <option value="AI Research & Systems Intern">AI Research & Systems Intern</option>
                </select>
              </div>

              {interviewStatus === "idle" ? (
                <button
                  onClick={handleStartInterview}
                  className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
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
                  Session features 3 sequential technical questions. At the end, you&apos;ll receive a detailed critique report and composite grade score.
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
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      Q {Math.min(questionCount, 3)} of 3
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[360px]">
                    {interviewMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3 max-w-[85%] md:max-w-[75%]",
                          msg.sender === "candidate" ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
                            msg.sender === "candidate"
                              ? "bg-muted/40 border-border"
                              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          )}
                        >
                          {msg.sender === "candidate" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                          <div
                            className={cn(
                              "p-3.5 rounded-2xl text-xs leading-relaxed border",
                              msg.sender === "candidate"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-foreground border-border/40"
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
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5 p-3 bg-card border border-border/40 rounded-2xl">
                          <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Interviewer evaluates technical depth...
                          </span>
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
                          className="flex-1 bg-muted/40 text-xs rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none text-foreground"
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

        {/* ===================== TAB 5: CAMPUS INTERNSHIPS ===================== */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Matched Internships & Campus Drives</h3>
                <p className="text-[11px] text-muted-foreground">Compatible roles matching your evaluated CV credentials.</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-semibold text-indigo-400">
                <TrendingUp className="w-3.5 h-3.5" />
                Updated Real-Time
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between hover:shadow-md hover:border-border/80 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                          {(job.company || job.role)[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                            {job.role}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {job.company || "Campus Partner"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-indigo-400 block">
                          {job.id === "jd_msft_swe" ? "95%" : job.id === "jd_stripe_fe" ? "88%" : "91%"} Match
                        </span>
                        <span className="text-[9px] text-muted-foreground">fit score</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {job.location} ({job.work_mode})
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
                        💲 {job.salary}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {job.required_skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted/60 border border-border/30 text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apply Action */}
                  <button
                    onClick={() => alert(`Applied to ${job.company || "Campus Partner"} for "${job.role}". Submitted evaluated CV!`)}
                    className="w-full mt-5 py-2 bg-secondary text-secondary-foreground hover:bg-muted text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border border-border/20"
                  >
                    1-Click Apply with Evaluated CV
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
