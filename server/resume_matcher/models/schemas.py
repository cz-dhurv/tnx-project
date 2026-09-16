from pydantic import BaseModel

class JobDescription(BaseModel):
    role: str
    summary: str | None = None
    required_skills: list[str]
    preferred_skills: list[str]
    minimum_experience: int | None = None
    education_requirements: list[str]
    responsibilities: list[str]
    employment_type: str | None
    location: str | None
    work_mode: str | None        # Remote / Hybrid / Onsite
    salary: str | None
    technologies: list[str]
    certifications: list[str]
    
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    years: int | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    education: list[str] = []
    total_experience: int | None = None
    skills: list[str] = []
    certifications: list[str] = []
    projects: list[str] = []
    experiences: list[Experience] = []

class MatchResult(BaseModel):
    score: float
    skills_match: float = 0.0
    education_match: float = 0.0
    experience_match: float = 0.0
    missing_skills: list[str] = []
    reason_for_mismatch: str = ""
    verdict: str = ""
    details: dict = {}