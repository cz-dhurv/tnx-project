import json

from config import MODEL_NAME, client
from models.schemas import Resume

RESUME_SCHEMA = Resume.model_json_schema()

def _build_system_prompt() -> str:
    prompt = f"""
    You are a expert resume parser.
    
    Extract information from the resume based on its meaning,
    not only based on exact section headings.

    Different resumes may use different headings.

    For example:
    - Experience
    - Professional Experience
    - Work History
    - Employment
    - Internships

    These may all contain relevant experience.

    Skills may also appear in the skills section, work experience,
    internships or projects.

    Return ONLY valid JSON matching this schema:

    {RESUME_SCHEMA}

    Important rules:

    1. Do not invent information.
    2. If a value is not available, return null.
    3. If a list has no information, return an empty list.
    4. Include internships inside experiences.
    5. Extract skills mentioned across the entire resume.
    """
    return prompt

def parse_resume(resume_text: str) -> Resume:
    system_prompt = _build_system_prompt()
    user_prompt = f"""
    Parse the following resume:
    {resume_text}
    """
    message_system = {
        "role": "system",
        "content": system_prompt
    }
    message_user = {
        "role": "user",
        "content": user_prompt
    }
    messages = [message_system, message_user]

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        response_format={"type": "json_object"},
    )

    raw_output = response.choices[0].message.content
    data = json.loads(raw_output)
    return Resume(**data)
