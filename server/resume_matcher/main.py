import time
import os
import json
from datetime import datetime
from pathlib import Path
from config import LLM_CALL_DELAY, RESUME_FILE_PATH, JOB_DESCRIPTION_FILE_PATH
from services.job_parser import parse_job_description
from services.matcher import score_resume
from services.resume_parser import parse_resume
from utils.file_reader import read_resume

def load_job_description(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Job description file not found: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
    
def process_resume(resume_file_path: str, job_description_file_path: str):
    # Load and parse the job description
    results = []
    folder = Path(resume_file_path)
    job_description_text = load_job_description(job_description_file_path)
    job_description_data = parse_job_description(job_description_text)
    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in ['.pdf', '.docx']:
            print(f"Processing resume: {file_path.name}")
            resume_text = read_resume(file_path)
            if resume_text:
                resume_data = parse_resume(resume_text)
                time.sleep(LLM_CALL_DELAY)
                result = score_resume(resume_data, job_description_data)
                
                # Copy file to public folder for UI to serve
                import shutil
                public_resumes = Path("ui/public/resumes")
                public_resumes.mkdir(parents=True, exist_ok=True)
                dest_file = public_resumes / file_path.name
                shutil.copy2(file_path, dest_file)
                
                results.append({
                    "name": resume_data.name or file_path.stem,
                    "email": resume_data.email,
                    "phone": resume_data.phone,
                    "experience": resume_data.total_experience,
                    "skills": resume_data.skills,
                    "score": result.score,
                    "skills_match": result.skills_match,
                    "education_match": result.education_match,
                    "experience_match": result.experience_match,
                    "details": result.details,
                    "resume_file": file_path.name
                })
                time.sleep(LLM_CALL_DELAY)  # Delay to avoid rate limiting
                
            else:
                print(f"Failed to read resume: {file_path.name}")
    return results

def main():
    job_description = load_job_description(JOB_DESCRIPTION_FILE_PATH)
    job = parse_job_description(job_description)

    print("MINIMUM EXPERIANCE:", job.minimum_experience)
    print()
    print(job.required_skills)

    all_results = process_resume(RESUME_FILE_PATH, JOB_DESCRIPTION_FILE_PATH)
    all_results.sort(key=lambda candidate: candidate["score"], reverse=True)
    
    # Generate Ponytail static data JSON for UI
    stats = {
        "totalJobs": 1,
        "totalResumes": len(all_results),
        "matches": len([r for r in all_results if r['score'] >= 70]),
        "shortlisted": len([r for r in all_results if r['score'] >= 85]),
    }
    recentJobs = [
        {"title": job.role, "date": datetime.now().strftime("%d %b %Y"), "candidates": len(all_results)}
    ]
    topCandidates = [
        {
            "id": r.get("id", str(i)),
            "name": r["name"], 
            "role": job.role, 
            "score": r["score"], 
            "avatar": f"https://i.pravatar.cc/80?u={r['name']}"
        } 
        for i, r in enumerate(all_results[:4])
    ]
    candidates = [
        {
            "id": r.get("id", str(i)), 
            "name": r["name"], 
            "email": r["email"] or f"{r['name'].replace(' ', '').lower()}@example.com", 
            "phone": r.get("phone") or "N/A",
            "experience": f"{r['experience']} yrs" if r['experience'] else "N/A", 
            "skills": ", ".join(r["skills"][:3]) if r["skills"] else "N/A", 
            "match": r["score"], 
            "addedOn": datetime.now().strftime("%d %b %Y"), 
            "avatar": f"https://i.pravatar.cc/80?u={r['name']}",
            "resumeFile": r.get("resume_file")
        }
        for i, r in enumerate(all_results)
    ]
    
    matchResults = [
        {
            "rank": i + 1,
            "name": r["name"],
            "score": r["score"],
            "skills": r.get("skills_match", r["score"]),
            "experience": r.get("experience_match", 90 if r["experience"] else 50),
            "education": r.get("education_match", 80),
            "avatar": f"https://i.pravatar.cc/80?u={r['name']}"
        }
        for i, r in enumerate(all_results)
    ]
    
    skill_counts = {}
    for r in all_results:
        for s in r.get("skills", []):
            skill_counts[s] = skill_counts.get(s, 0) + 1
            
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
    topSkills = [{"skill": k, "value": v * 10} for k, v in sorted_skills[:5]]
    skillsInCandidates = [{"skill": k, "count": v} for k, v in sorted_skills[:5]]
    
    scoreRange = [
        {"name": "80-100%", "value": len([r for r in all_results if r['score'] >= 80]), "color": "#8b5cf6"},
        {"name": "70-80%", "value": len([r for r in all_results if 70 <= r['score'] < 80]), "color": "#06b6d4"},
        {"name": "60-70%", "value": len([r for r in all_results if 60 <= r['score'] < 70]), "color": "#f59e0b"},
        {"name": "Below 60%", "value": len([r for r in all_results if r['score'] < 60]), "color": "#ef4444"},
    ]
    
    compareData = [
        {
            "name": r["name"],
            "experience": f"{r['experience']} years" if r['experience'] else "N/A",
            "skills": ", ".join(r["skills"][:3]) if r.get("skills") else "N/A",
            "skillsMatch": r.get("skills_match", r["score"]),
            "experienceMatch": r.get("experience_match", 90 if r["experience"] else 50),
            "educationMatch": r.get("education_match", 80),
            "score": r["score"],
            "avatar": f"https://i.pravatar.cc/80?u={r['name']}"
        }
        for r in all_results[:3]
    ]

    matchesOverTime = [
        {"day": "1 May", "matches": 30},
        {"day": "5 May", "matches": 45},
        {"day": "9 May", "matches": 38},
        {"day": "13 May", "matches": 62},
        {"day": "17 May", "matches": 55},
        {"day": "21 May", "matches": 78},
        {"day": "25 May", "matches": len([r for r in all_results if r['score'] >= 70])},
    ]
    
    jobDetails = {
        "role": job.role,
        "summary": job.summary,
        "minimumExperience": job.minimum_experience,
        "educationRequirements": job.education_requirements,
        "requiredSkills": job.required_skills,
        "preferredSkills": job.preferred_skills,
        "responsibilities": job.responsibilities,
    }
    
    output_data = {
        "stats": stats,
        "recentJobs": recentJobs,
        "topCandidates": topCandidates,
        "candidates": candidates,
        "matchResults": matchResults,
        "topSkills": topSkills,
        "skillsInCandidates": skillsInCandidates,
        "scoreRange": scoreRange,
        "compareData": compareData,
        "matchesOverTime": matchesOverTime,
        "jobDetails": jobDetails
    }
    
    out_path = Path("ui/src/lib/data.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n✅ Processing complete. Wrote {len(all_results)} candidates to {out_path}")

if __name__ == "__main__":
    main()
