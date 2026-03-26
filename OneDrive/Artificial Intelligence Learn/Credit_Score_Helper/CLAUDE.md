# Credit Score Helper

Personal credit analysis and payoff optimization tool.

## Project Overview

Web app that analyzes credit report data and generates a prioritized debt payoff plan
to reach 700+ credit score within 12 months. Built with agent teams.

- **Backend**: Python FastAPI (`src/api/`)
- **Frontend**: React + TypeScript + Vite (`src/frontend/`)
- **Analysis Engine**: Python (`src/analysis/`)
- **Data Source**: `data/credit_report.json` (extracted from Credit Karma screenshots)

## Architecture

```
data/credit_report.json  →  src/analysis/  →  src/api/  →  src/frontend/
     (raw data)            (scoring engine)   (REST API)   (dashboard UI)
```

## Commands

### Backend
```bash
cd src/api
pip install -r ../../requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd src/frontend
npm install
npm run dev
```

## Key Files

- `data/credit_report.json` — All credit data extracted from screenshots
- `src/analysis/payoff_strategy.py` — Score-optimized payoff ordering
- `src/analysis/score_projector.py` — Month-by-month score projection
- `docs/payoff-report.md` — Plain-English action plan (the key deliverable)
- `docs/AGENT_TEAMS_REFERENCE.md` — Agent teams reference guide

## Conventions

- Python: type hints, Pydantic v2 schemas, async endpoints
- TypeScript: strict mode, functional components, no `any`
- All monetary values in USD cents internally, formatted for display
