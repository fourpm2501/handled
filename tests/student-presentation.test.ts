import {convexTest} from 'convex-test';
import {it,expect} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {studentFeedback,roleSummary} from '../convex/studentPresentationRules';
import {ticketParts,ROLE_CASES} from '../convex/ticketRules';
const modules=import.meta.glob('../convex/**/*.*s');

it('formats case feedback as three short sentences ending with Next time without scores',()=>{
 const messages=[{role:'fresher' as const,text:'Can you share the original rows so I can compare the values?',at:1}];
 for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
  const feedback=studentFeedback(caseId,messages);expect(feedback).toHaveLength(3);
  expect(feedback[0]).toMatch(/^Not yet: the cause was /);expect(feedback[2]).toMatch(/^Next time: /);
  expect(feedback.join(' ').split(/\s+/).length).toBeLessThan(50);
  expect(feedback.join(' ')).not.toMatch(/\bscore\b|\/10|GRADER CHECKS/);
 }
 expect(studentFeedback('DATA-2',messages).join(' ').toLowerCase()).toContain('keeping codes as text');
 expect(studentFeedback('DATA-2',messages).join(' ')).not.toMatch(/add zeros|padding|zfill/i);
});

it('does not invent praise for unanswered cases and keeps the role summary under 50 words',()=>{
 const silent=[{role:'fresher' as const,text:'[No reply within 3 minutes]',timedOut:true}];
 expect(studentFeedback('DATA-1',silent)[0]).toMatch(/^Not yet: the cause was /);
 const summary=roleSummary([{messages:silent},{messages:[{role:'fresher',text:'Can you share the logs?'}]}]);
 expect(summary).toHaveLength(3);expect(summary[0]).toBe('You found the cause in 0 of 2 cases.');
 expect(summary.join(' ').split(/\s+/).length).toBeLessThan(50);
});

it('only supplies presentation after completion and never changes any saved result field',async()=>{
 const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'presentation',owner:'owner',name:'Student',caseId:'DATA-2',roleId:'data',runToken:'presentation',factsheet:ticketParts('DATA-2').source,status:'reply',messages:[{role:'fresher',text:'Codes read as numbers lose leading zeros; they should be strings.',at:1}],seniorNote:'Original saved feedback'}));
 expect(await t.query(api.sessions.studentPresentation,{token:'presentation'})).toBeNull();
 await t.run(ctx=>ctx.db.patch(id,{status:'complete'}));
 const before=await t.run(ctx=>ctx.db.get(id));
 const presentation=await t.query(api.sessions.studentPresentation,{token:'presentation'});
 expect(presentation!.feedback[2]).toMatch(/^Next time:/);expect(presentation!.summary).toHaveLength(3);
 expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
 expect(JSON.stringify(presentation)).not.toMatch(/GRADER CHECKS|CLUES \(|ROOT CAUSE|STRONG ANSWER|owner|factsheet/);
});

it('counts causes rather than questions and does not praise silence',()=>{
 const messages=[{role:'fresher' as const,text:'Can you share the logs?'}];
 expect(roleSummary([{messages,foundCause:true},{messages,foundCause:false}])[0]).toBe('You found the cause in 1 of 2 cases.');
 expect(roleSummary([{messages:[],foundCause:true}])[0]).toBe('You found the cause in 0 of 1 cases.');
});
