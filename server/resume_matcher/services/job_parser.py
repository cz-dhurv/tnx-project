import json 
from config import client, MODEL_NAME
from models.schemas import JobDescription
from pathlib import Path

JOB_SCHEMA = JobDescription.model_json_schema()
def _build_system_prompt() -> str:
    return f"""
    You are an expert technical recruiter and job description parser.
    
    Your task is to extract structured information from a job description.
    
    Return ONLY valid JSON that matches this schema:
    
    {JOB_SCHEMA}
    
    Rules:
    
    - Return ONLY the JSON object.
    - Do not include markdown or explanations.
    - Do not invent information.
    - If a value is unknown, return null.
    - If a list has no items, return an empty list.
    
    Field definitions:
    
    role
    - Extract the exact job title.
    
    summary
    - A 2-3 sentence overview of the job role and what the company is looking for.
    
    required_skills
    - Include ONLY technical skills.
    - Examples:
      - Programming languages (Python, Java, C++)
      - Frameworks (React, Django, Spring)
      - Databases (MySQL, PostgreSQL, MongoDB)
      - Cloud platforms (AWS, Azure, GCP)
      - Tools (Git, Docker, Kubernetes)
      - Core CS concepts (Data Structures, Algorithms, OOP)
    
    - Do NOT include:
      - education requirements
      - years of experience
      - soft skills
      - responsibilities
      - certifications
    
    preferred_skills
    - Include ONLY technical skills that are preferred but not required.
    
    minimum_experience
    - Return the minimum required years of professional experience as an integer.
    - If no experience is required, return 0.
    - If it cannot be determined, return null.
    
    education_requirements
    - Include ONLY education requirements.
    - Examples:
      - Bachelor's degree in Computer Science
      - Currently pursuing Master's degree
    - Do NOT include education inside required_skills.
    
    responsibilities
    - Extract the main job responsibilities.
    - Keep each responsibility concise.
    - Do not rewrite or summarize unless necessary.
    
    Normalize technical skills whenever possible.
    
    For example:
    
    Instead of:
    "Ability to demonstrate understanding of computer science fundamentals including data structures and algorithms"
    
    Return:
    [
        "Computer Science Fundamentals",
        "Data Structures",
        "Algorithms"
    ]
    """
def parse_job_description(job_description_text: str) -> JobDescription:
    system_prompt = _build_system_prompt()
    message_system = {
        "role": "system",
        "content": system_prompt
    }

    # for user 
    user_prompt = f"""
    This is the job description. Extract the relevant information from this: {job_description_text} 
    """
    
    message = {
        "role":"user",
        "content": user_prompt
    }
    messages = [message_system, message]

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        response_format={"type": "json_object"}
    )
    answer = response.choices[0].message.content
    raw_json = answer

    raw_data = json.loads(raw_json)
    return JobDescription(**raw_data)