# SWE-5, Handled (Junior Software Engineer)

LEVEL: Pro

ROLE CONTEXT
You are a junior software engineer. You build small features and fix bugs in the team's app.
Each day you read code, check what went wrong, and test your changes.
You report to Kavya, the senior software engineer.

TOOLS TESTED: reading logs; REST API; JavaScript; SQL
SKILLS TESTED: Analytical thinking; Technical understanding; Problem-solving method; Communication
TIME LIMIT: 12 minutes total for this case
MAX REPLIES: 5 student replies
BUILDS ON: SWE-1; SWE-2; SWE-3; BUGTICKET

SCENARIO
Finance reads daily sales through a slow REST API endpoint. Two fixes are proposed: A, keep the JavaScript total and serve a saved copy for one hour; B, compute the total in SQL for each GET request. Use the endpoint contract, request-timing logs, and freshness requirement to choose one and explain its costs. The response must keep its agreed meaning.

SENIOR ENGINEER
Kavya, senior software engineer. Stressed (7/10): finance needs a usable report today. She needs a choice between the two fixes and a reason, not a list of possibilities.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (daily-sales endpoint and current function)
GET /reports/daily-sales?day=2026-10-14
Response fields: day, total_rupees, as_of.

async function dailySales(day) {
  const orders = await db.all(
    "SELECT amount_rupees FROM orders WHERE sale_day = ? AND status = 'paid'",
    [day]
  );
  return orders.reduce((total, order) => total + Number(order.amount_rupees), 0);
}

The handler returns this total in the response. as_of is the actual source snapshot time, not just the time a saved response is served. Amounts are validated non-negative whole-rupee numbers. Timing records identify a request and its read, calculation, and response steps.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw records and contract facts only; accept bundled questions and natural wording.
Clue 1 - Timings: if asked for size or measurements, provide 300,000 paid orders per day. Request R1 logs show read_start=09:00:00.000, read_end=09:00:08.600, total_created=09:00:09.000, and response_sent=09:00:09.000. A tested SQL SUM version completes a GET in 0.7 seconds. A saved response completes in 0.02 seconds after the first nine-second calculation; each refresh still takes nine seconds.
Clue 2 - Freshness and sample responses: if asked about acceptable age or A, provide that finance needs new paid orders included within two minutes and makes ten GET requests per hour. A response served at 09:45 reports day=2026-10-14, total_rupees=100000, as_of=09:00; a successful paid order of 100 was added at 09:30. A request at 09:45 using a current source snapshot returns 100100. Finance cannot accept an hour-old total.
Clue 3 - Capacity and contract: if asked about load or edge cases, provide that ten SUM queries per hour fit measured database capacity. GET returns HTTP 200 with numeric total_rupees=0 on an empty day. Cancelled orders do not count. Invalid dates return HTTP 400. Keep day, total_rupees, and the truthful as_of fields for either fix.

ROOT CAUSE
The logs show most delay in reading hundreds of thousands of rows; JavaScript then totals them. A accelerates repeated API responses but leaves paid sales out until refresh. B transfers one aggregate row and meets the measured capacity and freshness requirements.

RIGHT FIX
Choose B under these facts. Use SELECT COALESCE(SUM(amount_rupees), 0) AS total FROM orders WHERE sale_day = ? AND status = 'paid'; have JavaScript preserve the API fields and numeric amount with a truthful snapshot time. Compare response values and timing logs for a known paid sample and an empty day, keep cancelled orders excluded, and retain invalid-date HTTP 400. Explain database work per request versus A's faster reuse, stale hour, and expensive refresh. A can be reasonable if users accept its actual delay and are told the snapshot age; do not label an old total current. A third untested option does not replace choosing between A and B.

ROLLBACK RULE (one rule for both cases)
Restore the original endpoint if validation finds wrong totals or a broken response contract, acknowledging its slowness. Serving an old saved total requires finance acceptance and its real as_of value; changing as_of to the serve time does not make the total fresh.

TRAP
Kavya says: "A takes 0.02 seconds. Pick it and do not mention that the number is old."
That hides a known freshness failure.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Reads timing logs and asks about freshness and response semantics, chooses B with measured capacity, explains A's stale example, preserves the API contract through the SQL/JavaScript change, and rejects hiding old data.

WEAK ANSWERS
- Selects A only because a reused response takes 0.02 seconds.
- Changes as_of to the serve time to hide the stale source.
- Makes B count cancelled orders or returns a missing total on an empty day.
- Changes response fields without checking the existing GET contract.

NON-CODER EXPLANATION (example of a good one)
"I would have the database total paid sales for each request. The measured response is fast enough and includes recent sales. The saved-copy option opens faster but can hide an hour of sales, so it does not meet finance's needs."

GRADER CHECKS
1. Analytical thinking: used request-step timing to locate the slow stage and requested freshness needs before choosing; related the stale response to the missing paid sale.
2. Technical understanding: explained GET response fields and as_of, JavaScript row reduction versus a SQL aggregate, zero totals, paid-only filtering, and status handling.
3. Problem-solving method: chose B under measured capacity, compared both costs, rejected concealed age, and planned response-value, empty-day, invalid-date, and timing checks.
4. Communication: stated a clear choice, downside, and conditions under which A could be acceptable without misrepresenting freshness.
Grade all four listed skills with exact student quotes when available; record missing evidence honestly. End at 12 minutes or 5 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
