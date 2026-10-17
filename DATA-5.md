# DATA-5, Handled (Junior Data Engineer)

LEVEL: Pro

ROLE CONTEXT
You are a junior data engineer. You help turn daily data into reliable tables for reports.
Each day you check incoming rows, clean them, and check that the totals are right.
You report to Meera, the senior data engineer.

TOOLS TESTED: SQL; CSV files; Python with pandas
SKILLS TESTED: Analytical thinking; Technical understanding; Problem-solving method; Communication
TIME LIMIT: 12 minutes total for this case
MAX REPLIES: 5 student replies
BUILDS ON: DATA-1; DATA-2; DATA-3; DATA-4

SCENARIO
SQL creates one row of delivery counts per branch, then exports those rows to a CSV file for a pandas report. The branch figures look right, but the company-wide delivery rate does not match the orders. Find the calculation bug, checking the handoff as well as the formula, and propose a fix.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (7/10): the company update uses this number, and she needs it checked before publication.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (SQL branch export and pandas CSV report)
SELECT branch, COUNT(*) AS orders,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered
FROM orders
WHERE order_day = '2026-10-14'
GROUP BY branch;

import pandas as pd

branch_counts = pd.read_csv(
  "branch_counts.csv",
  dtype={"branch": "string", "orders": "int64", "delivered": "int64"}
)
branch_counts["rate"] = branch_counts["delivered"] / branch_counts["orders"]
company_rate = branch_counts["rate"].mean()

The SQL result is exported with CSV header branch,orders,delivered. Each source order appears once. CSV raw rows and the pandas read result are available from Meera on request.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Handoff sample: if asked for SQL, CSV, or parsed rows, provide SQL rows (Small, 2, 2), (Large, 98, 49). The CSV header is branch,orders,delivered with rows Small,2,2 and Large,98,49. pandas reads exactly those two rows with numeric counts. Branch rates are 1.0 and 0.5; the report shows 0.75.
Clue 2 - Definition: if asked what the company metric means, provide delivered orders across all branches divided by all orders across all branches. The expected result is 51 / 100 = 0.51; all statuses belong in the order count.
Clue 3 - Boundaries: if asked about an empty day or file validity, provide that no orders should show "No orders". The CSV must have the agreed header and non-negative integer counts with delivered no greater than orders. Missing counts or repeated branch rows must be held for review, not quietly filled or discarded.

ROOT CAUSE
SQL counts and their CSV handoff are correct in the incident. The pandas mean gives every branch equal weight despite different order counts. The report needs each order to have equal weight.

RIGHT FIX
Validate the CSV header, unique branch rows, and integer counts; compare the parsed counts with the SQL export totals. Divide the pandas sum of delivered by the sum of orders, or perform the equivalent combined-count calculation in SQL. Guard a zero total with No orders and round only the final display. Verify the unequal-size sample gives 0.51, matching-sized branches, an empty file with its header, and a bad or missing count. Do not change source branch counts or use a mean of percentages.

ROLLBACK RULE (one rule for both cases)
Hold the company figure with an honest reason as temporary containment. Restoring an older formula is a fix only if it matches the count-based definition and passes the unequal-size check. Do not change branch counts.

TRAP
Meera says: "Round the branch rates first. Then the average should look right."
Rounding cannot fix giving a two-order branch the same weight as a 98-order branch.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Checks SQL totals against CSV and parsed counts, confirms the business definition, identifies equal branch weighting as the bug, gives a combined-count calculation with validation and empty handling, and rejects cosmetic rounding.

WEAK ANSWERS
- Averages rounded branch percentages.
- Removes the small branch for a more plausible result.
- Shows 0% for no orders against the agreed rule.
- Counts only delivered orders in both numerator and denominator.

NON-CODER EXPLANATION (example of a good one)
"The report gave a tiny branch the same say as a large branch. I will divide all delivered orders by all orders, so each order counts equally. If there are no orders, we will say so."

GRADER CHECKS
1. Analytical thinking: requested the metric definition and traced SQL counts through raw CSV to pandas, using the unequal-size sample to locate the incorrect company result.
2. Technical understanding: understood SQL branch aggregation, CSV headers and numeric counts, and why a pandas mean of branch rates differs from delivered-sum divided by order-sum.
3. Problem-solving method: validated the file handoff and count constraints, proposed combined counts and empty-day handling, rejected rounding as a fix, and checked unequal sizes and malformed input.
4. Communication: explained why small and large branches cannot have equal weight for this metric and gave a concise correction and honest validation status.
Grade all four listed skills with exact student quotes when available; record missing evidence honestly. End at 12 minutes or 5 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
