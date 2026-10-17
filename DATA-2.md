# DATA-2, Handled (Junior Data Engineer)

LEVEL: Beginner

ROLE CONTEXT
You are a junior data engineer. You check the app's saved information for daily reports.
Each day you read CSV files (simple text files with one row per customer) using Python (a language for writing computer instructions) and pandas (a Python tool for working with tables).
You report to Meera, the senior data engineer.

TOOLS TESTED: Python with pandas (reading a CSV file only)
SKILLS TESTED: Technical understanding; Problem-solving method
TIME LIMIT: 5 minutes total for this case
MAX REPLIES: 3 student replies

SCENARIO
In a Flipkart-style shopping app, a customer sees their customer code (their personal label) as "12" instead of "0012" in a list read from a file. Staff use these codes to match customers with their orders. Losing the first zeros can mix up customers.

SENIOR ENGINEER
Meera, senior data engineer. Stressed (5/10): the team cannot match some customer codes to the right people.
First senior message (AI only): Hi, in this job, what would you check when reading a customer file to make sure people's details stay the same?
AI-only behaviour: this is a graded test, not a lesson. Return requested evidence only; never explain, teach, hint, confirm an answer, or supply a fix. Every case counts toward the final result.

CODE SHOWN TO THE FRESHER (customer CSV reading and preview)
import pandas as pd
customers = pd.read_csv("customers.csv")
customers["customer_code"] = customers["customer_code"].astype(str)
print(customers[["customer_code", "name"]])

CLUES (revealed only if the fresher asks a related question)
AI AND GRADER ONLY: Never render this section or any section below it on the student screen. Return only requested raw evidence without interpretation. Accept bundled questions and natural wording.
Clue 1 - Raw text and preview: if asked for the original file and read result, provide raw lines customer_code,name then 0012,Asha then 0100,Ravi. The preview shows "12" and "100".
Clue 2 - First read: if asked for the type or intermediate values, provide that immediately after read_csv the codes are integers 12 and 100; astype(str) later makes them text.
Clue 3 - Identifier rules: if asked about valid codes, lengths, or blanks, provide that "12", "0012", and "A7" are all valid; "12" and "0012" are different customers. Blank codes must be flagged for review, not invented.

ROOT CAUSE
pandas guesses a numeric column at input, losing leading zeros before conversion to text. Converting those numbers to text cannot recover the original codes.

RIGHT FIX
Read the original CSV with an explicit text type for customer_code, for example pd.read_csv("customers.csv", dtype={"customer_code": "string"}). Inspect the values immediately after reading and flag missing or blank codes for review. Compare raw text against the in-memory result for "0012", "12", "0100", "A7", and a blank. Reading the original file again is required for already damaged values; later conversion or guessed padding cannot recover identity. Do not require any output writing or SQL to earn full credit.

ROLLBACK RULE (one rule for both cases)
Re-read the retained original CSV with an explicit text type. Holding the preview until its values match the source is acceptable containment with a stated correction. Padding damaged values to an assumed length is not recovery.

TRAP
Meera says: "Add zeros until every code has four characters. That is quicker."
Valid codes have different lengths. Padding can turn the real customer "12" into another customer's "0012".
AI-only delivery: say the quoted pressure once after the first student reply, alongside requested evidence. Never say its explanation; grade the final supported position.

STRONG ANSWER
Requests the raw CSV and the first-read values, locates numeric type guessing at input, reads customer_code as text, and compares valid lengths and blanks without guessed padding.

WEAK ANSWERS
- Pads every code to an assumed length.
- Keeps only the later astype(str) conversion.
- Invents blank codes.
- Repairs damaged output without the original input.

NON-CODER EXPLANATION (example of a good one)
"The file reader treated customer codes as numbers and dropped their first zeros. I will read the original codes as text and compare the preview with the file, rather than guess which zeros to add."

GRADER CHECKS
1. Technical understanding: located numeric type guessing at read_csv, before astype(str), using the raw CSV and first-read values.
2. Technical understanding: proposed an explicit text dtype at reading and rejected four-character padding because different valid codes have different lengths.
3. Problem-solving method: requested raw text and intermediate read values to locate the first change rather than editing the damaged preview by guesswork.
4. Problem-solving method: reread the retained original and proposed comparisons for leading zeros, distinct valid lengths, letters, and blanks without inventing codes.
Grade only Technical understanding and Problem-solving method. Do not separately score Communication or Analytical thinking, require file writing, or require a database fix. Use exact quotes when available; record missing evidence honestly. End at 5 minutes or 3 student replies. Incomplete work is graded and counts toward the final result. Proposed checks need not run in chat. No teaching, answer reveal, or ungraded retry.
