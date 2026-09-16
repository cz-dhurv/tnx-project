export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string;
  allSkills?: string[];
  match: number;
  skillsMatch?: number;
  experienceMatch?: number;
  educationMatch?: number;
  addedOn: string;
  avatar: string;
  resumeFile?: string;
  reasonForMismatch?: string;
  missingSkills?: string[];
  verdict?: string;
}

export interface JobDescription {
  id: string;
  role: string;
  company?: string;
  summary: string;
  required_skills: string[];
  preferred_skills: string[];
  minimum_experience: number;
  education_requirements: string[];
  responsibilities: string[];
  employment_type: string;
  location: string;
  work_mode: string;
  salary: string;
  technologies: string[];
  certifications?: string[];
  addedOn: string;
  totalCandidates: number;
  shortlisted: number;
}

export interface MatchResultItem {
  rank: number;
  name: string;
  score: number;
  skills: number;
  experience: number;
  education: number;
  avatar: string;
  verdict?: string;
  missingSkills?: string[];
}

export interface ResumeEvaluationResult {
  success: boolean;
  filename: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
    experience: number;
    skills: string[];
    education: string[];
  };
  score: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  missing_skills: string[];
  verdict: string;
  critiques: string[];
}
