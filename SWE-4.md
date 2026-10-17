# SWE-4, Handled (Junior Software Engineer)

LEVEL: Pro

ROLE CONTEXT
You are a junior software engineer. You build small features and fix bugs in the team's app.
Each day you read code, check what went wrong, and test your changes.
You report to Kavya, the senior software engineer.

TOOLS TESTED: reading logs; JavaScript; SQL
SKILLS TESTED: Analytical thinking; Technical understanding; Problem-solving method; Communication
TIME LIMIT: 12 minutes total for this case
MAX REPLIES: 5 student replies
BUILDS ON: SWE-1; SWE-3; BUGTICKET

SCENARIO
Two different buyers receive confirmed bookings for the last available seat. Read the JavaScript and SQL, request the time-ordered booking logs, and find the bug. Propose a safe fix and checks without deleting confirmed bookings. This case tests shared seat updates, not a button-only fix.

SENIOR ENGINEER
Kavya, senior software engineer. Stressed (8/10): the bookings team has two confirmations for one seat and wants the next booking to be safe.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (booking function)
async function reserveSeat(showId, buyerId) {
  const row = await db.one(
    "SELECT seats_left FROM shows WHERE id = ?", [showId]
  );
  if (row.seats_left < 1) return "Sold out";
  await db.run(
    "UPDATE shows SET seats_left = ? WHERE id = ?",
    [row.seats_left - 1, showId]
  );
  await db.run(
    "INSERT INTO bookings(show_id, buyer_id) VALUES (?, ?)",
    [showId, buyerId]
  );
  return "Confirmed";
}

Tables: shows(id, seats_left); bookings(id, show_id, buyer_id). db.one reads one row; db.run executes one statement. The SQL database supports transactions, which save a group of changes together, and returns the number of rows changed by an update.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw records without interpretation; accept bundled questions and natural wording.
Clue 1 - Ordered records: if asked for a failing trace, provide 12:00:00.100 A buyer=11 seat_read=1; 12:00:00.101 B buyer=12 seat_read=1; 12:00:00.110 A seat_written=0; 12:00:00.111 B seat_written=0; 12:00:00.120 A booking_inserted=801; 12:00:00.121 B booking_inserted=802. Both final records say Confirmed.
Clue 2 - Request grouping: if asked about duplicate sends, provide exactly one request for A and one for B, different buyers, and no repeated request records. Both target the same show.
Clue 3 - Save behaviour: if asked about failures or database support, provide that each existing statement saves independently. An insert can fail after the seat update. SQL supports transactions on one connection and a conditional update that reports changed rows. A failed insert in a separate sample leaves zero seats with no new booking.

ROOT CAUSE
The logs show two requests reading the same last seat before either update. The JavaScript separates checking from writing; SQL sets a value based on each old read, so both confirm. Independently saving the later insert can also consume a seat without a booking.

RIGHT FIX
Correlate A and B by request and time, then protect taking a seat and saving its booking in one SQL transaction. Use UPDATE shows SET seats_left = seats_left - 1 WHERE id = ? AND seats_left > 0; proceed only if one row changes, insert the booking, and commit. Roll back if insertion fails. An equivalent protected row-read transaction is valid. In JavaScript return Sold out for zero changed rows and do not return Confirmed before commit. Check two simultaneous buyers give one confirmation, sold-out requests do not insert, and insert failure restores the seat. Confirm from new logs and stored bookings. Do not require Git or REST API changes.

ROLLBACK RULE (one rule for both cases)
Pausing new bookings is acceptable containment with the concurrency diagnosis and protected transaction fix. Restoring code that also checks and writes separately is not a fix. Existing overbookings need an operational follow-up, not deletion to improve the result.

TRAP
Kavya says: "Disable the button after the first click. That should stop it, right?"
The buyers differ; changing one buyer's button cannot protect shared seat data.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Reconstructs A/B from logs, rules out repeated clicks, ties the trace to JavaScript reads and SQL writes, proposes a guarded transactional save, and checks confirmation order plus failure recovery.

WEAK ANSWERS
- Adds only a button lock or JavaScript delay.
- Wraps an unchecked read/write sequence in a transaction without protection against concurrent access.
- Ignores the changed-row count or allows negative seats.
- Deletes a confirmed booking instead of preventing the cause.

NON-CODER EXPLANATION (example of a good one)
"Both buyers read the same last seat before either save. I will make taking that seat and saving its booking one protected operation, and confirm only after it finishes. A failed booking must leave the seat available."

GRADER CHECKS
1. Analytical thinking: reconstructed A/B time order and ruled out repeated sends using request IDs and distinct buyers.
2. Technical understanding: connected the log trace to JavaScript check/write separation, SQL conditional updates, changed-row counts, and saving a booking within one transaction.
3. Problem-solving method: rejected the button-only trap, proposed protected save and confirmation-after-commit, and planned concurrent, sold-out, and insertion-failure checks using logs and stored rows.
4. Communication: explained the fix and the separate operational follow-up for existing overbookings in plain words without claiming unrun checks passed.
Grade all four listed skills with exact student quotes when available; record missing evidence honestly. End at 12 minutes or 5 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
