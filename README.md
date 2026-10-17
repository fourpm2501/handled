# Handled

The local start screen now offers two role tests. Software engineer runs `SWE-1.md`, `SWE-2.md`, then `BUGTICKET.md`; Junior data engineer runs `DATA-1.md`, then `DATA-2.md`. Each case uses its saved ticket's public briefing, role context, total case time, student reply limit, tested skills and private grader checks. BUGTICKET's missing metadata comes from `ROLE-MAP.md` (eight minutes, four replies) and its existing role text; those settings are copied into the saved case. Ticket files are generated into a server-only registry by `scripts/sync-facts.mjs`.

The existing session, chat composer, paste/drop blocking, independent grader calls and result cards are reused. Next-case starts require the same browser owner and completion of the previous case. The final role score is the mean of its case scores, each case score being the mean of that case's tested skills. Public queries omit full tickets and raw grader outputs; public feedback describes demonstrated skills without revealing private answers. Legacy QuickBite and Kavya result links retain their original handling. QuickBite is hidden on the start screen.

Run `npm run convex -- --once` to sync only the configured development backend, then `npm run dev` for http://127.0.0.1:5173. `node scripts/check-role-cases.mjs` plays one weak SWE-1 chat and one weak DATA-1 chat using the real AI, checks timers, blocking, shared results and next-case previews, and writes full visible transcripts/pages under `proof/`. `node scripts/capture-role-results.mjs` refreshes those saved pages without replaying the chats. No production deployment was performed for this role-flow change.

The notes below describe the retained legacy flows.

Practice customer support using FACTSHEET.md as the only scenario and policy source.

The start screen also offers junior software engineer practice from `BUGTICKET.md`. Kavya's scenario uses its own role-playing action and four-check grader; QuickBite's prompts and three scores are unchanged. The login function appears above the chat. Only the public ticket briefing and code are sent to the browser, while the complete ticket remains in Convex for grading. A question classifier identifies requested clue categories; only those exact source clues are appended to Kavya's response. Her role-playing prompt never receives unrevealed clues, root cause or fixes. All AI calls keep the 400-token cap.

Run `npm run convex` in one PowerShell window and `npm run dev` in another. Open http://127.0.0.1:5173.

The Convex development project is `handled-app`, deployment `small-manatee-504` (Sydney). Production is `affable-gerbil-821`, live at https://affable-gerbil-821.convex.site. Run `npm run deploy` to build for the production Convex URL, push the backend and upload the frontend using Convex static hosting. Production has its own `OPENAI_API_KEY`; set it directly on that deployment with a hidden prompt, never in frontend code or local files.

Only Convex actions read `process.env.OPENAI_API_KEY`. No key belongs in local environment files, client code or source control. Set it directly on the development deployment using a hidden PowerShell prompt.

Each chat has eight customer or senior-engineer messages and eight fresher reply opportunities. The server allows 90 seconds per QuickBite reply and three minutes per Kavya reply, records response times, and saves a timeout if no reply arrives. Paste and dropped text are blocked in the reply box. Refreshing does not reset the server deadline. Kavya opens with the exact neutral release report and introduces the password-reset trap on her third message, or earlier when a fix is proposed before logs or release changes are requested. Her displayed code omits comments. QuickBite's public reference includes only SCENARIO, CUSTOMER and RULES; the full saved sheet still goes to its AI customer and grader.

Results live at `/result/<unique token>`. Anyone with that link can read the transcript; only the browser that started the chat holds its private write token. Local result links require the local frontend server to be running.

Customer calls and independent grading calls use `gpt-4.1-mini`, each capped at 400 output tokens. Kavya's exact opening is fixed text. The independent grader assesses each dimension in a separate call so full-line evidence has space. Scores are saved together only after every output passes validation, including exact transcript quote checks (three checks for QuickBite, four for Kavya). Failures display `Grading unavailable, try again` and never substitute scores.

`npm run build` regenerates the backend factsheet from UTF-8 FACTSHEET.md, checks types and builds the frontend. `npm run convex` regenerates the sheet before pushing development functions. Chats store their own copy of the sheet so later edits do not change their grading evidence.

Checks: `npm test` (server timing, eight-message limit, private write token, duplicate submission, timeout, failure/retry); `node scripts/check-browser.mjs` (installed Chrome, requires the key to remain unset); `node scripts/run-live-chats.mjs` (after the key is set, two genuine AI chats and full verbatim grader outputs).

`node scripts/run-kavya-chats.mjs` runs the weak password-reset chat and the strong investigation-first chat, verifies selective clue disclosure, paste blocking, timings, four exact-quote grades and shareable results, and checks an existing QuickBite result. Full transcripts and unmodified grader outputs are saved under `proof/kavya-*-chat.txt`.
