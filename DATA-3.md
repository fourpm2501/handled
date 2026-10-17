# DATA-3, Handled (Junior Data Engineer)

LEVEL: Intermediate

ROLE CONTEXT
You are a junior data engineer. You help turn daily data into reliable tables for reports.
Each day you check incoming rows, clean them, and check that the totals are right.
You report to Meera, the senior data engineer.

TOOLS TESTED: SQL; CSV files
SKILLS TESTED: Analytical thinking; Technical understanding; Communication
TIME LIMIT: 8 minutes total for this case
MAX REPLIES: 4 student replies
BUILDS ON: DATA-1; DATA-2

SCENARIO
In a Flipkart-style shopping app, finance says the daily revenue report is too high after a customer-region file was uploaded. The team needs a correct total for each region before sending today's report.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (6/10): the regional report is due, and finance says its total does not match the order table.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (CSV layout and regional sales query)
customer_code,region

SELECT r.region, SUM(o.amount_rupees) AS sales_rupees
FROM orders o
LEFT JOIN region_upload r ON r.customer_code = o.customer_code
WHERE o.order_day = '2026-10-14' AND o.status = 'paid'
GROUP BY r.region;

The first line is the region CSV header, not a data row. The upload puts its fields into region_upload(customer_code, region), both as text, without adding or removing rows. orders has unique order_id, text customer_code, order_day, status, and validated numeric amount_rupees. CSV data rows are available from Meera on request.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Source and joined rows: if asked for orders and query results, provide paid orders (O1, "0012", 100) and (O2, "0013", 50) for the selected day. SQL totals 150 before joining; after joining North has 200 and South has 50.
Clue 2 - CSV and loaded rows: if asked for the file or upload, provide the header customer_code,region followed by 0012,North then 0012,North then 0013,South. The loaded table has those same three rows, with leading zeros preserved.
Clue 3 - Mapping contract: if asked about repeats, conflicts, or missing matches, provide that a customer must have one region. Identical repeated mappings are accidental; conflicting regions require review. Unmatched orders must remain under "Unknown region", and different orders may have the same amount.

ROOT CAUSE
The CSV repeats a customer mapping. The load preserves that repetition, so the SQL join matches the same order twice. No numeric type conversion or pandas calculation caused this incident.

RIGHT FIX
Check the CSV header, text customer codes, and loaded row count. Use SQL to detect repeated customer_code values and conflicting regions. Remove only verified identical mapping repeats, for example by selecting DISTINCT customer_code, region into a checked mapping; first hold keys with more than one distinct region for review. Join orders to one approved mapping row per customer using a left join; group missing regions under Unknown region. Compare order count and amount before and after joining. Preserve two different orders with the same amount. SQL or reviewed CSV correction is acceptable; pandas is not required.

ROLLBACK RULE (one rule for both cases)
Temporarily show the checked overall total and hold the regional report with an honest status. Credit containment only with the repeated CSV mapping diagnosis and a checked mapping fix. Do not drop orders or select an arbitrary conflicting region.

TRAP
Meera says: "Drop duplicated amounts after the join. That should put the total back."
Different orders can share an amount; dropping amounts can erase valid sales.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Compares raw CSV rows with the loaded table and SQL join result, identifies the repeated mapping, preserves text codes and unmatched orders, and explains why distinct amounts would delete valid sales.

WEAK ANSWERS
- Uses SUM(DISTINCT amount_rupees) or deletes repeated amounts.
- Removes unmatched orders with an inner join.
- Picks one conflicting region without review.
- Blames the CSV reader without comparing the source and loaded rows.

NON-CODER EXPLANATION (example of a good one)
"The region file lists one customer twice, so the query counts that customer's order twice. I will use one checked mapping per customer and keep sales with no region visible."

GRADER CHECKS
1. Analytical thinking: compared raw CSV rows, loaded mappings, and pre/post-join totals to distinguish a repeated source mapping from a load or amount error.
2. Technical understanding: preserved text identifiers and CSV header handling; explained SQL join multiplication and supplied a one-mapping-per-customer fix that retains unmatched orders.
3. Technical understanding: handled conflicting mappings and equal-valued orders correctly, rejected deduplicating amounts, and described the count-and-total checks.
4. Communication: gave Meera a short, plain cause, impact, and proposed correction without claiming it had been executed.
Grade only Analytical thinking, Technical understanding, and Communication. Investigation evidence supports the analysis; do not separately score Problem-solving method or require pandas. Use exact quotes when available; record missing evidence honestly. End at 8 minutes or 4 student replies. Incomplete work is graded and counts toward the final result. No teaching, answer reveal, or ungraded retry.
