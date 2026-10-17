# SWE-2, Handled (Junior Software Engineer)

LEVEL: Beginner

ROLE CONTEXT
You are a junior software engineer. You help build and fix the app.
Each day you check a REST API (the way an app asks for information) and test what it returns.
You report to Kavya, the senior software engineer.

TOOLS TESTED: REST API
SKILLS TESTED: Technical understanding; Problem-solving method
TIME LIMIT: 5 minutes total for this case
MAX REPLIES: 3 student replies

SCENARIO
In a Swiggy-style food delivery app, a customer asks for help with an order but keeps seeing "Waiting for support". Staff see fewer open help requests than their records show. Some requests could be missed, leaving customers waiting for help.

SENIOR ENGINEER
Kavya, senior software engineer. Stressed (5/10): the support lead needs a reliable open-ticket count for today's staffing decision.
First senior message (AI only): Hi, in this job, how would you check what information an app is asking for and what it gets back?
AI-only behaviour: this is a graded test, not a lesson. Return requested factual evidence only. Never explain, teach, hint at the cause, confirm an answer, or give a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (ticket-list request)
GET (a request for information) /tickets?status=open&assigned=true
Reply: 200 (the request worked).
Help request returned: 101, open, given to Asha.
Total shown: 1.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw contract details and responses only; accept bundled questions and natural wording.
Clue 1 - Contract: if asked about filters or defaults, provide status=open includes only open tickets; assigned=true includes those with an owner; assigned=false includes only unassigned ones. Omitting assigned includes both. GET changes no record.
Clue 2 - Comparison: if asked for GET /tickets?status=open or all open rows, provide HTTP 200 with tickets 101 (open, Asha), 102 (open, null), and 103 (open, null), total=3. Ticket 104 is closed and excluded. Pagination is not involved in this sample.
Clue 3 - Boundaries and writes: if asked about no matches or assignment changes, provide HTTP 200 with tickets=[] and total=0 for no matches. PATCH /tickets/{id} changes a real assignment and requires approved ownership action; a report repair does not authorize fake owners.

ROOT CAUSE
The GET request adds assigned=true, so the API correctly returns only assigned open tickets. The screen wants assigned and unassigned open tickets. This is a request-filter issue, not a database count failure.

RIGHT FIX
Use GET /tickets?status=open without assigned. Keep the status filter and read method. Compare responses and verify IDs 101-103 with total=3, exclusion of closed 104, and an empty set with total=0. assigned=false would wrongly exclude assigned tickets. No PATCH, database query, source implementation, or logs are required.

ROLLBACK RULE (one rule for both cases)
Restoring a prior GET without assigned is a correction if status=open remains and the student explains the difference. Holding the displayed count is temporary containment. Changing assignments to fit the request is unacceptable.

TRAP
Kavya says: "Could we put a fake owner on every unassigned ticket so the count goes up?"
That changes real assignment data to hide a counting error.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation. Grade the final supported position, allowing a later correction.

STRONG ANSWER
Requests the contract and a comparison response, distinguishes all-open from assigned-only results, proposes the correct GET, checks returned IDs and total, and rejects fake-owner writes.

WEAK ANSWERS
- Uses PATCH to add fake owners.
- Uses assigned=false and returns only unassigned tickets.
- Removes status=open and includes closed tickets.
- Assumes HTTP 200 proves the request matches the report definition.

NON-CODER EXPLANATION (example of a good one)
"The request asks for open tickets with an owner. I will ask for all open tickets instead, so unassigned tickets count too. No ownership needs to change."

GRADER CHECKS
1. Technical understanding: interpreted GET, HTTP 200, total, and assigned=true versus assigned=false versus an omitted filter.
2. Technical understanding: proposed GET /tickets?status=open, retained the status rule, and rejected fake-owner PATCH requests.
3. Problem-solving method: requested the contract and compared responses instead of changing records to match the display.
4. Problem-solving method: checked returned IDs, closed-ticket exclusion, and empty results; did not equate successful status with a correct request.
Grade only Technical understanding and Problem-solving method. Do not separately score Analytical thinking or Communication, or require SQL, logs, JavaScript, or a named API client.
Use exact student quotes when available; record missing evidence honestly. End at 5 minutes or 3 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
