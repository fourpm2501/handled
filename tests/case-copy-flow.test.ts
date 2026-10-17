import {getFunctionName} from 'convex/server';
import {it,expect,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {internal} from '../convex/_generated/api';
import {advanceTicket} from '../convex/ticketAi';
import {ticketParts,ROLE_CASES} from '../convex/ticketRules';
import {CASE_OPENINGS} from '../convex/caseConversation';
import {studentFeedback} from '../convex/studentPresentationRules';
import {chipEvidence} from '../convex/chipEvidence';
import {getQuestionChips} from '../src/questionChips';
import {evidenceReadingHint} from '../src/evidenceView';
import type {ActionCtx} from '../convex/_generated/server';
import type {Doc,Id} from '../convex/_generated/dataModel';
const modules=import.meta.glob('../convex/**/*.*s');
for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
 it(`${caseId}: opens with the problem and ends after a proposed fix, without another question`,async()=>{
  const ticket=ticketParts(caseId),id='session-id' as Id<'sessions'>;
  const runMutation=vi.fn(),ctx={runMutation} as unknown as ActionCtx;
  const s={_id:id,caseId,factsheet:ticket.source,status:'customer',messages:[]} as unknown as Doc<'sessions'>;
  const complete=vi.fn(async()=>JSON.stringify({proposesFix:true,needsGuidance:false}));
  await advanceTicket(ctx,s,id,'lease',complete);
  expect(runMutation.mock.calls[0][1].text).toBe(CASE_OPENINGS[caseId]);
  expect(runMutation.mock.calls[0][1].text).toMatch(/Can you check\?$/);
  expect(complete).not.toHaveBeenCalled();
  s.messages=[{role:'customer',text:CASE_OPENINGS[caseId],at:1},{role:'fresher',text:'I will change the code to fix this.',at:2}];
  await advanceTicket(ctx,s,id,'lease',complete);
  expect(getFunctionName(runMutation.mock.calls[1][0])).toBe(getFunctionName(internal.sessions.finishProposedFix));
  expect(runMutation.mock.calls[1][1]).toEqual({id,lease:'lease'});
  complete.mockResolvedValue(JSON.stringify({proposesFix:false,needsGuidance:false,requested:[],unavailable:false}));
  await advanceTicket(ctx,s,id,'lease',complete);
  expect(getFunctionName(runMutation.mock.calls[2][0])).toBe(getFunctionName(internal.sessions.customer));
  expect(runMutation.mock.calls[2][1].text).toContain("What's your next step?");
 });
 it(`${caseId}: names the refused hack in three sentences under 50 words`,()=>{
  for(const found of [true,false]){
   const note=studentFeedback(caseId,[{role:'fresher',text:'No, I will not do that.'}],found,true);
   expect(note[1]).toMatch(/^You said no to /);
   expect(note.join(' ').split(/\s+/).length).toBeLessThan(50);
   expect(note.join(' ').split(/[.!?]+(?:\s|$)/).filter(Boolean)).toHaveLength(3);
   expect(studentFeedback(caseId,[{role:'fresher',text:'Yes, do that.'}],found,false)[1]).not.toContain('You said no');
  }
 });
 it(`${caseId}: every chip's evidence has a reading hint`,()=>{
  for(const chip of getQuestionChips(caseId)){
   const evidence=chipEvidence(caseId,ticketParts(caseId).source,chip.question)!;
   expect(evidenceReadingHint(evidence.block).length).toBeGreaterThan(25);
  }
 });
}
it('a proposed fix schedules the unchanged grader without editing messages, deadline or saved grades',async()=>{
 const t=convexTest(schema,modules),messages=[{role:'fresher' as const,text:'I will fix it.',at:1}];
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'fix',owner:'owner',caseId:'SWE-1',factsheet:ticketParts('SWE-1').source,status:'customer',lease:'lease',messages,deadlineAt:12345}));
 await t.mutation(internal.sessions.finishProposedFix,{id,lease:'wrong'});
 expect((await t.run(ctx=>ctx.db.get(id)))!.status).toBe('customer');
 await t.mutation(internal.sessions.finishProposedFix,{id,lease:'lease'});
 const s=(await t.run(ctx=>ctx.db.get(id)))!;
 expect(s.status).toBe('grading');expect(s.messages).toEqual(messages);expect(s.deadlineAt).toBe(12345);expect(s.caseGrade).toBeUndefined();
 await t.run(ctx=>ctx.db.patch(id,{status:'complete'}));
 const before=await t.run(ctx=>ctx.db.get(id));
 await t.mutation(internal.sessions.finishProposedFix,{id,lease:'lease'});
 expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
});
it('uses the requested exact log and request reading hints',()=>{
 expect(evidenceReadingHint('10:01 item_added value="0100" type=text')).toBe('Each line is one step. Check the type of each value.');
 expect(evidenceReadingHint('GET /tickets?status=open&assigned=true')).toBe('This is what the app asks for. Each part after ? is a filter.');
});
