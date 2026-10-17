# DATA-4, Handled (Junior Data Engineer)

LEVEL: Intermediate

ROLE CONTEXT
You are a junior data engineer. You help turn daily data into reliable tables for reports.
Each day you check incoming rows, clean them, and check that the totals are right.
You report to Meera, the senior data engineer.

TOOLS TESTED: Python with pandas; scheduled daily job
SKILLS TESTED: Technical understanding; Problem-solving method; Communication
TIME LIMIT: 8 minutes total for this case
MAX REPLIES: 4 student replies
BUILDS ON: DATA-2

SCENARIO
The scheduled daily report loses earlier days after its morning run. The job can also run again when it does not receive a completion acknowledgement. Review the pandas update and the daily job settings, then propose an update that preserves history and stays correct when the same run is repeated. No SQL or CSV reading is required here.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (6/10): finance needs its history back and a safe way to repeat today's load.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (daily job settings and pandas update)
Schedule: daily at 06:00, Asia/Kolkata.
Target: the previous completed business day, passed as target_day to the run.
Retry: repeat the same target_day once after five minutes if no completion acknowledgement arrives.

import pandas as pd

def run_daily(target_day, input_rows, history):
  daily = input_rows[input_rows["sale_day"] == target_day]
  accepted = daily.dropna(subset=["sale_id", "sale_day", "amount_rupees"])
  publish(accepted, mode="replace")

input_rows and history are supplied pandas tables with text sale_id, sale_day, and numeric amount_rupees. publish replaces or appends the published pandas report; its write either finishes completely or leaves the previous report intact. The schedule and retry settings above are supplied job configuration, not a new command the student must learn.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Coverage: if asked about inputs and before/after days, provide that history held October 1-13. The run for target_day October 14 received 82 rows, accepted 80, and afterwards only those 80 October 14 rows remained. The prior history is recoverable from a saved checked copy.
Clue 2 - Run records: if asked about repeats or the schedule, provide that the 06:00 run published successfully but its acknowledgement was lost. At 06:05 the daily job repeated target_day October 14. Repeat runs are allowed; the same day should still have one approved copy of each sale.
Clue 3 - Validation: if asked about identities or missing fields, provide unique sale_id within a day. Two input amounts were missing. Those rejected rows need recorded review and finance approval before a partial-day report is published; other days must remain unchanged.

ROOT CAUSE
The pandas job ignores history and replaces the entire report with one day. A switch to append would preserve old days but duplicate that day on the scheduled retry. dropna also removes two rows without recording their rejection.

RIGHT FIX
Recover the checked history. Validate the input day and sale IDs, record rejected rows, and obtain approval before a partial-day publication. Build a replacement report with pd.concat([history[history["sale_day"] != target_day], accepted], ignore_index=True), then use the supplied all-or-nothing publish in replace mode. Reject conflicting duplicate sale IDs rather than silently choosing one. Keep the daily schedule and allow retries using the same target_day; a repeated run must produce the same report. Check history preservation, repeated and failed publication, and accounting for 82 input rows versus 80 accepted plus two rejected. No SQL transaction or CSV import is required.

ROLLBACK RULE (one rule for both cases)
Pause publication and restore the checked history while correcting the pandas update. Restoring the old report without fixing repeat-safe day replacement is temporary. Disabling retries is not a complete fix; lost acknowledgements can still occur.

TRAP
Meera says: "Change replace to append and run it twice to be sure."
Appending the same day twice can duplicate sales and does not handle safe replacement or rejected rows.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Requests coverage and scheduled run records, identifies the whole-report replacement and retry risk, builds a day-specific pandas replacement retaining other days, accounts for rejected rows, and states how repeat runs will be checked.

WEAK ANSWERS
- Changes replace to append and duplicates the day on retry.
- Deletes or ignores history on every scheduled run.
- Turns off retries without fixing the published data update.
- Claims all 82 rows were accepted or silently drops missing amounts.

NON-CODER EXPLANATION (example of a good one)
"The daily job replaced our history with one day. I will keep the other days and replace only the selected day, so a repeat run does not add the same sales twice. The two incomplete rows still need review."

GRADER CHECKS
1. Technical understanding: explained the pandas whole-report replacement and why append would duplicate the scheduled retry; supplied a target-day replacement retaining history.
2. Problem-solving method: requested before/after coverage and the two run records, then planned same-target repeat and failed-publication checks without merely disabling retries.
3. Problem-solving method: recorded rejected rows, required partial-day approval, and reconciled input, accepted, and rejected counts before publication.
4. Communication: gave a short update covering lost history, the proposed correction, and pending row review without claiming unrun checks passed.
Grade only Technical understanding, Problem-solving method, and Communication. Do not separately score Analytical thinking or require SQL, CSV reading, or a particular scheduler product. Use exact quotes when available; record missing evidence honestly. End at 8 minutes or 4 student replies. Incomplete work is graded and counts toward the final result. No teaching, answer reveal, or ungraded retry.
