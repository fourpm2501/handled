# DESIGN.md
Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing.

## 1. The feeling, in labels
- Senior's message, every case opens with a message from your senior, so the student feels like a new joiner, not someone taking a test.
- Hot seat, a quiet countdown and a fixed number of replies keep gentle pressure on, so the student has to think like the role instead of browsing.
- Evidence when you ask, logs, records and code arrive in the senior's reply only after the student asks, the way a senior pastes them in chat.
- One conversation, only the chat and the reply box need attention; nothing else on screen competes with thinking.
- Senior's reply, every case ends with a message from your senior in the same chat: what you did well, where you slipped, and how the role would think it through. No marks, no scores.

## 2. References, one per component

Hero: linear.app (homepage)
Take: one bold headline, one short line under it, one button, lots of empty space around them.
Ignore: product screenshots, animated backgrounds, gradients, logo strips.

How it works strip: stripe.com (any "how it works" row of 3 steps)
Take: three short steps side by side, a number and a 2–4 word title for each, one plain sentence under each.
Ignore: icons, illustrations, links inside steps.

Role choice: Duolingo course picker, refs/duolingo-course-picker.png
Take: large tappable cards, role name in bold, one line on what you'll handle, the case count and time.
Ignore: flags, mascots, streaks, progress bars.

Role briefing ("You are a junior software engineer"): WhatsApp "contact info" screen, refs/whatsapp-contact-info.png
Take: who you are, who your senior is, and what you'll be doing, in 3–4 short lines; feels like joining a team.
Ignore: profile photos, media galleries, settings.

Case ticket and evidence (code, logs): GitHub issue + file view
Take: ticket title, short description, then a monospace block with line numbers in a lightly tinted card.
Ignore: labels, assignees, reactions, syntax colours beyond one muted tone.

Conversation: WhatsApp chat thread, refs/whatsapp-chat-thread.png
Take: senior's messages on the left with their name, student's on the right, reply box fixed at the bottom, a small "typing…" line while the senior replies.
Ignore: ticks, emojis, voice notes, wallpaper.

Senior's reply (feedback): a Slack thread reply from a teammate
Take: it arrives as the last message in the same chat, a slightly wider bubble, short paragraphs: what went well, where it slipped, how the role thinks, one thing to try next.
Ignore: reactions, emoji, scores, stars, badges, confetti.

Proof page (officer view): Google Classroom "Grades" tab
Who reads it: the college placement officer or principal (later, a recruiter), on a laptop or phone.
What they decide in one minute: which students are ready for which role, who needs help before placements, and where the batch as a whole is weak.
Take: a table with one row per student: name, role tried, cases finished, and a score for each of the four skills the grader saves (Analytical thinking · Technical understanding · Problem-solving method · Communication), plus one overall "Ready / Nearly / Not yet". Tap a row to open that student's chat and the senior's reply as evidence.
Overall readiness (from the four skill scores, each out of 10):
- Ready: every skill 7 or above
- Nearly: every skill 5 or above, and at least one below 7
- Not yet: any skill below 5
- Not assessed: the student submitted no answers (every turn timed out). Show the number of timeouts instead of scores.
Ignore: assignment lists, comments, due dates, Classroom branding, colour-coded cells beyond one highlight for "Not yet".
Note: scores appear only here. Students never see them; they only see the senior's reply.

## 3. Type and colour
The idea: heat on the outside, clear head on the inside.
Orange pulls you into the hot seat and marks every action. Violet is your senior's voice. Black is the evidence. The case itself sits on calm paper.
Font: IBM Plex Sans (400, 500, 600) for everything; IBM Plex Mono for code and logs only.
Sizes (mobile first):
- 32 px / 600, one headline per screen (hero, briefing, wrap-up)
- 18 px / 600, role names, case titles
- 16 px, chat, feedback, body text; buttons at 16 px / 600. Never smaller for anything people read.
- 13 px / 500, sentence case, labels and timer ("Case 1 of 3 · Beginner · 5 min"). Capitals only for the hero label.
- 13 px Plex Mono, code and logs; scroll sideways instead of shrinking.
Buttons and cards: 12 px corners. Chat bubbles: 16 px with one 4 px corner on the speaker's side.
Colours, each with one meaning:
- Orange #FF6A13, the heat and every action. The main button is orange with black text; the one exception is a button sitting on an orange surface (the Home hero), which is black with white text. #FF6A13 is never used as text.
- Orange text #C2410C, small orange labels on light backgrounds (case label).
- Violet #6E3BF5, the senior's voice, and nothing else: the senior's name in chat and the senior's feedback bubble (white text).
- Black #111111, evidence and the Home canvas: log blocks, Home background, body text.
- Paper #F4F2EE, the desk: background of every case screen, and both role cards on Home (black text).
- White #FFFFFF, top bars, senior's chat bubbles, reply bar, with a 1 px border of black at 10%.
- Soft orange #FFE2CF, the student's chat bubbles.
- Error red #D92D20, errors, and the timer in its last 15 seconds; otherwise the timer is black.
- Officer view only (dot plus word, never filled cells): Ready #1B7A3E solid dot · Nearly #9A6400 solid dot · Not yet #111111 hollow ring · Not assessed #6B7280 grey dash, followed by the reason, e.g. "Not assessed · no answers, 8 timeouts".
Rules:
- Loud outside, calm inside: black backgrounds only on Home. Case screens are paper and white, with orange only on the main button and violet only for the senior.
- Never orange and violet side by side as large blocks on a case screen.
- Logs and code appear only inside a senior's reply, after the student asks. Never on the case screen up front. In a log, orange (#FF8A3D) marks only the value that matters; everything else is white.
- One orange button per screen.

## 4. Screens
### Student screens
Home: for getting a student into a role in one tap.
Top to bottom: ink strip with label THE HOT SEAT BEFORE THE JOB · red hero (headline, subhead, Take the hot seat button, "Free · No login · 5–12 minutes per case") · cream gap · amber panel CHOOSE YOUR ROLE with two role cards (Junior Software Engineer: "Find what broke in the app · 3 cases"; Junior Data Engineer: "Find where the data went wrong · 3 cases") · How it works strip (Get the problem · Handle it · See how you did).
Main action: Take the hot seat → scrolls to role cards. Tapping a role card → Role briefing.
Empty: n/a · Loading: "Getting your seat ready…" · Error: "This page didn't load. Refresh to try again." · Done: n/a

Role briefing: for making the student feel hired before the clock starts.
Top to bottom: label YOUR ROLE · role name in IBM Plex Sans · 3 short lines: who you are ("Two weeks into the job"), who your senior is (Kavya for software, Meera for data), what will happen ("Your senior will message you with a problem. Handle it.") · How a case works: replies allowed, seconds per reply, no paste, the senior shares more only if you ask · name field ("Your name", placeholder "Type your full name").
Main action: Start case 1 → Case.
Empty: name field empty → "Add your name so your senior knows who's handling this." · Loading: "Telling your senior you're in…" · Error: "Couldn't start the case. Try again." · Done: n/a

Case: for handling the problem. This is the hot seat.
Top to bottom: top bar: case label in red, e.g. "CASE 3 OF 3 · PRO · 12 MIN" (case number, level, and that case's total time) · on the right "2 replies left · 9:41" in ink, magenta only in the last 15 seconds · ticket card (only the symptom, in 2–3 sentences) · no evidence on screen at the start; logs, records and code appear only inside the senior's reply, as a black log block, after the student asks for them · chat (senior's messages in white bubbles on the left with name in red; student's in soft amber on the right) · reply box pinned at the bottom with placeholder "Ask a question or suggest a fix…" and red Send button.
Main action: Send → senior replies, or after the last reply → senior's feedback appears in the same chat.
Empty: chat always opens with the senior's first message, never blank · Loading: "[Senior name] is typing…" · Error: "Your reply didn't send. It's saved, tap Send again." · Timeout: the turn is recorded as no answer, and the senior moves on ("No reply? I'll keep going.")
Done: the senior's feedback arrives as the last message in an ink bubble, then the Next case button appears.

Senior's feedback (end of each case, inside the Case screen): for showing how the role thinks.
Top to bottom, inside one ink bubble: label "[Senior name]'s reply" in amber, then exactly these, in order:
1. What you did well (one sentence, pointing at the student's own words)
2. Where it slipped and how the role would think it through (one sentence)
3. "Next time: …" in soft amber (one sentence)
Limit: 3 sentences, under 50 words. If nothing slipped, sentence 2 says how the role would take it further, never an invented slip. No scores, no marks, no ticks or crosses.
Main action: Next case → next Case (after case 3: See how you did → Role wrap-up).
Loading: "[Senior name] is reading your replies…" · Error: "Your senior's reply didn't load. Your chat is saved, try again in a minute." · Done: feedback shown.

Role wrap-up (after case 3): for helping the student decide if this role fits them.
Top to bottom: label ROLE DONE · headline in IBM Plex Sans ("You handled 3 cases as a junior software engineer") · one note from the senior on how the student thinks across all three cases: three short sentences at most, under 50 words (what they always did, what held them back, one habit to build) · "Try the other role" card (the role they haven't tried) · link to re-read each case.
Main action: Try [other role] → Role briefing for that role.
Empty: n/a · Loading: "Putting your 3 cases together…" · Error: "Couldn't load your summary. Your cases are saved." · Done: n/a

### Officer screens
Batch view: for a placement officer or principal to decide, in one minute, who is ready for which role.
Top to bottom: batch name and date · four counts in a row (Ready · Nearly · Not yet · Not assessed) · table, one row per student: name, role, cases finished, Analytical thinking, Technical understanding, Problem-solving method, Communication (each /10), overall readiness as dot or ring or dash plus the word.
Main action: tap a student row → Student detail.
Empty: "No students have taken a case yet. Share the link with your batch to start." · Loading: "Loading your batch…" · Error: "Couldn't load the batch. Refresh to try again." · Done: n/a

Student detail: for checking the evidence behind a score.
Top to bottom: student name, role, readiness · the four skill scores with one line each on why · each case: the full chat and the senior's feedback, collapsed by default.
Main action: Back to batch → Batch view.
Empty: "This student hasn't finished a case yet." · Loading: "Loading their cases…" · Error: "Couldn't load this student. Go back and try again." · Done: n/a

Officer access: email sign-in, no open links.
- Handled adds each officer's college email by hand when the college signs up. Only those emails can sign in.
- Sign-in is a one-time 6-digit code sent to that email. No passwords.
- The batch view and student detail pages work only when signed in. A forwarded link opens the sign-in screen, never the data.
- An officer sees only their own college's students.
- Sign-in screen: "Placement view" · email field (placeholder "officer@college.edu.in") · button "Send my code" → code screen.
Error: "This email isn't on your college's list. Ask Handled to add it." · Wrong code: "That code didn't match. Check your email and try again."

## 5. The first screen's words
Label (above the headline): THE HOT SEAT BEFORE THE JOB
Headline: Don't guess the job. Handle it.
Under it: Your senior engineer brings you a real work problem. Handle it, and find out how this role makes you think.
Choose your role: Junior Software Engineer or Junior Data Engineer.
Button: Take the hot seat → scrolls to the role cards; tapping a role opens its briefing.
Under the button: Free · No login · 5–12 minutes per case
Rules for these words:
- Change none of them without asking. They are the promise every other screen keeps.
- The time range comes from the case timers: Beginner 5 minutes, Intermediate 8, Pro 12. If a timer changes, this line changes with it.
- Each case shows its level and time in the case screen's top bar ("CASE 3 OF 3 · PRO · 12 MIN"), so the student is never surprised mid-role.
- "Free" stays only while it is free.
- When a new role launches, add it to the "Choose your role" line; the headline and button don't change.

## 6. Principles
The one test for every screen:
"What will the student think differently after this screen?"
If the answer is "nothing", the screen, element or line goes.
The thought each screen must trigger:
- Home → "Which of these jobs could I actually handle?"
- Role briefing → "I'm the new junior here. My senior expects me to think, not guess."
- Case → "What do I need to know before I act?"
- Senior's feedback → "So that's how someone in this role would have thought about it."
- Role wrap-up → "This is how I think. Does it fit this job?"
- Officer view → "Which students are ready, and which ones need help before placements?"
1. Make them think like the role, never like a test-taker.
No marks, ticks, crosses or right/wrong labels anywhere a student can see; they hear from a senior, not a grader. Words stay plain, so the thinking is about the job, not the jargon: any technical term gets a one-line explanation beside it.
2. Make them ask before they act.
Nothing that answers the problem appears until the student asks for it or the case ends: no clue, trap, root cause or strong answer up front.
3. Pressure they can feel, never panic.
The student always knows which case they're on, how many replies are left and how much time is left. Loud colour pulls them in; the space where they think stays calm.
4. One decision per screen.
One main action, one red button. If a screen asks for two decisions, split it.
5. Every promise on screen is true.
Times, prices and labels match what the product really does. Sample data says it's sample data.
6. Nothing the student does is lost.
A failed send, a refresh or a timeout never deletes a typed reply or a finished chat.
When a new screen or feature is proposed, it must name the thought it triggers before it is designed. If it can't, ask before building it.