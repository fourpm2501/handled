export const OFFICER_SKILLS=['Analytical thinking','Technical understanding','Problem-solving method','Communication'] as const;
export type OfficerSkill=typeof OFFICER_SKILLS[number];
export type SavedOfficerResult={id:string;name?:string;caseId?:string;roleId?:string;scenario?:string;started:number;messages:{role:'customer'|'fresher';text:string;at:number;timedOut?:boolean}[];caseGrade?:{label:string;score:number;quote:string;reason:string}[];seniorNote?:string};
export type SkillScores=Record<OfficerSkill,number|null>;
export function officerName(name:string){return name.trim().replace(/\s+/g,' ').toLocaleLowerCase('en');}
export function includedResult(r:SavedOfficerResult){return officerName(r.name??'')!=='test shaktimaan ignore';}
function role(r:SavedOfficerResult){return r.roleId==='data'?'Junior Data Engineer':r.roleId==='software'||r.scenario==='bugticket'?'Junior Software Engineer':'Customer Support';}
function key(r:SavedOfficerResult){return JSON.stringify([officerName(r.name??'')||`unnamed:${r.id}`,role(r)]);}
function mean(values:number[]){return values.length?values.reduce((s,n)=>s+n,0)/values.length:null;}
function answered(r:SavedOfficerResult){return r.messages.some(m=>m.role==='fresher'&&!m.timedOut&&!/^\[(?:No reply within|Case time limit reached)/.test(m.text)&&!!m.text.trim());}
function savedScore(r:SavedOfficerResult,skill:OfficerSkill){const n=answered(r)?r.caseGrade?.find(g=>g.label===skill)?.score:undefined;return typeof n==='number'&&Number.isFinite(n)&&n>=1&&n<=10?n:null;}
function scores(results:SavedOfficerResult[]):SkillScores{return Object.fromEntries(OFFICER_SKILLS.map(skill=>[skill,mean(results.flatMap(r=>{const n=savedScore(r,skill);return n===null?[]:[n];}))])) as SkillScores;}
export type Readiness='Ready'|'Nearly'|'Not yet'|'Not assessed';
export function readiness(score:number|null):Readiness{return score===null?'Not assessed':score>=7?'Ready':score>=5?'Nearly':'Not yet';}
export function weakest(values:SkillScores){return OFFICER_SKILLS.filter(s=>values[s]!==null).sort((a,b)=>values[a]!-values[b]!)[0]??null;}
function latest(results:SavedOfficerResult[]){const byCase=new Map<string,SavedOfficerResult>();for(const r of results){const id=r.caseId??(r.scenario==='bugticket'?'BUGTICKET':'QuickBite');if(!byCase.has(id)||byCase.get(id)!.started<r.started)byCase.set(id,r);}return [...byCase.values()];}
export function officerStudents(results:SavedOfficerResult[]){
 const grouped=new Map<string,SavedOfficerResult[]>();for(const r of results.filter(includedResult)){const k=key(r);grouped.set(k,[...(grouped.get(k)??[]),r]);}
 return [...grouped].map(([id,attempts])=>{const chosen=latest(attempts),values=scores(chosen),gap=weakest(values);return {id,name:attempts[0].name?.trim()||'Name not recorded',nameKey:officerName(attempts[0].name??''),role:role(attempts[0]),cases:chosen.map(r=>r.caseId??(r.scenario==='bugticket'?'BUGTICKET':'QuickBite')).sort(),scores:values,readiness:OFFICER_SKILLS.some(s=>values[s]===null)?'Not assessed' as const:readiness(Math.min(...OFFICER_SKILLS.map(s=>values[s]!))),weakest:gap};});
}
export function officerSummary(results:SavedOfficerResult[]){
 const students=officerStudents(results),people=new Map<string,SavedOfficerResult[]>();
 for(const r of results.filter(includedResult)){const name=officerName(r.name??'');if(name)people.set(name,[...(people.get(name)??[]),r]);}
 // Average each person's latest saved case scores first, then weight each person equally.
 const perPerson=[...people.values()].map(rows=>scores(latest(rows)));
 const skills=OFFICER_SKILLS.map(skill=>{const values=perPerson.map(p=>p[skill]);return {skill,average:mean(values.filter((n):n is number=>n!==null)),assessed:values.filter(n=>n!==null).length,ready:values.filter(n=>n!==null&&n>=7).length,nearly:values.filter(n=>n!==null&&n>=5&&n<7).length,notYet:values.filter(n=>n!==null&&n<5).length,notAssessed:values.filter(n=>n===null).length};});
 const gap=[...skills].filter(s=>s.average!==null).sort((a,b)=>a.average!-b.average!)[0]?.skill??null;
 return {students,studentCount:people.size,unnamedResults:results.filter(r=>includedResult(r)&&!r.name?.trim()).length,skills,gap,collegeAvailable:false};
}
export function officerDetail(results:SavedOfficerResult[],id:string){
 const selected=results.filter(r=>includedResult(r)&&key(r)===id),student=officerStudents(selected)[0];if(!student)return null;
 return {student,attempts:selected.sort((a,b)=>a.started-b.started).map(r=>({id:r.id,caseId:r.caseId??(r.scenario==='bugticket'?'BUGTICKET':'QuickBite'),started:r.started,senior:r.roleId==='data'?'Meera':r.scenario==='bugticket'?'Kavya':'Customer',messages:r.messages,skills:OFFICER_SKILLS.map(label=>({label,score:savedScore(r,label),quote:answered(r)?r.caseGrade?.find(g=>g.label===label)?.quote??'':'',reason:answered(r)?r.caseGrade?.find(g=>g.label===label)?.reason??'':''})),seniorNote:r.seniorNote??null}))};
}
export type OfficerSummary=ReturnType<typeof officerSummary>;
export type OfficerStudent=OfficerSummary['students'][number];
export type OfficerDetail=NonNullable<ReturnType<typeof officerDetail>>;
