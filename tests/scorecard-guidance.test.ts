import {it,expect,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {getFunctionName} from 'convex/server';
import {buildRoleScorecard} from '../convex/roleScorecard';
import {ROLE_CASES,ticketParts,publicTicket} from '../convex/ticketRules';
import {advanceTicket} from '../convex/ticketAi';
import {guidingQuestion,CASE_OPENINGS} from '../convex/caseConversation';
import {getQuestionChips} from '../src/questionChips';
import {chipReply} from '../convex/chipEvidence';
import type {ActionCtx} from '../convex/_generated/server';
import type {Doc,Id} from '../convex/_generated/dataModel';
const modules=import.meta.glob('../convex/**/*.*s');
function results(){return ROLE_CASES.data.map((caseId,i)=>({caseId,status:'complete',factsheet:ticketParts(caseId).source,messages:[{role:'customer' as const,text:'SENIOR WORDS ARE NOT STUDENT QUOTES'},{role:'fresher' as const,text:`I checked the original records in ${caseId}.`}],caseGrade:publicTicket(caseId).skills.map(label=>({label,score:label==='Communication'?2:7+i,quote:`I checked the original records in ${caseId}.`,reason:'PRIVATE GRADER DETAILS'}))}));}
it('explains each skill using a verified exact student quote and chooses the lowest average',()=>{
 const cases=results(),before=structuredClone(cases),card=buildRoleScorecard('data',cases);
 expect(card.complete).toBe(true);if(!card.complete)return;
 for(const skill of card.skills){
  expect(cases.some(c=>c.messages.some(m=>m.role==='fresher'&&m.text===skill.quote))).toBe(true);
  expect(skill.explanation).toContain(`"${skill.quote}"`);
  expect(skill.explanation).not.toMatch(/PRIVATE GRADER|SENIOR WORDS/);
 }
 expect(card.skills.find(s=>s.label==='Technical understanding')!.score).toBe(8);
 expect(card.next).toEqual({label:'Communication',advice:'Tell your senior what you saw, what it means and what you would check next.'});
 expect(cases).toEqual(before);
});
it('never quotes a forged grader quote, another role or a timeout',()=>{
 const cases=results();for(const c of cases)for(const g of c.caseGrade)g.quote='FORGED QUOTE';
 const card=buildRoleScorecard('data',cases);if(!card.complete)throw new Error('Expected complete');
 for(const skill of card.skills){expect(skill.quote).not.toBe('FORGED QUOTE');expect(skill.quote).toContain('I checked the original records');}
 const silent=cases.map(c=>({...c,messages:[{role:'fresher' as const,text:'[Case time limit reached]'}]}));
 const noAnswers=buildRoleScorecard('data',silent);if(!noAnswers.complete)throw new Error('Expected complete');
 expect(noAnswers.next).toBeNull();for(const skill of noAnswers.skills){expect(skill.score).toBeNull();expect(skill.quote).toBe('');expect(skill.explanation).toContain('No answer was submitted');}
});
it('the live scorecard query does not alter any saved record when adding quotes and advice',async()=>{
 const t=convexTest(schema,modules);
 for(const [i,c] of results().entries())await t.run(ctx=>ctx.db.insert('sessions',{...c,messages:c.messages.map(m=>({...m,at:1})),status:'complete',token:`quote-${i}`,runToken:'quotes',roleId:'data',owner:'owner'}));
 const before=await t.run(ctx=>ctx.db.query('sessions').collect());const card=await t.query(api.sessions.roleScorecard,{token:'quote-2'});
 expect(card?.complete&&card.next?.label).toBe('Communication');
 expect(await t.run(ctx=>ctx.db.query('sessions').collect())).toEqual(before);
});
for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
 for(const [text,proposesFix] of [['I am stuck and do not know what to do.',false],['Restart everything; that will fix it.',true]] as const){
  it(`${caseId}: ${proposesFix?'an unsupported fix':'being stuck'} gets one evidence question without an answer reveal`,async()=>{
   const source=ticketParts(caseId),id='session-id' as Id<'sessions'>,runMutation=vi.fn();
   const ctx={runMutation} as unknown as ActionCtx;
   const s={_id:id,caseId,factsheet:source.source,status:'customer',messages:[{role:'customer',text:CASE_OPENINGS[caseId],at:1},{role:'fresher',text,at:2}]} as unknown as Doc<'sessions'>;
   const complete=vi.fn(async()=>JSON.stringify({proposesFix,needsGuidance:true}));
   await advanceTicket(ctx,s,id,'lease',complete);
   expect(complete).toHaveBeenCalledTimes(1);expect(runMutation).toHaveBeenCalledTimes(1);
   expect(getFunctionName(runMutation.mock.calls[0][0])).toBe(getFunctionName(internal.sessions.customer));
   const reply=runMutation.mock.calls[0][1].text;
   expect(reply).toBe(guidingQuestion(caseId));expect(reply.match(/\?/g)).toHaveLength(1);
   expect(reply).not.toMatch(/cause was|you found|the fix|you should|ROOT CAUSE|RIGHT FIX|GRADER CHECKS/);
   expect(reply).not.toContain(source.trap);
   // A guidance turn must not prevent the existing trap from arriving with later evidence.
   const chip=getQuestionChips(caseId)[0];
   const evidence=chipReply(caseId,source.source,chip.question,[{role:'customer',text:CASE_OPENINGS[caseId]},{role:'customer',text:reply}])!;
   expect(evidence).toContain(source.trap);
  });
 }
 it(`${caseId}: a normal evidence request still gets the requested evidence`,async()=>{
  const source=ticketParts(caseId),id='session-id' as Id<'sessions'>,runMutation=vi.fn();
  const ctx={runMutation} as unknown as ActionCtx;
  const s={_id:id,caseId,factsheet:source.source,status:'customer',messages:[{role:'customer',text:CASE_OPENINGS[caseId],at:1},{role:'fresher',text:'Can you show me the current source code?',at:2}]} as unknown as Doc<'sessions'>;
  const complete=vi.fn(async()=>JSON.stringify({proposesFix:false,needsGuidance:false,requested:[],unavailable:false}));
  await advanceTicket(ctx,s,id,'lease',complete);
  expect(runMutation.mock.calls[0][1].text).toContain(source.publicTicket.code);
  expect(runMutation.mock.calls[0][1].text).not.toContain(guidingQuestion(caseId));
 });
}
