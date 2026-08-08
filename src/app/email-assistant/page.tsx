"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Sparkles,
  Clipboard,
  Check,
  RotateCw,
  Loader2,
  Send,
  User,
  HeartHandshake
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIEmailAssistant() {
  const [recipient, setRecipient] = useState("");
  const [relationship, setRelationship] = useState("Professor");
  const [purpose, setPurpose] = useState("Sick Leave Request");
  const [tone, setTone] = useState("Formal");
  const [context, setContext] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setDraft(null);

    setTimeout(() => {
      let sub = "";
      let body = "";
      const recName = recipient.trim() || (relationship === "Professor" ? "Professor Davis" : "Hiring Manager");

      if (purpose === "Sick Leave Request") {
        sub = `Absence Notice: CS 301 - John Doe`;
        body = `Dear ${recName},

I hope this email finds you well.

I am writing to inform you that I will be unable to attend the upcoming CS 301 lecture due to a sudden illness. I expect to make a full recovery soon and will ensure I catch up on all recorded slides and worksheets.

${context ? `Note: ${context}\n` : ""}
If there are any critical deliverables or worksheets due during this block, please let me know, and I will submit them remotely. Thank you for your understanding.

Sincerely,
John Doe
Student ID: #9042`;
      } else if (purpose === "Recommendation Letter Request") {
        sub = `Reference Request - John Doe`;
        body = `Dear ${recName},

I hope you are having a productive week.

I am preparing my application for the upcoming summer software engineering internships. Having thoroughly enjoyed your lectures on advanced algorithms last semester, I am writing to ask if you would be comfortable writing a strong letter of recommendation on my behalf.

${context ? `Additional context: ${context}\n` : ""}
I have attached my updated resume and course grades scorecard for your reference. Thank you so much for your guidance and time.

Best regards,
John Doe
john.doe@university.edu`;
      } else if (purpose === "Internship Follow-up") {
        sub = `Follow-up: Software Engineering Intern application - John Doe`;
        body = `Dear ${recName},

I hope you are well.

I wanted to follow up on my application for the Software Engineering Intern role that I submitted last week. I remain highly enthusiastic about joining the engineering team and contributing to your infrastructure projects.

${context ? `Context details: ${context}\n` : ""}
Please let me know if there are any additional qualifications or transcripts I can provide to support my application.

Best regards,
John Doe
+1 (555) 019-2834`;
      } else {
        sub = `Question regarding Lecture topics`;
        body = `Dear ${recName},

I hope you're having a great day.

I was reviewing the notes from our lecture today and had a quick question regarding the complexity trade-offs of the topic we covered. 

${context ? `Specific Query: ${context}\n` : "Specifically, I wanted to clarify how this approach behaves under edge constraints."}
I would appreciate any reading suggestions or brief explanations you could share, or I can drop by during your office hours if preferred.

Best regards,
John Doe`;
      }

      setSubject(sub);
      setDraft(body);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    if (!draft) return;
    const fullText = `Subject: ${subject}\n\n${draft}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Mail className="w-6 h-6 text-indigo-500" />
          AI Email Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Draft professional, tone-tailored correspondence for professors, recruiters, and team members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form (Takes 1 col) */}
        <div className="space-y-6">
          <form onSubmit={handleGenerate} className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Configure Drafter
            </h2>

            {/* Recipient Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Recipient Name</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Prof. Davis, Hiring Team..."
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              >
                <option value="Professor">Professor / Faculty</option>
                <option value="Recruiter">Recruiter / Employer</option>
                <option value="Peer">Peer / Group Member</option>
              </select>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              >
                <option value="Sick Leave Request">Request Sick Leave</option>
                <option value="Recommendation Letter Request">Ask for Recommendation Letter</option>
                <option value="Internship Follow-up">Follow up on Application</option>
                <option value="Question about Lecture">Question regarding Coursework</option>
              </select>
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tone Style</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Formal", "Urgent", "Polite"].map((tStyle) => (
                  <button
                    key={tStyle}
                    type="button"
                    onClick={() => setTone(tStyle)}
                    className={cn(
                      "py-2 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer",
                      tone === tStyle
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-background border-border/40 hover:border-border/80 text-muted-foreground"
                    )}
                  >
                    {tStyle}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional context */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Extra Context (Optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Had fever last night, reference project name, etc."
                rows={3}
                className="w-full bg-muted/40 text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Draft Email
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview (Takes 2 cols) */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm min-h-[450px] overflow-hidden">
          {draft ? (
            <>
              {/* Draft Header */}
              <div className="px-6 py-4 border-b border-border/40 bg-card flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Generated Output</span>
                  <h3 className="text-xs font-bold text-foreground">
                    Subject: {subject}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-1.5 bg-muted/50 hover:bg-muted text-foreground border border-border/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Full"}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-1.5 bg-secondary text-secondary-foreground hover:bg-muted border border-border/40 rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Draft Body */}
              <div className="flex-1 p-8 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <div style={{ whiteSpace: "pre-line" }} className="bg-muted/10 p-5 rounded-2xl border border-border/10 font-mono text-xs">
                  {draft}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground py-20">
              {isGenerating ? (
                <div className="space-y-4 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Polishing tone and structure...</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Generating formal academic greeting templates...</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-md space-y-3">
                  <Mail className="w-12 h-12 mx-auto text-indigo-500/50 mb-2 animate-pulse" />
                  <h3 className="text-sm font-bold text-foreground">Draft Board Awaiting</h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Enter recipient and details on the left, then click Draft to generate email text templates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
