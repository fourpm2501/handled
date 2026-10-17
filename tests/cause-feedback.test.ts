import {convexTest} from 'convex-test';
import {it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {ticketParts,ROLE_CASES} from '../convex/ticketRules';
import {getQuestionChips} from '../src/questionChips';
const modules=import.meta.glob('../convex/**/*.*s');
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
const explanations={
 'SWE-1':'The prices are text, so adding them joins their characters instead of adding the amounts.',
 'SWE-2':'assigned=true keeps only tickets with owners, so open tickets with no owner are missing.',
 BUGTICKET:'The typed email becomes lowercase, but saved mixed-case emails no longer match exactly. The account is not found before the password is checked.',
 'DATA-1':'The query only filters the day. It counts pending and cancelled orders too because it does not filter for delivered status.',
 'DATA-3':'The region CSV has the same customer twice, so the join counts that order twice.',
 'DATA-2':'The reader treats the codes as numbers and drops leading zeros before the later text conversion.',
};
for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
 for(const found of [true,false]){
  it(`${caseId}: plainly says ${found?'You found it':'Not yet'} without changing a saved score or result`,async()=>{
   const t=convexTest(schema,modules);const text=found?explanations[caseId]:getQuestionChips(caseId)[0].question;
   const grade={label:'Technical understanding',score:5,quote:text,reason:'Original saved assessment'};
   const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'diagnosis',owner:'owner',caseId,factsheet:ticketParts(caseId).source,status:'complete',messages:[{role:'fresher',text,at:1}],caseGrade:[grade],graderRaw:'ORIGINAL RAW GRADER',seniorNote:'Original saved senior note'}));
   const before=await t.run(ctx=>ctx.db.get(id));const fetchMock=vi.fn(async(_url,options)=>{
    const body=JSON.parse(options.body);expect(body.messages[0].content).toContain('Questions, chip requests');
    expect(body.messages[1].content).toContain(text);expect(options.body).not.toContain('Original saved assessment');expect(options.body).not.toContain('ORIGINAL RAW GRADER');
    return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({found})}}]})};
   });vi.stubGlobal('fetch',fetchMock);vi.stubEnv('OPENAI_API_KEY','test-key');
   const note=await t.action(api.seniorFeedback.diagnosis,{token:'diagnosis'});
   expect(note).toHaveLength(3);expect(note[0]).toMatch(found?/^You found it: .+\.$/:/^Not yet: the cause was .+\.$/);
   expect(note[2]).toMatch(/^Next time:/);expect(note.join(' ').split(/\s+/).length).toBeLessThan(50);
   expect(note.join(' ').split(/[.!?]+(?:\s|$)/).filter(s=>s.trim())).toHaveLength(3);
   expect(note.join(' ')).not.toMatch(/dtype|concatenation|case.insensitive|\brubric\b|\/10|GRADER CHECKS/);
   expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
  });
 }
}
