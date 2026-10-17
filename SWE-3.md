# SWE-3, Handled (Junior Software Engineer)

LEVEL: Intermediate

ROLE CONTEXT
You are a junior software engineer. You build small features and fix bugs in the team's app.
Each day you read code, check what went wrong, and test your changes.
You report to Kavya, the senior software engineer.

TOOLS TESTED: Git; JavaScript
SKILLS TESTED: Technical understanding; Problem-solving method; Communication
TIME LIMIT: 8 minutes total for this case
MAX REPLIES: 4 student replies
BUILDS ON: SWE-1; SWE-2

SCENARIO
An order total changes when support adds a second note, though prices did not change. The team added note display in a recent Git commit. Inspect the JavaScript and request Git history or a before/after comparison to locate the change and propose a focused correction without removing notes. No SQL is used.

SENIOR ENGINEER
Kavya, senior software engineer. Stressed (6/10): support cannot trust the order screen and needs a cause and a safe fix.
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (current JavaScript order view)
function orderView(items, notes) {
  const rows = items.flatMap(item =>
    notes.length ? notes.map(note => ({id: item.id, price: item.price})) : [item]
  );
  return {
    total: rows.reduce((sum, row) => sum + row.price, 0),
    notes: notes.map(note => note.text)
  };
}

Each item has a unique id and validated numeric price. Notes have text and do not change prices. The deployed Git commit is b22; the preceding release is a10. Their history and code comparison are available on request.

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return requested raw evidence only; accept bundled questions and natural wording.
Clue 1 - Reproduction: if asked about input and results, provide items [{id:501,price:100},{id:502,price:50}]. One note gives 150 in b22; two give 300. a10 gives 150 in both cases. Different items may have the same price.
Clue 2 - Git comparison: if asked for history or a diff, provide a10 as the preceding release and b22 as the note-display release. In a10 orderView returned total: items.reduce((sum, item) => sum + item.price, 0) and notes: []. b22 added flatMap rows and changed the total input from items to rows. Only order-view.js changed; no other feature needs repeated item rows.
Clue 3 - Shared release: if asked about rollback or history, provide that b22 is shared and contains required note display. Keep notes visible. A corrective commit or recorded revert is supported; rewriting shared history is not allowed.

ROOT CAUSE
Git comparison identifies b22 as the change to one row per item-note combination. JavaScript totals those repeated rows, so a second note doubles each item contribution.

RIGHT FIX
Use Git history and the a10-to-b22 comparison to locate the total input change. Sum original items while keeping notes.map, and record a focused corrective commit without rewriting shared history. Item-id-based deduplication is also acceptable; price-based deduplication is not. Check zero, one, and multiple notes and equal-priced distinct items. No SQL or API change is needed.

ROLLBACK RULE (one rule for both cases)
A recorded git revert of b22 may contain the issue if the student acknowledges temporary loss of required notes and gives a focused fix restoring them. Do not reset or force-push shared history. Deleting notes is unacceptable.

TRAP
Kavya says: "Just add DISTINCT to the prices and ship it."
Different items can have the same price; collapsing prices can undercount them.
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Requests a Git comparison and reproduction, relates the changed input to repeated JavaScript rows, sums original items while retaining notes, records a correction, and rejects price deduplication.

WEAK ANSWERS
- Uses a Set of prices or another distinct-price shortcut.
- Deletes notes to make the total smaller.
- Rewrites shared Git history instead of recording a correction.
- Names a commit without explaining its calculation change.

NON-CODER EXPLANATION (example of a good one)
"The note-display change made the total count each item once per note. I will add the original items once, keep the note display, and record the correction in a new commit."

GRADER CHECKS
1. Technical understanding: used a10-to-b22 Git evidence to explain flatMap repetition and the changed reduce input; distinguished item identity from price.
2. Problem-solving method: requested history and reproduction, proposed a focused corrective commit, and checked zero/multiple notes and equal-priced items without rewriting shared history.
3. Problem-solving method: rejected distinct-price shortcuts and preserved the note feature rather than accept an incomplete rollback as the final fix.
4. Communication: explained the change, impact, correction, and temporary rollback cost without claiming checks were executed.
Grade only Technical understanding, Problem-solving method, and Communication. Do not separately score Analytical thinking or require SQL. Natural-language Git evidence requests count; commands need not run in chat.
Use exact student quotes when available; record missing evidence honestly. End at 8 minutes or 4 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
