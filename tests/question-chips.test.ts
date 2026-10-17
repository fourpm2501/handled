import {convexTest} from 'convex-test';
import {it,expect} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {getQuestionChips} from '../src/questionChips';
import {publicTicket,ticketParts,ROLE_CASES} from '../convex/ticketRules';
const modules=import.meta.glob('../convex/**/*.*s');

it('offers exactly three answer-free requests for every case and the original support case',()=>{
 for(const id of [...ROLE_CASES.software,...ROLE_CASES.data,'quickbite']){
  const chips=getQuestionChips(id);expect(chips).toHaveLength(3);
  expect(new Set(chips.map(c=>c.label)).size).toBe(3);
  for(const chip of chips){expect(chip.question).toMatch(/\?$/);expect(chip.question.length).toBeLessThan(1600);expect(chip.label).not.toMatch(/0012|010050|lowercase|concatenation|status\s*=|toLowerCase|GRADER CHECKS/i);}
 }
 expect(getQuestionChips('SWE-1').map(c=>c.label)).toEqual(['The prices of the two items',"The app's diary (logs) for this basket",'The code that adds the total']);
});

it('saves a chip question as exactly one normal reply without changing the case deadline',async()=>{
 const t=convexTest(schema,modules);const owner='chip-test-owner-123456789012345';
 for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
  const ticket=publicTicket(caseId);const deadlineAt=Date.now()+ticket.timeLimitMs;const token='chip-'+caseId;
  const id=await t.run(ctx=>ctx.db.insert('sessions',{token,owner,caseId,roleId:ticket.roleId,factsheet:ticketParts(caseId).source,scenario:'bugticket',status:'reply',deadlineAt,replyStartedAt:Date.now(),messages:[{role:'customer',text:'Where will you start?',at:Date.now()}]}));
  const question=getQuestionChips(caseId)[0].question;
  await t.mutation(api.sessions.reply,{token,owner,text:question,turn:1});
  await t.mutation(api.sessions.reply,{token,owner,text:question,turn:1});
  const saved=(await t.run(ctx=>ctx.db.get(id)))!;
  expect(saved.messages.filter(m=>m.role==='fresher')).toHaveLength(1);expect(saved.messages[1].text).toBe(question);
  expect(saved.deadlineAt).toBe(deadlineAt);expect(saved.status).toBe('reply');expect(saved.caseGrade).toBeUndefined();
  expect(saved.messages[2].role).toBe('customer');expect(saved.messages[2].text).toContain('```');
 }
});
