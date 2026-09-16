import { NextRequest, NextResponse } from "next/server";
import fallbackData from "@/lib/data/resume_matcher_data.json";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${FASTAPI_URL}/api/data`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        return NextResponse.json({
          ...data,
          backend_status: "online"
        });
      }
    }
  } catch {
    // FastAPI server not reachable, use pre-computed fallback
  }

  return NextResponse.json({
    ...fallbackData,
    backend_status: "offline"
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${FASTAPI_URL}/api/match-job/${jobId}`, {
        method: "POST",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        return NextResponse.json(result);
      }
    } catch {
      // Fallback
    }

    // Dynamic mock re-ranking based on chosen job
    const job = fallbackData.jobDescriptions.find((j) => j.id === jobId) || fallbackData.jobDescriptions[0];

    const reRankedCandidates = [...fallbackData.candidates].map((c) => {
      // Match candidate skills against job required skills
      const candidateSkills = c.allSkills || c.skills.split(", ");
      const matched = job.required_skills.filter((reqSkill) =>
        candidateSkills.some((s) => s.toLowerCase().includes(reqSkill.toLowerCase()))
      );
      const skillScore = Math.min(100, Math.round((matched.length / job.required_skills.length) * 100));
      const overallScore = Math.round(skillScore * 0.6 + 40);

      return {
        ...c,
        match: overallScore,
        skillsMatch: skillScore,
        missingSkills: job.required_skills.filter(
          (reqSkill) => !candidateSkills.some((s) => s.toLowerCase().includes(reqSkill.toLowerCase()))
        )
      };
    }).sort((a, b) => b.match - a.match);

    const matchResults = reRankedCandidates.map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      score: c.match,
      skills: c.skillsMatch || c.match,
      experience: c.experienceMatch || 85,
      education: c.educationMatch || 100,
      avatar: c.avatar,
      verdict: c.verdict,
      missingSkills: c.missingSkills
    }));

    return NextResponse.json({
      success: true,
      job,
      candidates: reRankedCandidates,
      matchResults,
      backend_status: "simulated"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matching failed" },
      { status: 500 }
    );
  }
}
