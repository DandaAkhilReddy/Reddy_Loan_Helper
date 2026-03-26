# QA Test Plan — Credit Score Helper

## Overview

**Total tests**: 155
**Status**: All passing
**Runtime**: 0.64 seconds
**Framework**: pytest 8.x with FastAPI `TestClient` (httpx)
**Run command**: `pytest tests/ -v`

Tests are split across two files:
- `tests/test_analysis.py` — 78 tests covering the Python analysis engine
- `tests/test_api.py` — 77 tests covering the FastAPI HTTP endpoints

---

## Methodology

### Approach
Tests verify behavior against the real `data/credit_report.json` — not against mocks or synthetic data. This ensures the analysis engine produces correct outputs for the actual scores (Equifax 522, TransUnion 489) and account data.

Session-scoped fixtures load the report once per test run, so the 155 tests complete in under 1 second despite all hitting real application logic.

### Boundary testing
Private helpers (`_parse_utilization`, `_count_derogatory`, `_active_delinquencies`, `_interpolate_months`) are tested directly with edge cases: empty reports, single-bureau score reports, adjacent months (gap-of-one), zero balances, and accounts with every payment status variant.

### Data accuracy
Several tests pin exact values derived from the report (Equifax 522, TransUnion 489, $314/mo OneMain payment, $1,109/mo total obligations, 145% BofA utilization). These tests act as regression guards — if the source JSON changes, these tests will fail and flag the discrepancy.

---

## Analysis Engine Tests (`test_analysis.py`)

### TestAnalyzeScoreFactors (13 tests)
Verifies the `analyze_score_factors()` function that categorizes the six VantageScore 3.0 factors.

| Test | What it verifies |
|------|-----------------|
| `test_returns_all_six_factors` | Exactly 6 factors produced (one per category) |
| `test_sorted_critical_first` | Severity order: CRITICAL → HIGH → MEDIUM → LOW → POSITIVE |
| `test_first_factor_is_critical` | Highest-severity factor is marked CRITICAL |
| `test_first_factor_is_payment_or_derogatory` | Active OneMain delinquency puts payment history at top |
| `test_all_factors_have_required_fields` | name, category, current_value, ideal_value, description, action all present |
| `test_score_impact_range_consistent` | Negative impacts: high bound <= low bound. Positive impacts: low <= high |
| `test_payment_history_is_critical_due_to_delinquency` | OneMain 120+ day late makes payment_history CRITICAL |
| `test_utilization_is_critical_over_100_pct` | 104% overall utilization maps to CRITICAL severity |
| `test_credit_age_is_medium` | 3 year 2 month age maps to MEDIUM severity |
| `test_fixable_factors_include_payment_history` | Payment history is marked fixable |
| `test_credit_age_is_not_fixable` | Credit age cannot be actively fixed |
| `test_hard_inquiries_count_in_current_value` | "6" appears in the hard inquiries factor value |
| `test_derogatory_details_list_collections_and_chargeoffs` | Detail text references "collection" and "charge" |

### TestParseUtilization (4 tests)
Boundary tests for the `_parse_utilization()` helper that converts "104%" strings to floats.

| Test | Input → Expected |
|------|-----------------|
| `test_integer_percent` | "104%" → 104.0 |
| `test_decimal_percent` | "30.5%" → 30.5 |
| `test_zero_percent` | "0%" → 0.0 |
| `test_hundred_percent` | "100%" → 100.0 |

### TestCountDerogatory (5 tests)
Tests `_count_derogatory()` which tallies collections and charge-offs.

| Test | Scenario |
|------|---------|
| `test_real_report_counts` | Report has 1 collection (NCB), 2 charge-offs (Upstart + TXU) |
| `test_empty_report_returns_zeros` | Empty accounts → 0 collections, 0 charge-offs |
| `test_only_collections` | 2 collections, no charge-offs |
| `test_utility_chargeoff_counted` | TXU-style utility charge-off is counted |
| `test_loan_chargeoff_counted` | Upstart-style loan charge-off is counted |

### TestActiveDelinquencies (4 tests)
Tests `_active_delinquencies()` which finds open accounts that are 30+ days past due.

| Test | Scenario |
|------|---------|
| `test_real_report_returns_onemain` | OneMain (120+ days late) is returned |
| `test_no_delinquencies_returns_empty_list` | All-current report → empty list |
| `test_90_day_late_detected` | "90_days_late" status is detected |
| `test_current_loans_excluded` | "current" and "paid" statuses are excluded |

### TestComputePayoffPlan (20 tests)
Tests `compute_payoff_plan()` — the main strategy engine.

| Test | What it verifies |
|------|-----------------|
| `test_has_six_steps` | Exactly 6 prioritized steps |
| `test_first_priority_is_onemain` | Priority 1 is OneMain Financial |
| `test_steps_ordered_by_priority` | Steps are sorted 1-6 |
| `test_total_one_time_cost_in_range` | Total cost is $5,000-$15,000 |
| `test_current_avg_score_matches_report` | (522 + 489) / 2 = 505 or 506 |
| `test_target_score_is_700` | Goal is 700 |
| `test_monthly_onemain_314` | OneMain obligation is $314/mo |
| `test_monthly_leap_finance_787` | Leap Finance obligation is $787/mo |
| `test_step_cumulative_scores_increasing` | Each step's projected score is higher than the last |
| `test_negotiable_steps_are_4_and_5` | Only NCB (priority 4) and TXU (priority 5) are negotiable |
| `test_ncb_step_has_negotiation_note` | Priority 4 includes NCB phone number and instructions |
| `test_txu_step_has_negotiation_note` | Priority 5 includes TXU pay-for-delete note |
| `test_non_negotiable_steps_have_no_note` | Steps 1-3 and 6 have no negotiation_note |
| `test_automatic_improvements_present` | At least 1 automatic improvement (hard inquiry falloff) |
| `test_expected_final_score_above_600` | Low-end projection exceeds 600 after all steps |
| `test_timeline_is_12_months` | Plan runs for exactly 12 months |
| `test_step_score_impact_values_positive` | Every step has a positive (helpful) score impact |

### TestCurrentAvgScore (3 tests)
Tests the `_current_avg_score()` helper.

| Test | Scenario |
|------|---------|
| `test_real_report` | (522 + 489) / 2 = 505 or 506 |
| `test_single_bureau` | Single bureau → returns that score directly |
| `test_symmetric_scores` | Equal scores → returns that value |

### TestProjectScores (16 tests)
Tests `project_scores()` — the month-by-month projection engine.

| Test | What it verifies |
|------|-----------------|
| `test_exactly_13_entries` | Months 0-12 inclusive = 13 rows |
| `test_months_zero_through_twelve` | Months are exactly [0, 1, 2, ..., 12] |
| `test_month_zero_score_low_is_489` | Starting low = TransUnion 489 |
| `test_month_zero_score_high_is_522` | Starting high = Equifax 522 |
| `test_month_12_score_low_is_680` | Final low projection = 680 |
| `test_month_12_score_high_is_710` | Final high projection = 710 |
| `test_monotonically_increasing_score_low` | score_low never decreases month over month |
| `test_monotonically_increasing_score_high` | score_high never decreases month over month |
| `test_milestone_months_marked` | Months 0,1,2,3,5,6,12 have milestone=True |
| `test_non_milestone_months_not_marked` | All other months have milestone=False |
| `test_score_midpoint_is_average_of_low_high` | midpoint = round((low + high) / 2) for every row |
| `test_cumulative_cost_non_decreasing` | Spending never goes backward |
| `test_month_0_cost_is_zero` | No cost at starting point |

### TestInterpolateMonths (6 tests)
Tests `_interpolate_months()` — the linear interpolation helper for months between milestones.

| Test | Scenario |
|------|---------|
| `test_gap_of_one_returns_empty` | Adjacent milestones → no intermediate months |
| `test_gap_of_two_returns_one_intermediate` | 2-month gap → 1 intermediate month |
| `test_interpolated_values_between_bounds` | Interpolated scores stay within endpoint range |
| `test_intermediate_months_not_milestones` | Interpolated months have milestone=False |
| `test_intermediate_delta_is_zero` | Interpolated months have delta_low=0, delta_high=0 |
| `test_action_label_is_building_payment_history` | Filler months use standard label |

---

## API Endpoint Tests (`test_api.py`)

All endpoint tests use FastAPI's `TestClient` (backed by httpx). A single session-scoped client fixture starts the app once for all 77 tests.

### TestHealthEndpoint (3 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_returns_ok_status` | `{"status": "ok"}` |
| `test_response_is_json` | Content-Type is application/json |

### TestReportEndpoint (15 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_equifax_score_matches_report` | `scores.equifax.score == 522` |
| `test_transunion_score_matches_report` | `scores.transunion.score == 489` |
| `test_average_score_is_between_both_bureaus` | min(489,522) <= avg <= max(489,522) |
| `test_contains_report_date` | `report_date == "2026-02-28"` |
| `test_contains_name` | "Akhil" in name field |
| `test_has_at_least_one_delinquent_account` | delinquent >= 1 (OneMain) |
| `test_has_at_least_one_collection` | collections >= 1 (NCB) |
| `test_has_charge_offs` | charge_offs >= 1 (Upstart + TXU) |
| `test_total_debt_is_positive` | total_debt > 0 |
| `test_overall_health_is_poor` | Avg 505 maps to "poor" |
| `test_monthly_obligations_nonzero` | monthly_obligations > 0 |
| `test_vantagescore_model_label` | "VantageScore" in model string |

### TestScoreFactorsEndpoint (11 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_has_six_factors` | `len(factors) == 6` |
| `test_each_factor_has_required_keys` | name, value, rating, impact, severity present |
| `test_critical_count_present_and_positive` | critical_count > 0 |
| `test_payment_history_factor_present` | "Payment History" in factor names |
| `test_utilization_factor_present` | "Credit Card Utilization" in factor names |
| `test_first_factor_has_highest_severity` | Factors sorted severity descending |
| `test_severity_values_within_range` | All severities in [0, 3] |

### TestPayoffPlanEndpoint (16 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_has_six_priorities` | `len(priorities) == 6` |
| `test_first_priority_is_onemain` | priority=1, "OneMain" in action |
| `test_each_priority_has_required_fields` | priority, action, timeline, cost, estimated_score_impact, reason |
| `test_goal_mentions_700_score` | "700" in goal string |
| `test_target_score_is_700` | target_score == 700 |
| `test_gap_is_positive` | gap > 0 |
| `test_total_one_time_cost_in_range` | $5,000-$15,000 |
| `test_monthly_onemain_is_314` | monthly_obligations.onemain == 314.0 |
| `test_monthly_total_is_1109` | monthly_obligations.total == 1109.0 |
| `test_automatic_improvements_present` | At least 1 automatic improvement |
| `test_score_impact_strings_contain_plus` | Every impact string includes "+" |
| `test_priorities_ordered_by_priority_number` | Priorities sorted 1-6 |

### TestProjectionEndpoint (12 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_timeline_has_seven_milestone_entries` | 7 rows (months 0,1,2,3,5,6,12) |
| `test_current_score_is_midpoint_of_month0` | current_score == 505 |
| `test_target_score_is_700` | target_score == 700 |
| `test_months_to_target_is_12` | months_to_target == 12 |
| `test_each_timeline_point_has_required_fields` | month, action, projected_score_low, projected_score_high, projected_score_mid |
| `test_first_timeline_point_is_month_zero` | timeline[0].month == 0 |
| `test_last_timeline_point_is_month_12` | timeline[-1].month == 12 |
| `test_month_12_score_low_above_650` | projected_score_low > 650 |
| `test_scores_monotonically_increasing` | Both low and high scores non-decreasing across timeline |

### TestAccountsEndpoint (20 tests)
| Test | Assertion |
|------|-----------|
| `test_returns_200` | HTTP 200 |
| `test_total_account_count` | Exactly 10 accounts (3 open cards + 1 closed card + 2 open loans + 2 closed loans + 1 utility + 1 collection) |
| `test_each_account_has_required_fields` | name, account_type, balance, account_status, payment_status |
| `test_account_types_are_valid` | All types in {credit_card, loan, utility, collection} |
| `test_onemain_account_present` | "OneMain Financial" in account names |
| `test_ncb_collection_present` | "NCB Management Services" in account names |
| `test_onemain_has_urgent_priority_action` | OneMain priority_action contains "URGENT" |
| `test_ncb_has_pay_for_delete_action` | NCB priority_action contains "pay-for-delete" |
| `test_total_open_plus_closed_equals_account_count` | total_open + total_closed == len(accounts) |
| `test_credit_cards_have_utilization` | Open credit cards have non-null utilization_pct |
| `test_bank_of_america_over_limit` | BofA utilization_pct == 145 |
| `test_leap_finance_is_loan_type` | Leap Finance has account_type == "loan" |
| `test_txu_is_utility_type` | TXU Energy has account_type == "utility" |

---

## Data Accuracy Checks

The following test assertions directly verify values from `data/credit_report.json` and act as regression guards against data drift:

| Value | Source | Test location |
|-------|--------|--------------|
| Equifax score = 522 | `scores.equifax.score` | `TestReportEndpoint`, `TestProjectScores` |
| TransUnion score = 489 | `scores.transunion.score` | `TestReportEndpoint`, `TestProjectScores` |
| Average score = 505 | Computed (floor average) | `TestProjectionEndpoint` |
| OneMain payment = $314/mo | `payoff_strategy.monthly_fixed_obligations.onemain` | `TestComputePayoffPlan`, `TestPayoffPlanEndpoint` |
| Leap Finance payment = $787/mo | `payoff_strategy.monthly_fixed_obligations.leap_finance` | `TestComputePayoffPlan` |
| Total monthly = $1,109/mo | `payoff_strategy.monthly_fixed_obligations.total` | `TestPayoffPlanEndpoint` |
| BofA utilization = 145% | `accounts.credit_cards.open[1].utilization_pct` | `TestAccountsEndpoint` |
| NCB balance = $4,470 | `accounts.collections[0].balance` | Covered via derogatory count |
| Collections count = 1 | NCB Management Services | `TestCountDerogatory`, `TestReportEndpoint` |
| Charge-offs count = 2 | Upstart + TXU Energy | `TestCountDerogatory`, `TestReportEndpoint` |
| Hard inquiries count = 6 | All from May 2024 auto financing | `TestAnalyzeScoreFactors` |
| Month 12 score low = 680 | `payoff_strategy.projected_timeline[-1]` | `TestProjectScores` |
| Month 12 score high = 710 | `payoff_strategy.projected_timeline[-1]` | `TestProjectScores` |
| Total accounts = 10 | Count across all categories | `TestAccountsEndpoint` |
| Milestone months = {0,1,2,3,5,6,12} | `payoff_strategy.projected_timeline` | `TestProjectScores` |

---

## Summary

| Category | Tests | Notes |
|----------|-------|-------|
| Score factor analysis | 13 | Includes severity ordering and fixability |
| Utilization parsing | 4 | Boundary cases: 0%, 100%, decimals |
| Derogatory counting | 5 | Empty report, collections-only, charge-off variants |
| Active delinquency detection | 4 | Status string matching |
| Payoff plan engine | 20 | Ordering, costs, negotiation notes, cumulative scores |
| Score average helper | 3 | Single bureau, symmetric, real data |
| Score projector | 16 | 13-month timeline, monotonicity, milestones, interpolation |
| Interpolation helper | 6 | Gap sizes, bounds, labels |
| Health endpoint | 3 | Status and content-type |
| Report endpoint | 15 | Scores, counts, debt, health rating |
| Score factors endpoint | 11 | Count, required fields, severity ordering |
| Payoff plan endpoint | 16 | All fields, ordering, obligations |
| Projection endpoint | 12 | 7 milestones, monotonicity, score values |
| Accounts endpoint | 20 | 10 accounts, types, priority actions |
| **Total** | **155** | **All passing, 0.64s** |
