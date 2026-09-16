from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set.")

MODEL_NAME = "llama-3.3-70b-versatile"

client = Groq(api_key=GROQ_API_KEY)

LLM_CALL_DELAY = 5

RESUME_FILE_PATH = "data/resumes"
JOB_DESCRIPTION_FILE_PATH = "data/job_description/description.txt"