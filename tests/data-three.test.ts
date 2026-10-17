import {it,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {publicTicket,ticketParts,ROLE_CASES} from '../convex/ticketRules';
import {chipEvidence,chipReply} from '../convex/chipEvidence';
import {safeEvidence,seniorReply} from '../convex/seniorEvidence';
import {getQuestionChips} from '../src/questionChips';
import {evidenceReadingHint} from '../src/evidenceView';
const modules=import.meta.glob('../convex/**/*.*s');
it('DATA-3 has the intermediate limits, Meera, a symptom-only ticket and three evidence chips',()=>{
 const ticket=publicTicket('DATA-3');
 expect(ticket).toMatchObject({level:'Intermediate',seniorName:'Meera',timeLimitMs:480000,maxReplies:4,caseIndex:2,caseCount:3,nextCaseId:null});
 expect(ticket.brief).toContain('Flipkart-style');
 expect(ticket.brief).not.toMatch(/0012|North|SQL|repeats|twice|SUM|CLUES|ROOT CAUSE|GRADER CHECKS/);
 expect(publicTicket('DATA-2').nextCaseId).toBe('DATA-3');
 const source=ticketParts('DATA-3'),chips=getQuestionChips('DATA-3');expect(chips).toHaveLength(3);
 expect(chipEvidence('DATA-3',source.source,chips[0].question)!.block).toContain('After join: North 200; South 50');
 expect(chipEvidence('DATA-3',source.source,chips[1].question)!.block.match(/0012,North/g)).toHaveLength(4);
 expect(chipEvidence('DATA-3',source.source,chips[2].question)!.block).toContain('LEFT JOIN region_upload');
 for(const chip of chips){
  const evidence=chipEvidence('DATA-3',source.source,chip.question)!;
  expect(evidenceReadingHint(evidence.block)).not.toContain('type of each value');
  const reply=chipReply('DATA-3',source.source,chip.question,[{role:'customer',text:'Can you check?'}])!;
  expect(reply).toContain(source.trap);expect(reply).not.toMatch(/ROOT CAUSE|GRADER CHECKS|RIGHT FIX/);
  expect(chipReply('DATA-3',source.source,chip.question,[{role:'customer',text:'Can you check?'},{role:'customer',text:reply}])).not.toContain(source.trap);
 }
 const facts=safeEvidence('DATA-3',source.source);expect(facts).toHaveLength(5);
 for(const fact of facts)expect(seniorReply('DATA-3',2,[],facts,[fact.id],source.trap).toLowerCase()).toContain(fact.text.toLowerCase());
});
it('DATA-3 evidence reproduces the inflated join and preserves equal-valued orders in the fix',()=>{
 const orders=[{id:'O1',code:'0012',amount:100},{id:'O2',code:'0013',amount:50}];
 const mappings=[{code:'0012',region:'North'},{code:'0012',region:'North'},{code:'0013',region:'South'}];
 const total=(rows:typeof orders,regions:typeof mappings)=>rows.reduce((sum,o)=>sum+o.amount*Math.max(1,regions.filter(r=>r.code===o.code).length),0);
 expect(total(orders,mappings)).toBe(250);
 const checked=mappings.filter((r,i)=>mappings.findIndex(other=>other.code===r.code&&other.region===r.region)===i);
 expect(total(orders,checked)).toBe(150);
 expect(total([...orders,{id:'O3',code:'0013',amount:100},{id:'O4',code:'0099',amount:50}],checked)).toBe(300);
});
for(const role of ['software','data'] as const){
 it(`${role}: hides the scorecard until every required case is complete, with no saved-result writes`,async()=>{
  const t=convexTest(schema,modules),ids=[];
  for(const [i,caseId] of ROLE_CASES[role].entries()){
   const ticket=publicTicket(caseId);ids.push(await t.run(ctx=>ctx.db.insert('sessions',{token:`${role}-${i}`,runToken:role,roleId:role,caseId,owner:'owner',factsheet:ticketParts(caseId).source,status:i<2?'complete':'reply',messages:[{role:'fresher',text:'My answer',at:1}],caseGrade:ticket.skills.map(label=>({label,score:2+i*2,quote:'My answer',reason:'Saved assessment'}))})));
  }
  const token=`${role}-0`;
  expect(await t.query(api.sessions.roleScorecard,{token})).toEqual({complete:false,skills:[]});
  // A finished case in someone else's run cannot unlock this student's card.
  const last=ROLE_CASES[role][2];await t.run(ctx=>ctx.db.insert('sessions',{token:'other',runToken:'other',roleId:role,caseId:last,owner:'other',factsheet:ticketParts(last).source,status:'complete',messages:[]}));
  expect((await t.query(api.sessions.roleScorecard,{token}))!.complete).toBe(false);
  await t.run(ctx=>ctx.db.patch(ids[2],{status:'complete'}));
  const before=await t.run(ctx=>ctx.db.query('sessions').collect());
  const card=await t.query(api.sessions.roleScorecard,{token});
  expect(card!.complete).toBe(true);expect(card!.skills.find(s=>s.label==='Technical understanding')!.score).toBe(4);
  expect(await t.run(ctx=>ctx.db.query('sessions').collect())).toEqual(before);
  await t.run(ctx=>ctx.db.patch(ids[2],{messages:[{role:'fresher',text:'[Case time limit reached]',at:1,timedOut:true}]}));
  expect((await t.query(api.sessions.roleScorecard,{token}))!.skills.find(s=>s.label==='Technical understanding')!.score).toBeNull();
 });
}
it('continues an old two-case data result into DATA-3 without rewriting its saved assessment',async()=>{
 const t=convexTest(schema,modules),owner='old-data-owner-123456789012345';
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'old-data-2',runToken:'old-data',roleId:'data',caseId:'DATA-2',owner,factsheet:ticketParts('DATA-2').source,status:'complete',seniorNote:'Original note',messages:[{role:'fresher',text:'Original reply',at:1}]}));
 const token=await t.mutation(api.sessions.next,{token:'old-data-2',owner});
 const next=(await t.query(api.sessions.get,{token}))!;
 expect(next).toMatchObject({caseId:'DATA-3',roleId:'data',runToken:'old-data'});
 expect(next.deadlineAt).toBeUndefined();
 const deadline=(await t.mutation(api.sessions.beginInteraction,{token,owner}))!;expect(deadline-Date.now()).toBeCloseTo(480000,-2);
 const old=(await t.run(ctx=>ctx.db.get(id)))!;expect(old.seniorNote).toBe('Original note');expect(old.messages[0].text).toBe('Original reply');
 expect(await t.mutation(api.sessions.next,{token:'old-data-2',owner})).toBe(token);
});
