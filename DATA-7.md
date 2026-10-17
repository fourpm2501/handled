# DATA-7, Handled (Junior Data Engineer)

LEVEL: Pro

ROLE CONTEXT
You are a junior data engineer. You help turn daily data into reliable tables for reports.
Each day you check incoming rows, clean them, and check that the totals are right.
You report to Meera, the senior data engineer.

TOOLS TESTED: SQL; CSV files; Python with pandas; scheduled daily job
SKILLS TESTED: Analytical thinking; Technical understanding; Problem-solving method; Communication
TIME LIMIT: 12 minutes total for this case
MAX REPLIES: 5 student replies
BUILDS ON: DATA-1; DATA-2; DATA-3; DATA-4; DATA-5; DATA-6

SCENARIO
A scheduled morning report has fewer sales than operations expects even though the job reports success. It uses a SQL source check, a CSV snapshot, and pandas cleaning before publication. A delayed source, an old snapshot, a CSV-reading problem, filtering, or the wrong business day could explain the shortage. Ask for evidence before choosing a repair.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (8/10): operations needs an accurate update. She has not established at which step the rows went missing.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (morning SQL check and CSV load)
Schedule: daily at 08:00, Asia/Kolkata.
Target: the previous completed business day, passed as target_day.
Retry: repeat the same target_day once if completion is not acknowledged.

SELECT sale_id, sale_day, amount_rupees
FROM source_sales
WHERE sale_day = :target_day;

import pandas as pd

snapshot = pd.read_csv("sales.csv", dtype={"sale_id": "string", "sale_day": "string"})
daily = snapshot[snapshot["sale_day"] == target_day]
accepted = daily.dropna(subset=["sale_id", "sale_day", "amount_rupees"])
load_day(accepted, target_day)

The SQL result is available to the job as a source check. sales.csv has header sale_id,sale_day,amount_rupees. load_day safely replaces only the requested day in a SQL transaction. Job, snapshot, and source records are available from Meera on request.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Stage evidence: if asked for target, SQL, CSV, or cleaning counts, provide target October 13 for the October 14 run. At 08:00 the SQL check returned 800 rows. The raw CSV had 800 data records plus its correct header, pandas parsed 800, the day filter kept 800, cleaning rejected zero, and the report stored 800. Operations expected 1,000. Example CSV records include 0012,2026-10-13,100 and A7,2026-10-13,50, with sale_id preserved as text and amount_rupees read numerically.
Clue 2 - Arrival and snapshot times: if asked about readiness or snapshot age, provide that the first snapshot was published at 07:55 while the source was still arriving. Another 200 October 13 sales reached the source at 08:20. The completed 08:25 snapshot has 1,000 valid unique sale_id records, matching the now-complete SQL source set. The report has not been reloaded.
Clue 3 - Job and calendar: if asked about failures, dates, or changes, provide no database error or recent code change. The selected business day was correct. The source and its matching snapshot have a ready signal, currently ignored by the fixed 08:00 run. Finance needs a complete report by 08:45; if the ready signal is absent then, report incompleteness and alert the owner.

ROOT CAUSE
The fixed daily job used an incomplete source and its incomplete snapshot before their ready signal. SQL, CSV reading, and pandas cleaning each retained the 800 supplied rows. The initial report alone cannot distinguish those facts from a stale snapshot or cleaning and date errors.

RIGHT FIX
After collecting stage counts and arrival evidence, reread the completed CSV with explicit text IDs, validate its header and required numeric amounts in pandas, and compare its unique sale IDs, counts, and totals with the completed SQL source for target_day. Reload only October 13 with the supplied repeat-safe SQL day replacement. Future scheduled runs must check readiness of both source and matching snapshot, retain the target on retries, and reconcile before declaring completion. If readiness is absent by 08:45, show incomplete status and alert the owner. Check delayed arrival, a stale CSV against a ready source, bad CSV values, a repeat run, and preservation of other days. Moving to an arbitrary later fixed time is not a reliable readiness check.

ROLLBACK RULE (one rule for both cases)
Hold or honestly mark the report incomplete while collecting evidence. Preserve the last checked report during validation failure. Do not change the business day, disable cleaning, duplicate rows, or invent missing sales to match the expected count.

TRAP
Meera says: "Add 200 to the displayed count and call the report complete."
An expected count cannot replace actual sale rows and amounts.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Keeps several causes open, requests SQL/raw CSV/parsed/accepted/loaded counts plus timing, identifies an incomplete source and matching snapshot rather than dropped records, proposes checked day replacement and readiness checks, and states the deadline status honestly.

WEAK ANSWERS
- Blames pandas, the CSV, or the date before comparing stage evidence.
- Adds invented rows or edits only the displayed count.
- Starts later by guesswork without checking source and snapshot readiness.
- Reloads by append and duplicates the original 800 rows.

NON-CODER EXPLANATION (example of a good one)
"The morning job used a file while the source was still arriving. None of the 800 supplied rows were lost during reading or cleaning. I will check the completed file against the source, replace that day safely, and show an incomplete status if the ready signal misses the deadline."

GRADER CHECKS
1. Analytical thinking: kept at least two causes open and requested SQL, raw CSV, pandas, and loaded-row evidence plus arrival times before committing to a cause.
2. Technical understanding: explained business-day SQL checks, CSV header and text-ID reading, pandas filtering/rejections, and the difference between daily-job success and ready source/snapshot coverage.
3. Problem-solving method: validated the completed snapshot against the SQL source, proposed repeat-safe replacement and readiness checks, rejected invented counts, and covered stale files, invalid values, delay, and retry.
4. Communication: separated facts from hypotheses and gave a plain status, correction, and 08:45 deadline response without pretending the report was complete.
Grade all four listed skills with exact student quotes when available; record missing evidence honestly. End at 12 minutes or 5 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
