import {ROLE_CASES,publicTicket} from './ticketRules';
import type {RoleId,CaseId} from './ticketRules';
import {hasAnswers,isTimeout} from './resultRules';
import type {StudentMessage} from './studentPresentationRules';
type Result={caseId?:CaseId;status:string;factsheet:string;messages:StudentMessage[];caseGrade?:{label:string;score:number;quote?:string}[]};
const NEXT:Record<string,string>={
 'Analytical thinking':'Compare two records and say which detail supports your idea.',
 'Technical understanding':'Follow one value through the code or query and explain each step.',
 'Problem-solving method':'Ask for evidence, check one idea, then compare the result with the original records.',
 Communication:'Tell your senior what you saw, what it means and what you would check next.',
};
function explanation(label:string,score:number|null,quote:string){
 if(!quote)return 'No answer was submitted for this skill, so there is no student reply to quote.';
 const excerpt=quote;
 if(score===null)return `You wrote "${excerpt}", but not every case has an assessed score for this skill.`;
 const bands:Record<string,string[]>={
  'Analytical thinking':['did not yet connect the records to a cause','made some links between the records and a possible cause','clearly linked the records to a cause'],
  'Technical understanding':['did not yet explain how the code or data behaves','showed some understanding of how the code or data behaves','clearly explained how the code or data behaves'],
  'Problem-solving method':['did not yet show a clear way to test an idea','showed some steps for checking an idea','showed a clear way to check an idea against the records'],
  Communication:['did not yet give a clear update about the problem','gave part of a clear update about the problem','gave a clear update about the problem and next steps'],
 };
 return `In "${excerpt}", your answer ${bands[label]?.[score<=3?0:score<=7?1:2]??'showed the work recorded for this skill'}.`;
}
export function buildRoleScorecard(role:RoleId,results:Result[]){
 const required=ROLE_CASES[role];
 const finished=required.map(id=>results.find(c=>c.caseId===id&&c.status==='complete'));
 if(finished.some(c=>!c))return {complete:false as const,skills:[]};
 const cases=finished.map(c=>c!);
 const labels=[...new Set(cases.flatMap(c=>publicTicket(c.caseId!,c.factsheet).skills))];
 const skills=labels.map(label=>{
  const relevant=cases.filter(c=>publicTicket(c.caseId!,c.factsheet).skills.includes(label));
  const scores=relevant.map(c=>hasAnswers(c.messages)?c.caseGrade?.find(g=>g.label===label)?.score:undefined);
  const score=scores.every((n):n is number=>typeof n==='number')?scores.reduce((sum,n)=>sum+n,0)/scores.length:null;
  const evidence=relevant.flatMap(c=>{
   const grade=c.caseGrade?.find(g=>g.label===label);
   const reply=c.messages.find(m=>m.role==='fresher'&&!isTimeout(m)&&m.text.trim()&&m.text===grade?.quote);
   return reply&&grade?[{text:reply.text,score:grade.score}]:[];
  }).sort((a,b)=>b.score-a.score);
  const quote=evidence[0]?.text??relevant.flatMap(c=>c.messages).find(m=>m.role==='fresher'&&!isTimeout(m)&&m.text.trim())?.text??'';
  return {label,score,quote,explanation:explanation(label,score,quote)};
 });
 const lowest=skills.filter(s=>s.score!==null).sort((a,b)=>a.score!-b.score!)[0];
 return {complete:true as const,skills,next:lowest?{label:lowest.label,advice:NEXT[lowest.label]}:null};
}
