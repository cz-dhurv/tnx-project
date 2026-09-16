# ResumeMatcher AI Integration Setup Guide

The [cz-dhurv/ResumeMatcher](https://github.com/cz-dhurv/ResumeMatcher) project has been integrated into **CampusAI (`TNX`)** on the `feat/resume-matcher-integration` branch.

---

## Architecture Overview

1. **Frontend**: Next.js 16 (React 19) App Router located in `src/app/placement/page.tsx`.
   - **Tab 1: Resume Reviewer & ATS Scorecard**: Real-time PDF/DOCX file upload, skill extraction, ATS score calculation, missing skills identification, and formatting critiques.
   - **Tab 2: Job Description Matcher & Leaderboard**: Screen applicants against custom or campus job descriptions, ranking candidates with sub-scores (Skills Match %, Experience Match %, Education Match %) and identifying skill gaps.
   - **Tab 3: Candidate Comparison Matrix**: Side-by-side comparative analysis of multiple applicants or candidate credentials against job specs.
   - **Tab 4: Interactive Mock Interviewer**: 3-stage adaptive AI interview board with automated performance scoring.
   - **Tab 5: Campus Internships & Placement Drives**: 1-click apply with evaluated CVs.

2. **Backend API Service**: Python FastAPI server located in `server/resume_matcher/`.
   - Uses **Groq LLM** (`llama-3.3-70b-versatile`) for natural language extraction and candidate scoring.
   - Parses `.pdf`, `.docx`, and `.txt` files with `pypdf` and `python-docx`.

3. **Resilience & Offline Demo Mode**:
   - If the FastAPI server is running on `http://localhost:8000`, the Next.js routes automatically proxy requests to it.
   - If the server is offline or Groq API key is not configured, the frontend gracefully falls back to the intelligent internal engine and pre-computed candidate datasets, ensuring zero crashes during presentations or offline testing.

---

## Running the Python FastAPI Backend (Optional / Live Groq Mode)

### Step 1: Navigate to the backend directory
```bash
cd "server/resume_matcher"
```

### Step 2: Install dependencies
Using `uv` (recommended):
```bash
uv sync
# or
uv pip install -r requirements.txt
```
Or using standard `pip`:
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create a `.env` file in `server/resume_matcher/` (or copy `.env.example`):
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Step 4: Start the FastAPI Server
```bash
python api_server.py
```
The server will start at `http://127.0.0.1:8000`. The Next.js frontend will instantly detect it and display `FastAPI Engine: Active (Port 8000)` with a green pulsing indicator.

---

## Running the Next.js Frontend

From the root directory:
```bash
npm run dev
```
Open `http://localhost:3000/placement` in your browser.
