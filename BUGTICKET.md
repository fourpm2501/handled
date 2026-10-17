# BUGTICKET, Handled v1 (Junior Software Engineer)

SCENARIO
Since this morning's 10 am release, some users can't log in. They see "Account not found" even though they've used the app for months. Other users log in fine.

SENIOR ENGINEER
Kavya, senior backend engineer. Stressed (7/10): support tickets are piling up and her manager wants an update by 1 pm. She wants the cause and a fix, not a guess.

CODE SHOWN TO THE FRESHER (login function, after this morning's change)
function login(emailTyped, password) {
  const email = emailTyped.toLowerCase(); // NEW line added this morning
  const user = db.findUserByEmail(email); // exact match against saved email
  if (!user) return "Account not found";
  if (!checkPassword(user, password)) return "Wrong password";
  return "Login success";
}

CLUES (revealed only if the fresher asks a related question)
Clue 1 – Logs: if asked about logs or error messages → every failed login shows "Account not found". None show "Wrong password".
Clue 2 – Last change: if asked what changed in the release → one new line: the typed email is converted to lowercase before searching, "to clean up messy emails".
Clue 3 – Who is affected: if asked which users fail, or for an example → only users whose saved email has a capital letter, e.g. "Ravi.K@gmail.com". These accounts were created before the release. Users with all-lowercase saved emails are fine.

ROOT CAUSE
The new line turns "Ravi.K@gmail.com" into "ravi.k@gmail.com", but the database still has "Ravi.K@gmail.com" saved. The search needs an exact match, so it finds nothing. The password is never even checked.

RIGHT FIX
Compare both sides in lowercase: search the database ignoring capital letters (lowercase the saved email in the search too). Long term, convert all saved emails to lowercase once, so every email is stored the same way.

ROLLBACK RULE (one rule for both cases)
Removing the new lowercase line, whether by deleting it or by rolling back the release, is the same action.
- ACCEPTABLE as a short-term step ONLY IF the fresher also (a) names the cause: saved emails with capital letters no longer match the lowercased search, AND (b) gives the proper fix above.
- WEAK if the fresher removes or rolls back the line without naming that cause and the proper fix.

TRAP
Kavya says: "Users are locked out, so just send password reset links to everyone affected. Do it now."
This looks right because it's a login problem, but the password isn't the issue. Reset links won't help, because the system still can't find their account.

STRONG ANSWER
Asks for the logs and the last change before guessing. Notices "Account not found", not "Wrong password", so the account lookup is failing. Asks which users fail and spots the capital letters. Explains the cause, suggests the case-insensitive search, and politely says password resets won't work.

WEAK ANSWERS
- Agrees to send password resets (fell for the trap).
- Removes the lowercase line or rolls back the release without naming the capital-letter cause and the proper fix (see ROLLBACK RULE).
- Guesses "server is down" or "database problem" without asking for clues.
- Finds the cause but can't explain it simply.

NON-CODER EXPLANATION (example of a good one)
"This morning we started writing everyone's email in small letters before searching. But some people saved their email with a capital letter, like Ravi.K. The system looks for an exact match, so it can't find them. We'll make the search ignore capital letters."

GRADER CHECKS
1. Asked the right questions before guessing (logs, last change, who is affected; at least 2 of 3 before proposing a fix).
2. Found the real cause (capital letters vs the new lowercase line).
3. Proposed the right fix (or rollback per the ROLLBACK RULE) and rejected the password-reset trap.
4. Explained the fix so a non-coder understands it.