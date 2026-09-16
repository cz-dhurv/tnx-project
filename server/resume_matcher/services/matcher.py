import json
from config import client, MODEL_NAME
from models.schemas import Resume, JobDescription, MatchResult

MATCH_SCHEMA = MatchResult.model_json_schema()

def _build_prompt(resume: Resume, job_description: JobDescription) -> str:
    prompt = f"""
    You are an expert HR assistant.
    Your work is to analyze resumes and job descriptions, 
    and provide a detailed comparison for the candidate's suitability for the role.

    Return only valid JSON that adheres to the following schema:
    {MATCH_SCHEMA}
    Important: 
    Do not include any additional text or explanations outside of the JSON object.
    Do not return the fields like "properties", "title", "type" or "required" in the output.
    Fill the schema with the relevant information extracted from the resume and job description.

    If experience is not mentioned in the resume, set it to nill.
    If information is missing in the resume, set it to empty list.
    Do not make up any information. Only use the information provided in the resume and job description.
    CRITICAL: When matching skills, you MUST recognize common industry abbreviations, acronyms, and synonyms, BUT ONLY check for skills that are EXPLICITLY REQUIRED by the Job Description. 
    
    Here are examples of how to map abbreviations if (and only if) they are relevant to the job description:
    - "DSA" is equivalent to "Data Structures and Algorithms"
    - "CS" is equivalent to "Computer Science"
    - "ML" is equivalent to "Machine Learning"
    - "React.js" is equivalent to "React"
    - "Node.js" is equivalent to "Node"
    Do not penalize the candidate or list a skill as missing if they have the equivalent abbreviation or synonym on their resume. DO NOT check for or require any of these example skills unless the Job Description specifically asks for them.

    Additionally, if the candidate mentions ANY programming language (e.g., Python, Java, C++, JavaScript, C#, etc.), you MUST consider them to have knowledge of "Object-Oriented Programming" (OOPs). Do not list OOPs or Object-Oriented Programming as a missing skill in this case.

    Similarly, if a candidate has a degree or background in Computer Science (CS), Information Technology, or mentions core technical skills, you MUST consider them to have knowledge of "Computer Science Fundamentals". Do not list this as a missing skill.
    
    CRITICAL: If the candidate is currently pursuing or has completed a Bachelor's (e.g., B.Tech, B.E., BS, B.Sc) or Master's degree in Computer Science, Engineering, or a related field, their Education match percentage MUST be 100.

    Candidate Resume:
    {resume.json()}

    Job Description:
    {job_description.json()}


Give me:

1. Candidate name
2. Matching skills
3. Missing important skills
4. Skills match percentage from 0 to 100
5. Education match percentage from 0 to 100
6. Experience match percentage from 0 to 100
7. Overall match percentage from 0 to 100
8. A short final verdict
9. If the match percentage is less than 100%, provide a clear and specific reason_for_mismatch (what is the candidate lacking?). If 100%, leave empty.

Keep the response concise and easy to read.
    """
    return prompt

def score_resume(job_description: JobDescription, resume: Resume) -> MatchResult:
    prompt = _build_prompt(resume, job_description)
    message = {
        "role": "user",
        "content": prompt
    }
    messages = [message]
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages = messages,
        response_format={
            "type": "json_object"
        }
    )
    match_result_json = response.choices[0].message.content
    data = json.loads(match_result_json)
    
    return MatchResult(**data)