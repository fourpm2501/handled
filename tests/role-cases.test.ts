import { convexTest } from 'convex-test';
import { it, expect, vi, afterEach } from 'vitest';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';
import { publicTicket, ticketParts, ROLE_CASES } from '../convex/ticketRules';
const modules=import.meta.glob('../convex/**/*.*s');
const owner='role-test-owner-123456789012345';
afterEach(()=>vi.useRealTimers());

it('hands off within the same role and closes the last case without a next case',()=>{
 for(const role of ['software','data'] as const){
  for(const [index,caseId] of ROLE_CASES[role].entries()){
   const ticket=publicTicket(caseId);
   expect(ticket.nextCaseId).toBe(ROLE_CASES[role][index+1]??null);
   if(ticket.nextCaseId)expect(ticket.handoff).toBe(`Let's move on to ${ticket.nextCaseId}.`);
   else expect(ticket.handoff).toContain("That's our last case;");
  }
 }
});

it('uses ticket metadata and keeps every hidden section out of public briefing and shared results',async()=>{
 const t=convexTest(schema,modules);
 for(const role of ['software','data'] as const){
  const brief=await t.query(api.sessions.briefing,{role});
  expect(brief!.caseId).toBe(ROLE_CASES[role][0]);
  expect(brief!.roleContext).toContain(role==='software'?'junior software engineer':'junior data engineer');
  expect(brief!.timeLimitMs).toBe(300000);expect(brief!.maxReplies).toBe(3);expect(brief!.skills).toHaveLength(2);
  const token=await t.mutation(api.sessions.start,{role,owner,name:'Test Student'});
  const s=await t.query(api.sessions.get,{token});
  for(const hidden of ['AI-only behaviour','CLUES (','ROOT CAUSE','RIGHT FIX','GRADER CHECKS','STRONG ANSWER','WEAK ANSWERS','NON-CODER EXPLANATION'])expect(JSON.stringify(s)).not.toContain(hidden);
  expect(s).not.toHaveProperty('graderRaw');expect(s).not.toHaveProperty('owner');
  const saved=await t.query(internal.sessions.read,{id:s!._id});expect(saved!.factsheet).toContain('GRADER CHECKS');
 }
 const bug=publicTicket('BUGTICKET');expect(bug.timeLimitMs).toBe(480000);expect(bug.maxReplies).toBe(4);expect(bug.skills).toHaveLength(3);
 expect(ticketParts('SWE-1').clues[0].evidence).toContain('10:01');
});

it('classifies the final reply before closing and keeps one interaction-started deadline',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);
 const token=await t.mutation(api.sessions.start,{role:'software',owner,name:'Test Student'});
 const s=(await t.query(api.sessions.get,{token}))!;expect(s.deadlineAt).toBeUndefined();
 await t.run(ctx=>ctx.db.patch(s._id,{status:'reply',replyStartedAt:Date.now(),messages:[{role:'customer',text:'Opening',at:Date.now()}]}));
 const deadline=await t.mutation(api.sessions.beginInteraction,{token,owner});
 vi.advanceTimersByTime(90000);
 await t.mutation(api.sessions.reply,{token,owner,text:'First',turn:1});
 expect((await t.query(api.sessions.get,{token}))!.deadlineAt).toBe(deadline);
 await t.run(ctx=>ctx.db.patch(s._id,{status:'reply',replyStartedAt:Date.now(),messages:[{role:'customer',text:'Opening',at:Date.now()},{role:'fresher',text:'First',at:Date.now()},{role:'customer',text:'Pressure',at:Date.now()},{role:'fresher',text:'Second',at:Date.now()},{role:'customer',text:'Next step',at:Date.now()}]}));
 await t.mutation(api.sessions.reply,{token,owner,text:'Third',turn:5});
 expect((await t.query(api.sessions.get,{token}))!.status).toBe('customer');
 await t.run(ctx=>ctx.db.patch(s._id,{status:'complete'}));
 const expired=await t.mutation(api.sessions.start,{role:'data',owner,name:'Test Student'});const e=(await t.query(api.sessions.get,{token:expired}))!;
 await t.run(ctx=>ctx.db.patch(e._id,{status:'reply',replyStartedAt:Date.now(),messages:[{role:'customer',text:'Opening',at:Date.now()}]}));
 const expiredDeadline=(await t.mutation(api.sessions.beginInteraction,{token:expired,owner}))!;
 vi.advanceTimersByTime(300000);await t.mutation(internal.sessions.expireCase,{id:e._id,deadlineAt:expiredDeadline});
 await t.mutation(internal.sessions.claim,{id:e._id,lease:'silent-finish'});
 const ended=(await t.query(api.sessions.get,{token:expired}))!;expect(ended.status).toBe('complete');expect(ended.assessmentStatus).toBe('not_assessed');expect(ended.messages.find(m=>m.timedOut)).toMatchObject({timedOut:true,responseMs:300000});
});

it('enforces role order, exact skill grades, private writes and repeat-safe next-case starts',async()=>{
 const t=convexTest(schema,modules);
 for(const role of ['software','data'] as const){
  let token=await t.mutation(api.sessions.start,{role,owner,name:'Test Student'});
  for(const [index,caseId] of ROLE_CASES[role].entries()){
   const s=(await t.query(api.sessions.get,{token}))!;expect(s.caseId).toBe(caseId);
   await expect(t.mutation(api.sessions.next,{token,owner})).rejects.toThrow('Finish');
   await t.run(ctx=>ctx.db.patch(s._id,{status:'grading',lease:'grade',messages:[{role:'fresher',text:'My evidence',at:Date.now()}]}));
   const grades=publicTicket(caseId).skills.map(label=>({label,score:2,quote:'My evidence',reason:'PRIVATE DIAGNOSIS FROM THE HIDDEN RUBRIC'}));
   await expect(t.mutation(internal.sessions.ticketGraded,{id:s._id,lease:'grade',grade:grades.map(g=>({...g,quote:'Invented'})),raw:'private'})).rejects.toThrow('Invalid grade');
   await t.mutation(internal.sessions.ticketGraded,{id:s._id,lease:'grade',grade:grades,raw:'private'});
   await expect(t.mutation(api.sessions.next,{token,owner:'another-browser'})).rejects.toThrow();
   const complete=(await t.query(api.sessions.get,{token}))!;
   expect(JSON.stringify(complete)).not.toContain('PRIVATE DIAGNOSIS');
   expect((await t.query(internal.sessions.read,{id:s._id}))!.caseGrade![0].reason).toContain('PRIVATE DIAGNOSIS');
   if(index===ROLE_CASES[role].length-1){expect('roleScore' in complete&&complete.roleScore).toBe(2);await expect(t.mutation(api.sessions.next,{token,owner})).rejects.toThrow('complete');}
   else{const next=await t.mutation(api.sessions.next,{token,owner});expect(await t.mutation(api.sessions.next,{token,owner})).toBe(next);token=next;}
  }
 }
});
