# DATA-6, Handled (Junior Data Engineer)

LEVEL: Pro

ROLE CONTEXT
You are a junior data engineer. You help turn daily data into reliable tables for reports.
Each day you check incoming rows, clean them, and check that the totals are right.
You report to Meera, the senior data engineer.

TOOLS TESTED: SQL; Python with pandas; scheduled daily job
SKILLS TESTED: Analytical thinking; Technical understanding; Problem-solving method; Communication
TIME LIMIT: 12 minutes total for this case
MAX REPLIES: 5 student replies
BUILDS ON: DATA-1; DATA-2; DATA-4; DATA-5

SCENARIO
The scheduled daily sales report misses late corrections. Two fixes are proposed: A, use SQL to reread the latest three complete days, validate them in pandas, and replace that range; B, validate a supplied table of changes in pandas and update matching sale_id rows in SQL. Choose one for the morning run, including how it fits the job deadline and repeat runs.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (7/10): finance needs corrected totals today and a decision between the two load methods.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (scheduled one-day SQL and pandas load)
Schedule: daily at 06:00, Asia/Kolkata.
Target: the previous completed business day, passed as target_day.
Retry: repeat the same target_day once if completion is not acknowledged.

SELECT sale_id, sale_day, amount_rupees
FROM source_sales
WHERE sale_day = :target_day;

accepted = extract.dropna(subset=["sale_id", "sale_day", "amount_rupees"])
load_day(accepted, target_day)

extract is the pandas table from this SQL query. load_day replaces only the selected day in one SQL transaction, a group of changes saved together. sale_id stays unchanged when a sale is corrected. The supplied changes input for option B is an in-memory pandas table, not a CSV-reading task.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Full-source range: if asked about source coverage or run dates, provide that the October 14 06:00 run targets October 13. Source tables hold complete authoritative sets for October 11-13, available by 05:55. Late additions, updates, and removals affect only those three days under the current contract; older days are closed.
Clue 2 - Changes input: if asked how B represents changes, provide new and updated rows with stable sale_id, but no removal records. S19 was removed from October 12 in the source and still appears in the report.
Clue 3 - Timing, repeats, and validation: if asked about costs or the job, provide six minutes for A and one minute for B. Finance needs completion by 06:10; six minutes fits measured database capacity. A retry uses the same target and range. Missing required values must be recorded and reviewed; a partial load needs approval before replacing a checked report.

ROOT CAUSE
The one-day scheduled load ignores corrections to earlier days. B is faster but cannot remove S19 because its changes input lacks removals. A rereads a complete bounded source and can finish before the job deadline.

RIGHT FIX
Choose A for the current run. Derive the three-day range from the supplied target_day, query all three days in SQL, and use pandas to validate text IDs, required fields, unique sale IDs, and counts. Record rejected rows and obtain approval if partial. Replace only that range in one SQL transaction and reconcile totals; retain earlier days. Preserve the same target range on retries so repeating a run does not duplicate rows. Explain that B saves time and work but requires reliable removal records and repeat-safe updates to become suitable. Check a late addition, changed amount, removed S19, repeat, failure, and completion before 06:10.

ROLLBACK RULE (one rule for both cases)
If validation or the timed load fails, preserve the last checked report with its actual business-day coverage and last-updated time, and alert the owner. Returning to one-day loading remains temporary. Do not overwrite with an unapproved partial range or silently miss the deadline.

TRAP
Meera says: "B is faster. Just keep the removed sales; nobody checks individual rows."
Keeping known removed rows knowingly misstates totals.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Asks about full-source availability, removal records, and the schedule deadline; selects A with a measured time margin; explains B's speed and missing removal coverage; and proposes validated range replacement safe on retry.

WEAK ANSWERS
- Picks B only for speed and leaves removed sales in the total.
- Selects A but ignores source readiness or the 06:10 deadline.
- Reloads all history instead of the target three days.
- Appends repeated runs or silently drops invalid rows.

NON-CODER EXPLANATION (example of a good one)
"I would reload the three complete days for this morning's run. It finishes within the deadline and includes removed sales. The faster changes input does not tell us about removals, so it cannot yet keep the total right."

GRADER CHECKS
1. Analytical thinking: requested correction coverage, removal representation, source availability, and run times; chose A using the six-minute cost and ten-minute deadline.
2. Technical understanding: linked a SQL date-range extract and replacement to pandas validation; understood stable IDs, missing removal records, and same-target daily-job retries.
3. Problem-solving method: compared both fixes, preserved history and rejected rows, planned repeat/failure checks and deadline monitoring, and refused to retain known removed sales.
4. Communication: stated a clear choice, downside, deadline margin, and what would make B viable later without hiding stale coverage.
Grade all four listed skills with exact student quotes when available; record missing evidence honestly. End at 12 minutes or 5 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
