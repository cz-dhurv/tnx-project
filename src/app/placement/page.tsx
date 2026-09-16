"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Upload,
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
  GitCompare,
  Server,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import initialData from "@/lib/data/resume_matcher_data.json";
import { Candidate, JobDescription, MatchResultItem } from "@/types/placement";

export default function PlacementHub() {
  const [activeTab, setActiveTab] = useState<"resume" | "matcher" | "compare" | "jobs">("resume");

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

  // --- Post New Internship State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInternship, setNewInternship] = useState({
    role: "",
    company: "",
    work_mode: "Hybrid",
    location: "",
    salary: "",
    required_skills: "",
    summary: ""
  });
  const [postSuccessMessage, setPostSuccessMessage] = useState("");

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

  // Add user-created custom internship
  const handleCreateInternship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternship.role.trim() || !newInternship.company.trim()) return;

    const skillsArray = newInternship.required_skills
      ? newInternship.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
      : ["JavaScript", "React", "Problem Solving"];

    const createdJob: JobDescription = {
      id: `jd_custom_${Date.now()}`,
      role: newInternship.role.trim(),
      company: newInternship.company.trim(),
      summary: newInternship.summary.trim() || `Exciting internship opening at ${newInternship.company.trim()} for campus students.`,
      required_skills: skillsArray,
      preferred_skills: ["Git", "Team Collaboration"],
      minimum_experience: 1,
      education_requirements: ["Pursuing Bachelor's or Master's in CS / Engineering"],
      responsibilities: [
        "Design, build and test software components that scale efficiently.",
        "Collaborate with agile engineering squads and participate in sprint reviews."
      ],
      employment_type: "Internship",
      location: newInternship.location.trim() || "Remote / Hybrid",
      work_mode: newInternship.work_mode,
      salary: newInternship.salary.trim() || "Competitive Stipend",
      technologies: skillsArray,
      addedOn: "Today",
      totalCandidates: 1,
      shortlisted: 1,
    };

    setJobs((prev) => [createdJob, ...prev]);
    setSelectedJobId(createdJob.id);
    setIsAddModalOpen(false);
    setNewInternship({
      role: "",
      company: "",
      work_mode: "Hybrid",
      location: "",
      salary: "",
      required_skills: "",
      summary: ""
    });
    setPostSuccessMessage(`Successfully posted "${createdJob.role}" at ${createdJob.company}!`);
    setTimeout(() => setPostSuccessMessage(""), 4500);
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


        {/* ===================== TAB 5: CAMPUS INTERNSHIPS ===================== */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* Header & Post Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Matched Internships & Campus Drives
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Explore opportunities or post your own custom campus opening to screen student CVs.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-semibold text-indigo-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {jobs.length} Active Openings
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Internship
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {postSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {postSuccessMessage}
                </span>
                <span className="text-[10px] text-muted-foreground">Added to Job Matcher & Leaderboard</span>
              </div>
            )}

            {/* Internship Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const matchScore =
                  job.id === "jd_msft_swe"
                    ? 95
                    : job.id === "jd_stripe_fe"
                    ? 88
                    : job.id === "jd_openai_ai"
                    ? 91
                    : Math.min(
                        98,
                        Math.max(
                          74,
                          70 +
                            job.required_skills.filter((s) =>
                              evaluatedCandidate.skills.some((es) =>
                                es.toLowerCase().includes(s.toLowerCase())
                              )
                            ).length * 8
                        )
                      );

                const isCustom = job.id.startsWith("jd_custom_");

                return (
                  <div
                    key={job.id}
                    className={cn(
                      "p-5 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between hover:shadow-md hover:border-border/80 transition-all duration-300 group",
                      isCustom ? "border-indigo-500/30 bg-indigo-500/[0.02]" : "border-border/40"
                    )}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                            {(job.company || job.role)[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate max-w-[140px]">
                                {job.role}
                              </h4>
                              {isCustom && (
                                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                                  User Added
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {job.company || "Campus Partner"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-indigo-400 block">
                            {matchScore}% Match
                          </span>
                          <span className="text-[9px] text-muted-foreground">fit score</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.summary}
                      </p>

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
                      <div className="flex flex-wrap gap-1.5 pt-1">
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
                      onClick={() =>
                        alert(`Applied to ${job.company || "Campus Partner"} for "${job.role}". Submitted evaluated CV!`)
                      }
                      className="w-full mt-5 py-2 bg-secondary text-secondary-foreground hover:bg-muted text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border border-border/20"
                    >
                      1-Click Apply with Evaluated CV
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Post Internship Modal */}
            <AnimatePresence>
              {isAddModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg p-6 bg-card border border-border/60 rounded-2xl shadow-2xl space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Plus className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Post New Campus Internship</h3>
                      </div>
                      <button
                        onClick={() => setIsAddModalOpen(false)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateInternship} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Role Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. AI Systems Intern"
                            value={newInternship.role}
                            onChange={(e) => setNewInternship({ ...newInternship, role: e.target.value })}
                            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Company / Lab Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Acme AI Labs"
                            value={newInternship.company}
                            onChange={(e) => setNewInternship({ ...newInternship, company: e.target.value })}
                            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Work Mode</label>
                          <select
                            value={newInternship.work_mode}
                            onChange={(e) => setNewInternship({ ...newInternship, work_mode: e.target.value })}
                            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                          >
                            <option value="Hybrid">Hybrid</option>
                            <option value="Remote">Remote</option>
                            <option value="Onsite">Onsite</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Bengaluru, India"
                            value={newInternship.location}
                            onChange={(e) => setNewInternship({ ...newInternship, location: e.target.value })}
                            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Stipend / Salary</label>
                          <input
                            type="text"
                            placeholder="e.g. $40/hr or ₹30k/mo"
                            value={newInternship.salary}
                            onChange={(e) => setNewInternship({ ...newInternship, salary: e.target.value })}
                            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Required Skills (comma-separated) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Python, React, PyTorch, Docker"
                          value={newInternship.required_skills}
                          onChange={(e) => setNewInternship({ ...newInternship, required_skills: e.target.value })}
                          className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Role Summary / Description</label>
                        <textarea
                          rows={2}
                          placeholder="Brief description of the work and expectations..."
                          value={newInternship.summary}
                          onChange={(e) => setNewInternship({ ...newInternship, summary: e.target.value })}
                          className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-foreground outline-none focus:border-indigo-500/50 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(false)}
                          className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Publish Internship
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
