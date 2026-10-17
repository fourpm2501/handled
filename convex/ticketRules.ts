import { TICKETS, MAP_SETTINGS } from './tickets';
import { bugParts } from './bugRules';
import {CLOSING_LINE} from './resultRules';

export const ROLE_CASES = {
 software: ['SWE-1', 'SWE-2', 'BUGTICKET'],
 data: ['DATA-1', 'DATA-2', 'DATA-3'],
} as const;
export type RoleId = keyof typeof ROLE_CASES;
export type CaseId = typeof ROLE_CASES[RoleId][number];
export const ROLE_LABELS = {software:'Junior software engineer',data:'Junior data engineer'};

function section(source:string, heading:string, next:string) {
 const at=source.indexOf(`\n${heading}\n`);
 const end=source.indexOf(`\n${next}`,at+heading.length+2);
 if(at<0||end<0)throw new Error('Invalid ticket section');
 return source.slice(at+heading.length+2,end).trim();
}
export function ticketParts(caseId:CaseId, saved?:string) {
 const source=(saved??TICKETS[caseId]).replace(/\r\n/g,'\n');
 const mapped=MAP_SETTINGS[caseId];
 const field=(name:string)=>source.match(new RegExp(`^${name}: (.+)$`,'m'))?.[1];
 const roleId:RoleId=caseId.startsWith('DATA-')?'data':'software';
 const roleContext=caseId==='BUGTICKET'
  ?"You are a junior software engineer. Kavya, your senior, needs to know why some users can't log in. Ask her questions, find the cause, and tell her the fix in plain words."
  :section(source,'ROLE CONTEXT','TOOLS TESTED:');
 const scenario=section(source,'SCENARIO','SENIOR ENGINEER');
 const senior=section(source,'SENIOR ENGINEER','CODE SHOWN TO THE FRESHER').split('\n')[0];
 const seniorName=senior.split(',')[0];
 const codeAt=source.indexOf('CODE SHOWN TO THE FRESHER');
 const codeEnd=source.indexOf('\nCLUES (',codeAt);
 const codeTitle=source.slice(codeAt,source.indexOf('\n',codeAt)).match(/\((.*)\)/)?.[1]??'Case reference';
 const code=caseId==='BUGTICKET'?bugParts(source).code:source.slice(source.indexOf('\n',codeAt)+1,codeEnd).trim();
 const minutes=Number(field('TIME LIMIT')?.match(/^\d+/)?.[0]??mapped.minutes);
 const maxReplies=Number(field('MAX REPLIES')?.match(/^\d+/)?.[0]??mapped.maxReplies);
 const skills=(field('SKILLS TESTED')??mapped.skills).split('; ').filter(Boolean);
 if(!minutes||!maxReplies||!skills.length||codeEnd<0)throw new Error('Invalid ticket metadata');
 const brief=`SCENARIO\n${scenario}\n\nSENIOR ENGINEER\n${senior}`;
 const caseIndex=ROLE_CASES[roleId].findIndex(id=>id===caseId);
 const nextCaseId=ROLE_CASES[roleId][caseIndex+1]??null;
 const handoff=nextCaseId?`Let's move on to ${nextCaseId}.`:CLOSING_LINE;
 const publicTicket={nextCaseId,handoff,caseId,roleId,roleLabel:ROLE_LABELS[roleId],roleContext,
  level:field('LEVEL')??mapped.level,tools:field('TOOLS TESTED')??mapped.tools,
  skills,timeLimitMs:minutes*60000,maxReplies,brief,code,codeTitle,seniorName,
  caseIndex:ROLE_CASES[roleId].findIndex(id=>id===caseId),caseCount:ROLE_CASES[roleId].length};
 const clueSection=section(source,'CLUES (revealed only if the fresher asks a related question)','ROOT CAUSE');
 const clues=clueSection.split('\n').filter(line=>/^Clue [123] /.test(line)).map((line,index)=>{
  if(caseId==='BUGTICKET'){
   const arrow=line.indexOf('→');
   return {id:index+1,condition:line.slice(0,arrow).replace(/^Clue \d+\s*[–-]\s*/,''),evidence:line.slice(arrow+1).trim()};
  }
  const marker=line.indexOf(': if asked '),provide=line.indexOf(', provide ',marker);
  if(marker<0||provide<0)throw new Error('Invalid ticket clue');
  return {id:index+1,condition:line.slice(marker+2,provide),evidence:line.slice(provide+10).trim()};
 });
 if(clues.length!==3||clues.some(c=>!c.evidence))throw new Error('Invalid ticket clues');
 const trap=section(source,'TRAP','STRONG ANSWER').match(/(?:Kavya|Meera) says: "([^\n]+)"/)?.[1];
 if(!trap)throw new Error('Invalid ticket trap');
 return {source,publicTicket,clues,trap,scenario};
}

// Only this small public object may be returned to a browser. The saved source,
// clue routing, answers, pressure instructions and rubric stay in server code.
export function publicTicket(caseId:CaseId,saved?:string){return ticketParts(caseId,saved).publicTicket;}

// Feedback can describe demonstrated skills, but it cannot carry private rubric
// answers from an assessor's free-text explanation into the student result.
export function publicGradeReason(skill:string,score:number){
 const band=score<=3?0:score<=7?1:2;
 const feedback:Record<string,string[]>={
  'Analytical thinking':[
   'The replies do not show a comparison of the supplied evidence or a supported diagnosis.',
   'The replies use some relevant evidence, but the conclusion is only partly supported.',
   'The replies connect relevant evidence to a clear, supported conclusion.',
  ],
  'Technical understanding':[
   'The replies do not demonstrate a correct use of the tools and concepts tested in this case.',
   'The replies demonstrate some of the tested concepts, with gaps in correctness.',
   'The replies demonstrate a correct understanding of the tools and concepts tested in this case.',
  ],
  'Problem-solving method':[
   'The replies do not show an evidence-first investigation and a checked correction.',
   'The replies show some useful investigation or validation, but the method is incomplete.',
   'The replies show a systematic investigation, a supported correction, and relevant checks.',
  ],
  'Communication':[
   'The replies do not give a clear, supported update with an honest next step.',
   'The replies give a partly clear update, with gaps in explanation or next steps.',
   'The replies give a clear, concise update and distinguish evidence from untested claims.',
  ],
 };
 if(!feedback[skill])throw new Error('Invalid grading skill');
 return feedback[skill][band];
}
