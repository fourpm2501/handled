import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {internal} from '../convex/_generated/api';
import {officerSummary,officerDetail,officerStudents,OFFICER_SKILLS,readiness} from '../convex/officerRules';
import type {SavedOfficerResult} from '../convex/officerRules';
import {officerCookie,authorizedOfficer} from '../convex/officerAuth';
import {sortStudents} from '../src/officerView';
const modules=import.meta.glob('../convex/**/*.*s');
const code='126438',secret='unit-test-secret-not-a-production-value-12345';
beforeEach(()=>{vi.stubEnv('OFFICER_CODE',code);vi.stubEnv('OFFICER_SESSION_SECRET',secret);});
afterEach(()=>{vi.unstubAllEnvs();vi.useRealTimers();});
function row(id:string,name:string,roleId='data',caseId='DATA-1',score=8,started=1):SavedOfficerResult{return {id,name,roleId,caseId,started,messages:[{role:'customer',text:'Saved senior message',at:1},{role:'fresher',text:'Saved student answer',at:2}],caseGrade:OFFICER_SKILLS.map(label=>({label,score,quote:'Saved student answer',reason:'Saved grader reason'}))};}
async function login(t:ReturnType<typeof convexTest>){const response=await t.fetch('/officer/login',{method:'POST',headers:{Origin:'https://some.convex.site','Content-Type':'application/json'},body:JSON.stringify({code})});expect(response.status).toBe(200);return response.headers.get('Set-Cookie')!.split(';')[0];}
async function seed(t:ReturnType<typeof convexTest>,r:SavedOfficerResult){return t.run(ctx=>ctx.db.insert('sessions',{token:r.id,owner:'PRIVATE OWNER',name:r.name,roleId:r.roleId as 'data'|'software',caseId:r.caseId as 'DATA-1',factsheet:'PRIVATE SOURCE AND HIDDEN TICKET',graderRaw:'PRIVATE RAW GRADER',status:'complete',messages:r.messages,caseGrade:r.caseGrade,seniorNote:'Saved final note'}));}
it('uses the latest saved attempt per case, counts people once across roles, and excludes only the named test rows',()=>{
 const rows=[row('old','Asha','data','DATA-1',1,1),row('new','Asha','data','DATA-1',8,2),row('software',' asha ','software','SWE-1',6),row('ravi','Ravi','data','DATA-1',4),row('ignore','TEST Shaktimaan ignore'),row('ignore2',' test  shaktimaan IGNORE '),row('other-test','Other test name')];
 const before=structuredClone(rows),summary=officerSummary(rows);
 expect(summary.studentCount).toBe(3);expect(summary.students).toHaveLength(4);
 expect(summary.students.some(s=>/shaktimaan/i.test(s.name))).toBe(false);
 expect(summary.students.find(s=>s.name==='Asha')!.cases).toEqual(['DATA-1']);
 expect(summary.skills[0].average).toBeCloseTo((7+4+8)/3);
 expect(summary.skills[0]).toMatchObject({ready:2,nearly:0,notYet:1,notAssessed:0});
 expect(rows).toEqual(before);
});
it('never maps old checklist scores to the four skills and never assesses silence',()=>{
 const legacy={...row('legacy','Legacy'),caseGrade:undefined,bugGrade:{cause:{score:10}}};
 const partial=row('partial','Partial');partial.caseGrade=partial.caseGrade!.filter(g=>g.label==='Technical understanding');
 const silent=row('silent','Silent');silent.messages=[{role:'fresher',text:'[Case time limit reached]',at:1,timedOut:true}];
 const summary=officerSummary([legacy,partial,silent]);
 expect(summary.students.find(s=>s.name==='Legacy')!.scores).toEqual(Object.fromEntries(OFFICER_SKILLS.map(s=>[s,null])));
 expect(summary.students.find(s=>s.name==='Partial')!.readiness).toBe('Not assessed');
 expect(summary.skills.find(s=>s.skill==='Technical understanding')).toMatchObject({ready:1,notAssessed:2});
 expect(summary.skills.find(s=>s.skill==='Communication')).toMatchObject({average:null,notAssessed:3});
});
it('computes the true lowest class skill and readiness thresholds without rounding first',()=>{
 const a=row('a','Asha');a.caseGrade![2].score=4;
 const b=row('b','Ravi');b.caseGrade![2].score=6;
 const summary=officerSummary([a,b]);expect(summary.gap).toBe('Problem-solving method');
 expect(summary.students[0].readiness).toBe('Not yet');expect(summary.students[1].readiness).toBe('Nearly');
 expect([readiness(7),readiness(6.99),readiness(5),readiness(4.99),readiness(null)]).toEqual(['Ready','Nearly','Nearly','Not yet','Not assessed']);
});
it('preserves all chat messages in order and includes previous finished attempts in the read-only detail',()=>{
 const old=row('old','Asha','data','DATA-1',3,1),newer=row('new','Asha','data','DATA-1',8,2),other=row('other','Ravi');
 old.seniorNote='Original saved note';const rows=[newer,other,old],id=officerStudents(rows).find(s=>s.name==='Asha')!.id;
 const detail=officerDetail(rows,id)!;expect(detail.attempts.map(r=>r.id)).toEqual(['old','new']);expect(detail.attempts[0].messages).toEqual(old.messages);expect(detail.attempts[0].seniorNote).toBe('Original saved note');
 expect(detail.student.scores['Technical understanding']).toBe(8);expect(officerDetail(rows,'missing')).toBeNull();
});
it('does not invent a student identity for unnamed results and handles an empty class',()=>{
 const unnamed=row('unnamed','');expect(officerSummary([unnamed])).toMatchObject({studentCount:0,unnamedResults:1,gap:null});
 const empty=officerSummary([]);expect(empty.studentCount).toBe(0);expect(empty.students).toEqual([]);expect(empty.skills.every(s=>s.average===null)).toBe(true);
});
it('sorts every column, preserves the input order, and keeps missing scores last in either direction',()=>{
 const a=row('a','Zara','software','SWE-1',9),b=row('b','Asha','data','DATA-1',4),extra=row('extra','Zara','software','SWE-2',7),missing={...row('missing','Missing'),caseGrade:undefined};
 const rows=officerStudents([a,b,extra,missing]),before=structuredClone(rows);
 for(const column of ['name','role','cases',...OFFICER_SKILLS,'readiness','weakest'] as const){expect(sortStudents(rows,column,'asc')).toHaveLength(3);expect(sortStudents(rows,column,'desc')).toHaveLength(3);}
 expect(sortStudents(rows,'name','asc')[0].name).toBe('Asha');expect(sortStudents(rows,'cases','desc')[0].name).toBe('Zara');
 for(const direction of ['asc','desc'] as const)expect(sortStudents(rows,'Technical understanding',direction).at(-1)!.name).toBe('Missing');expect(rows).toEqual(before);
});
it('rejects unauthenticated summary and detail requests without disclosing saved results',async()=>{
 const t=convexTest(schema,modules);await seed(t,row('private','Private student'));
 for(const path of ['/officer/summary','/officer/student?id=anything']){const response=await t.fetch(path);expect(response.status).toBe(401);expect(await response.text()).not.toContain('Private student');}
});
it('checks the code only on the server, issues a secure cookie, and exposes only saved safe fields',async()=>{
 const t=convexTest(schema,modules);await seed(t,row('student','Asha'));await seed(t,row('test','TEST Shaktimaan ignore'));
 const before=await t.run(ctx=>ctx.db.query('sessions').collect());
 const failed=await t.fetch('/officer/login',{method:'POST',body:JSON.stringify({code:'000000'})});expect(failed.status).toBe(401);expect(await failed.text()).not.toContain(code);
 const cookie=await login(t);
 const response=await t.fetch('/officer/summary',{headers:{Cookie:cookie}});expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
 const summary=await response.json();expect(summary.studentCount).toBe(1);expect(summary.collegeAvailable).toBe(false);expect(JSON.stringify(summary)).not.toMatch(/PRIVATE OWNER|PRIVATE SOURCE|PRIVATE RAW|TEST Shaktimaan/);
 const detailResponse=await t.fetch('/officer/student?id='+encodeURIComponent(summary.students[0].id),{headers:{Cookie:cookie}});const detail=await detailResponse.json();expect(detail.attempts[0].messages[1].text).toBe('Saved student answer');expect(JSON.stringify(detail)).not.toMatch(/PRIVATE OWNER|PRIVATE SOURCE|PRIVATE RAW/);
 expect(await t.run(ctx=>ctx.db.query('sessions').collect())).toEqual(before);
 const logout=await t.fetch('/officer/logout',{method:'POST'});expect(logout.headers.get('Set-Cookie')).toContain('Max-Age=0');
});
it('rejects cross-origin access, forged and expired cookies, and cookies from before code rotation',async()=>{
 const cookie=await officerCookie(10000);expect(cookie).toMatch(/HttpOnly; Secure; SameSite=Strict/);expect(cookie).not.toContain(code);
 const req=(value:string)=>new Request('https://some.convex.site/api/officer/summary',{headers:{Cookie:value}});
 expect(await authorizedOfficer(req(cookie),10001)).toBe(true);
 expect(await authorizedOfficer(req(cookie),3610001)).toBe(false);
 expect(await authorizedOfficer(req(cookie.replace('handled_officer=','handled_officer=X')),10001)).toBe(false);
 vi.stubEnv('OFFICER_CODE','987654');expect(await authorizedOfficer(req(cookie),10001)).toBe(false);
 const t=convexTest(schema,modules);const denied=await t.fetch('/officer/login',{method:'POST',headers:{Origin:'https://other.example'},body:JSON.stringify({code})});expect(denied.status).toBe(403);
});
it('fails closed if the code or signing secret is missing',async()=>{
 const t=convexTest(schema,modules);vi.stubEnv('OFFICER_CODE','');expect((await t.fetch('/officer/login',{method:'POST',body:'{}'})).status).toBe(503);
 vi.stubEnv('OFFICER_CODE',code);vi.stubEnv('OFFICER_SESSION_SECRET','');expect((await t.fetch('/officer/login',{method:'POST',body:'{}'})).status).toBe(503);
});
it('limits code guesses without writing to any student result and reopens after the window',async()=>{
 const t=convexTest(schema,modules);
 for(let i=0;i<20;i++)expect(await t.mutation(internal.officerData.loginAttempt,{})).toBe(true);
 expect(await t.mutation(internal.officerData.loginAttempt,{})).toBe(false);
 expect((await t.fetch('/officer/login',{method:'POST',body:JSON.stringify({code})})).status).toBe(429);
 await t.run(async ctx=>{const r=(await ctx.db.query('officerAccessLimits').unique())!;await ctx.db.patch(r._id,{started:Date.now()-15*60*1000});});
 expect(await t.mutation(internal.officerData.loginAttempt,{})).toBe(true);expect(await t.run(ctx=>ctx.db.query('sessions').collect())).toEqual([]);
});
it('paginates all finished results and never includes unfinished sessions',async()=>{
 const t=convexTest(schema,modules);
 for(let i=0;i<51;i++)await seed(t,row(`student-${i}`,`Student ${i}`));
 await t.run(ctx=>ctx.db.insert('sessions',{token:'unfinished',owner:'owner',name:'Unfinished student',factsheet:'PRIVATE',status:'reply',messages:[]}));
 const cookie=await login(t),response=await t.fetch('/officer/summary',{headers:{Cookie:cookie}}),summary=await response.json();
 expect(summary.studentCount).toBe(51);expect(summary.students.some((s:{name:string})=>s.name==='Unfinished student')).toBe(false);
});
