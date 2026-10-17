import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {getFunctionName} from 'convex/server';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {ROLE_CASES,ticketParts,publicTicket} from '../convex/ticketRules';
import {CASE_OPENINGS,CAUSE_CONFIRMATIONS,guidingQuestion,plainTicketAnswer} from '../convex/caseConversation';
import {advanceTicket} from '../convex/ticketAi';
import {chipReply} from '../convex/chipEvidence';
import {getQuestionChips} from '../src/questionChips';
import {buildRoleScorecard} from '../convex/roleScorecard';
import {skillWord,BRIEFING_LINE,ROLE_JOB_LINES} from '../src/studentView';
import {officerSummary} from '../convex/officerRules';
import type {ActionCtx} from '../convex/_generated/server';
import type {Doc,Id} from '../convex/_generated/dataModel';
const modules=import.meta.glob('../convex/**/*.*s'),owner='interaction-owner-123456789012345';
afterEach(()=>vi.useRealTimers());
for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
 it(`${caseId}: reading and refresh do not start the clock; first interaction starts it once`,async()=>{
  vi.useFakeTimers();const t=convexTest(schema,modules),ticket=publicTicket(caseId);
  const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'clock',owner,caseId,roleId:ticket.roleId,factsheet:ticketParts(caseId).source,status:'reply',replyStartedAt:Date.now(),messages:[{role:'customer',text:CASE_OPENINGS[caseId],at:Date.now()}]}));
  vi.advanceTimersByTime(600000);expect((await t.query(api.sessions.get,{token:'clock'}))!.deadlineAt).toBeUndefined();
  await expect(t.mutation(api.sessions.beginInteraction,{token:'clock',owner:'wrong'})).rejects.toThrow('Session unavailable');
  const deadline=(await t.mutation(api.sessions.beginInteraction,{token:'clock',owner}))!;expect(deadline-Date.now()).toBe(ticket.timeLimitMs);
  vi.advanceTimersByTime(1000);expect(await t.mutation(api.sessions.beginInteraction,{token:'clock',owner})).toBe(deadline);
  expect((await t.query(api.sessions.get,{token:'clock'}))!.deadlineAt).toBe(deadline);
  expect((await t.run(ctx=>ctx.db.get(id)))!.messages).toHaveLength(1);
 });
 it(`${caseId}: first chip tap starts the same clock and supplies exactly the existing evidence`,async()=>{
  const t=convexTest(schema,modules),ticket=publicTicket(caseId),source=ticketParts(caseId).source,chip=getQuestionChips(caseId)[0];
  const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'chip-clock',owner,caseId,factsheet:source,status:'reply',replyStartedAt:Date.now()-900000,messages:[{role:'customer',text:CASE_OPENINGS[caseId],at:1}]}));
  const started=Date.now();await t.mutation(api.sessions.reply,{token:'chip-clock',owner,text:chip.question,turn:1});
  const s=(await t.run(ctx=>ctx.db.get(id)))!;expect(s.deadlineAt!-started).toBeCloseTo(ticket.timeLimitMs,-2);expect(s.messages[1].timedOut).toBe(false);
  expect(s.messages[2].text).toBe(chipReply(caseId,source,chip.question,[{role:'customer',text:CASE_OPENINGS[caseId]}]));
 });
 it(`${caseId}: plain ticket questions are answered before a nudge without pointing to unseen evidence`,async()=>{
  const ticket=ticketParts(caseId),runMutation=vi.fn(),ctx={runMutation} as unknown as ActionCtx,id='session-id' as Id<'sessions'>;
  const s={_id:id,caseId,factsheet:ticket.source,status:'customer',messages:[{role:'customer',text:CASE_OPENINGS[caseId],at:1},{role:'fresher',text:'What is the customer seeing?',at:2}]} as unknown as Doc<'sessions'>;
  const complete=vi.fn(async()=>JSON.stringify({proposesFix:false,needsGuidance:true,namesCause:false,ticketQuestion:'outcome'}));
  await advanceTicket(ctx,s,id,'lease',complete);
  const text=runMutation.mock.calls[0][1].text;const answer=plainTicketAnswer(caseId,'outcome',ticket.source,ticket.scenario)!;
  expect(answer).toBeTruthy();expect(text).toBe(answer+' What would you check next?');expect(text).not.toMatch(/Look at|Compare the.*(?:file|logs|query)/i);expect(complete).toHaveBeenCalledTimes(1);
  expect(guidingQuestion(caseId,s.messages)).toBe('Which part of the ticket would you like me to explain?');
 });
 it(`${caseId}: a correct cause on the last reply gets a fix question, then the fix ends the case`,async()=>{
  const ticket=publicTicket(caseId),source=ticketParts(caseId),t=convexTest(schema,modules);
  const messages:{role:'customer'|'fresher';text:string;at:number}[]=[];
  for(let i=0;i<ticket.maxReplies;i++)messages.push({role:'customer',text:CASE_OPENINGS[caseId],at:i*2},{role:'fresher',text:'The cause is the one supported by these records.',at:i*2+1});
  const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'cause',owner,caseId,factsheet:source.source,status:'customer',lease:'lease',deadlineAt:Date.now()+ticket.timeLimitMs,messages}));
  const s=(await t.run(ctx=>ctx.db.get(id)))!;
  const ctx={runMutation:async(ref:any,args:any)=>t.mutation(ref,args)} as unknown as ActionCtx;
  const complete=vi.fn(async(input:any[])=>{const payload=JSON.parse(input[1].content);expect(payload.latestReply).toBe(messages.at(-1)!.text);expect(payload.messages.every((m:any)=>['student','senior'].includes(m.speaker))).toBe(true);return JSON.stringify({proposesFix:false,needsGuidance:false,namesCause:true,ticketQuestion:'none'});});
  await advanceTicket(ctx,s,id,'lease',complete);
  const asking=(await t.run(ctx=>ctx.db.get(id)))!;expect(asking.status).toBe('reply');expect(asking.awaitingFix).toBe(true);expect(asking.messages.at(-1)!.text).toBe(CAUSE_CONFIRMATIONS[caseId]);
  await t.mutation(api.sessions.reply,{token:'cause',owner,text:'I will make the change described in my reply.',turn:asking.messages.length});
  await t.run(ctx=>ctx.db.patch(id,{lease:'finish'}));
  const answered=(await t.run(ctx=>ctx.db.get(id)))!;await advanceTicket(ctx,answered,id,'finish',complete);
  const final=(await t.run(ctx=>ctx.db.get(id)))!;expect(final.status).toBe('grading');expect(final.messages.at(-1)!.role).toBe('fresher');expect(final.messages.at(-1)!.text).not.toMatch(/\?$/);expect(complete).toHaveBeenCalledTimes(1);
 });
 it(`${caseId}: a final ordinary question is answered with no unanswerable senior question`,async()=>{
  const ticket=ticketParts(caseId),id='session-id' as Id<'sessions'>,runMutation=vi.fn(),ctx={runMutation} as unknown as ActionCtx;
  const messages=Array.from({length:ticket.publicTicket.maxReplies},()=>({role:'fresher',text:'What does the customer see?',at:1}));
  const s={_id:id,caseId,factsheet:ticket.source,status:'customer',messages} as unknown as Doc<'sessions'>;
  await advanceTicket(ctx,s,id,'lease',async()=>JSON.stringify({proposesFix:false,needsGuidance:false,namesCause:false,ticketQuestion:'outcome'}));
  expect(getFunctionName(runMutation.mock.calls[0][0])).toBe(getFunctionName(internal.sessions.closeWithAnswer));
  expect(runMutation.mock.calls[0][1].text).not.toMatch(/\?$/);
 });
}
it('gives the exact basket outcome in plain words and only uses shared evidence in nudges',()=>{
 const source=ticketParts('SWE-1');expect(plainTicketAnswer('SWE-1','outcome',source.source,source.scenario)).toBe('The customer sees \u20b9010050; it should be \u20b9150.');
 const shared=[{role:'customer' as const,text:'Original CSV\ncustomer_code,region\n0012,North\n0012,North'}];
 expect(guidingQuestion('DATA-3',shared)).toContain('region file I shared');expect(guidingQuestion('DATA-3',[])).not.toContain('region file');
});
it('shows the requested student skill words at exact boundaries while officer numbers stay unchanged',()=>{
 expect([null,1,3.99,4,5.99,6,7.99,8,10].map(skillWord)).toEqual(['Not assessed','Not yet','Not yet','Building','Building','Good','Good','Strong','Strong']);
 const report=officerSummary([{id:'original',name:'Student',caseId:'DATA-1',roleId:'data',started:1,messages:[{role:'fresher',text:'My saved answer',at:1}],caseGrade:[{label:'Technical understanding',score:7,quote:'My saved answer',reason:'Saved reason'}]}]);
 expect(report.students[0].scores['Technical understanding']).toBe(7);
});
it('quotes the highest-scoring verified student line for each skill without changing a saved result',()=>{
 const rows=ROLE_CASES.data.map((caseId,i)=>({caseId,status:'complete',factsheet:ticketParts(caseId).source,messages:[{role:'fresher' as const,text:i===2?'My best saved line.':'My other saved line.'}],caseGrade:publicTicket(caseId).skills.map(label=>({label,score:i===2?10:5,quote:i===2?'My best saved line.':'My other saved line.'}))}));
 const before=structuredClone(rows),card=buildRoleScorecard('data',rows);if(!card.complete)throw new Error('Missing card');expect(card.skills.find(s=>s.label==='Technical understanding')!.quote).toBe('My best saved line.');expect(rows).toEqual(before);
});
it('has the exact briefing and role-specific job lines for both roles',()=>{
 expect(BRIEFING_LINE).toBe("You don't need to write code. You need to ask, notice and explain.");
 expect(ROLE_JOB_LINES.software).toBe("This is most of a junior engineer's day: finding where something broke and explaining it simply.");
 expect(ROLE_JOB_LINES.data).toBe("This is most of a junior data engineer's day: finding where the numbers went wrong and explaining it simply.");
});
