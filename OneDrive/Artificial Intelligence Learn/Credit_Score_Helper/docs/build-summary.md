# Credit Score Helper — Build Summary

## Project Overview

Credit Score Helper is a personal finance tool that parses a structured credit report JSON file, runs a score-optimized payoff analysis engine, and exposes the results through a FastAPI REST API. The tool was built around Akhil Reddy Danda's February 28, 2026 credit report (Equifax 522, TransUnion 489) with the goal of reaching 700+ within 12 months.

The analysis engine does not use generic avalanche or snowball ordering. It ranks every debt payoff action by its estimated VantageScore 3.0 recovery per dollar spent, putting active delinquency resolution before interest-rate or balance considerations.

## Architecture

```
data/credit_report.json
        |
        v
src/analysis/              <- pure Python, no I/O
    score_factors.py       <- categorizes 6 scoring factors with severity levels
    payoff_strategy.py     <- builds score-optimized 6-step payoff plan
    score_projector.py     <- projects month-by-month score improvement (months 0-12)
        |
        v
src/api/                   <- FastAPI layer
    main.py                <- app factory, CORS, router registration
    data_loader.py         <- loads credit_report.json once per process
    schemas.py             <- Pydantic v2 response models
    routes/
        report.py          <- GET /api/report
        factors.py         <- GET /api/score-factors
        payoff.py          <- GET /api/payoff-plan
        projection.py      <- GET /api/projection
        accounts.py        <- GET /api/accounts
```

The analysis layer is framework-agnostic. FastAPI routes call into it and serialize the output through typed Pydantic schemas. There is no database; the credit report is a single JSON file loaded from `data/credit_report.json` relative to the project root.

## How to Run the Backend

### Prerequisites
- Python 3.10 or newer
- pip

### Install dependencies

```bash
pip install -r requirements.txt
```

`requirements.txt` pins exact versions:

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic>=2.0,<3.0
pytest>=8.0,<9.0
httpx>=0.27,<1.0
```

### Start the API server

```bash
uvicorn src.api.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## API Endpoint Reference

All endpoints are read-only (GET). No authentication required. CORS is open for local development.

### GET /health
Liveness check.

**Response**
```json
{"status": "ok"}
```

### GET /api/report
Full credit report summary — scores from both bureaus, account counts, total debt, overall health rating.

**Response fields**
| Field | Type | Description |
|-------|------|-------------|
| `report_date` | string | Date of the report (YYYY-MM-DD) |
| `name` | string | Subject's name |
| `scores.equifax.score` | int | Equifax VantageScore 3.0 |
| `scores.transunion.score` | int | TransUnion VantageScore 3.0 |
| `scores.average` | int | Floor-rounded average of both bureaus |
| `account_counts.total` | int | All accounts (open + closed) |
| `account_counts.delinquent` | int | Accounts 30+ days past due |
| `account_counts.collections` | int | Open collection accounts |
| `account_counts.charge_offs` | int | Accounts with charge-off status |
| `total_debt` | float | Sum of balances on open accounts + collections |
| `monthly_obligations` | float | Fixed monthly minimum payments |
| `overall_health` | string | `"poor"` / `"fair"` / `"good"` based on average score |

**Example**
```bash
curl http://localhost:8000/api/report
```

### GET /api/score-factors
The six VantageScore 3.0 factors, sorted by severity (critical first).

**Response fields**
| Field | Type | Description |
|-------|------|-------------|
| `factors[].name` | string | Display name (e.g., "Payment History") |
| `factors[].value` | string | Current reported value |
| `factors[].rating` | string | Bureau-reported rating |
| `factors[].impact` | string | Bureau-reported impact level |
| `factors[].severity` | int | Derived: 3=critical, 2=high, 1=medium/low |
| `critical_count` | int | Number of factors with severity 3 |
| `warning_count` | int | Number of factors with severity 2 |

### GET /api/payoff-plan
Prioritized payoff plan with per-step costs, score impact estimates, and monthly obligations.

**Response fields**
| Field | Type | Description |
|-------|------|-------------|
| `goal` | string | Recovery target |
| `current_avg_score` | int | Average score at report date |
| `target_score` | int | Target (700) |
| `gap` | int | Points needed |
| `priorities[].priority` | int | Step number (1-6) |
| `priorities[].action` | string | What to do |
| `priorities[].timeline` | string | When to do it |
| `priorities[].cost` | float | One-time cost in USD |
| `priorities[].estimated_score_impact` | string | e.g., "+15 to +25" |
| `priorities[].reason` | string | Explanation |
| `priorities[].target_balance` | float or null | Target balance after paydown (cards only) |
| `priorities[].negotiation_range` | string or null | Settlement range (collection/charge-off only) |
| `automatic_improvements[].event` | string | What falls off automatically |
| `automatic_improvements[].when` | string | When it happens |
| `automatic_improvements[].estimated_score_impact` | string | Free score gain |
| `monthly_obligations.onemain` | float | $314/mo |
| `monthly_obligations.leap_finance` | float | $787/mo |
| `monthly_obligations.credit_one` | float | $8/mo |
| `monthly_obligations.total` | float | $1,109/mo |
| `total_one_time_cost` | float | Total one-time payoff budget |

### GET /api/projection
Month-by-month score projection for months 0-12, based on the seven defined milestone events.

**Response fields**
| Field | Type | Description |
|-------|------|-------------|
| `current_score` | int | Midpoint of starting range (505) |
| `target_score` | int | 700 |
| `months_to_target` | int | 12 |
| `timeline[].month` | int | Month number (0-12) |
| `timeline[].action` | string | Action taken at this milestone |
| `timeline[].projected_score_low` | int | Conservative projected score |
| `timeline[].projected_score_high` | int | Optimistic projected score |
| `timeline[].projected_score_mid` | int | Midpoint |

The projection endpoint returns the 7 defined milestone months directly from the report (0, 1, 2, 3, 5, 6, 12). The analysis engine (`score_projector.py`) fills in intermediate months via linear interpolation when queried directly, but the API route returns milestones only for clean charting.

### GET /api/accounts
Flat list of all 10 accounts with typed fields and priority action notes.

**Response fields**
| Field | Type | Description |
|-------|------|-------------|
| `accounts[].name` | string | Creditor name |
| `accounts[].account_type` | string | `credit_card` / `loan` / `utility` / `collection` |
| `accounts[].balance` | float | Current balance |
| `accounts[].account_status` | string | `open` / `closed` / `paid_and_closed` / etc. |
| `accounts[].payment_status` | string | `current` / `120_plus_days_late` / `charge_off` / etc. |
| `accounts[].utilization_pct` | float or null | Credit card utilization (cards only) |
| `accounts[].priority_action` | string or null | Plain-English action note for problem accounts |
| `total_open` | int | Count of open accounts |
| `total_closed` | int | Count of closed accounts |
| `total_balance` | float | Sum of all balances |

## Running the Tests

```bash
pytest tests/ -v
```

**Result**: 155 tests, all passing, in under 1 second.

```
collected 155 items

tests/test_analysis.py ..................................................
tests/test_api.py ......................................................

155 passed in 0.64s
```

To run with coverage:

```bash
pytest tests/ --cov=src --cov-report=term-missing
```

## Project Layout

```
Credit_Score_Helper/
    data/
        credit_report.json       # source of truth — all analysis derives from this
    src/
        analysis/
            __init__.py
            score_factors.py
            payoff_strategy.py
            score_projector.py
        api/
            __init__.py
            main.py
            data_loader.py
            schemas.py
            routes/
                __init__.py
                accounts.py
                factors.py
                payoff.py
                projection.py
                report.py
    tests/
        test_analysis.py         # 78 tests covering the analysis engine
        test_api.py              # 77 tests covering all API endpoints
    docs/
        payoff-report.md         # plain-English recovery plan for Akhil
        build-summary.md         # this file
    requirements.txt
```
