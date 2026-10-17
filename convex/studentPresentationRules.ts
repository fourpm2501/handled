import {hasAnswers,isTimeout} from './resultRules';
export type StudentMessage={role:'customer'|'fresher';text:string;timedOut?:boolean};
const advice:Record<string,[string,string]>={
 'SWE-1':["Follow one basket's values and types before changing how its total looks.",'Next time: verify the total against the original prices.'],
 'SWE-2':['Check what each filter means before changing the request.',"Next time: compare the response with the request's filters."],
 'DATA-1':['Keep both day and delivered-status filters; source statuses must stay unchanged.','Next time: check a day with no delivered orders.'],
 'DATA-2':['Check the original CSV and read codes as text to preserve them.','Next time: compare the original and imported codes.'],
 BUGTICKET:['Check the account lookup before assuming the password is wrong.','Next time: compare the logs, release change and affected accounts.'],
 quickbite:['Check the recorded order and policy before promising help.','Next time: confirm what you can offer before making a promise.'],
};
const causes:Record<string,string>={
 'SWE-1':'the app joined the prices as words instead of adding them as numbers',
 'SWE-2':'the request left out open tickets that had no owner',
 BUGTICKET:'typed emails used small letters and no longer matched saved emails with capitals',
 'DATA-1':'the report counted waiting and cancelled orders as delivered',
 'DATA-3':'the region file listed one customer twice, so the report counted their order twice',
 'DATA-2':'the file reader treated customer codes as numbers and dropped their first zeros',
};
const causeAdvice:Record<string,[string,string]>={
 'SWE-1':['Add the prices as numbers before showing the total.','Next time: follow one basket from input to screen.'],
 'SWE-2':['Ask for all open tickets without changing their owners.','Next time: compare the returned tickets with the request.'],
 BUGTICKET:['Match emails without treating capitals as different letters.','Next time: check which step failed before changing passwords.'],
 'DATA-1':['Keep the chosen day and count only delivered orders.','Next time: compare the count with the original rows.'],
 'DATA-3':['Use one checked region per customer and keep every valid order.','Next time: compare order counts and totals before and after joining.'],
 'DATA-2':['Read the original file again, keeping codes as text.','Next time: compare the saved codes with the original file.'],
};
export function plainCause(caseId:string){return causes[caseId]??null;}
function answers(messages:StudentMessage[]){return messages.filter(m=>m.role==='fresher'&&!isTimeout(m)&&m.text.trim());}
export function studentFeedback(caseId:string,messages:StudentMessage[],foundCause=false,rejectedTrap=false):[string,string,string]{
 const replies=answers(messages);
 const cause=plainCause(caseId);
 if(cause){
  const first=foundCause&&replies.length?`You found it: ${cause}.`:`Not yet: the cause was ${cause}.`;
  if(!replies.length)return [first,"I couldn't assess your work without an answer.",'Next time: send one question before time runs out.'];
  const refused:Record<string,string>={
   'SWE-1':'You said no to removing the first zero to hide the wrong total.',
   'SWE-2':'You said no to giving every ticket an owner just to show it.',
   BUGTICKET:'You said no to password resets for a failed account search.',
   'DATA-1':'You said no to marking waiting orders as delivered.',
   'DATA-3':'You said no to deleting amounts that happen to match.',
   'DATA-2':'You said no to adding zeros by guesswork.',
  };
  return [first,rejectedTrap?refused[caseId]:causeAdvice[caseId][0],causeAdvice[caseId][1]];
 }
 if(!replies.length)return ["I didn't receive an answer to assess.",'I need your own replies to understand how you think.','Next time: send one question before time runs out.'];
 const text=replies.map(m=>m.text).join(' ');
 let first:string;
 if(caseId==='DATA-2'&&/number/i.test(text)&&/string|text/i.test(text)&&/zero/i.test(text))first='You noticed that reading codes as numbers can change them.';
 else{
  const question=replies.find(m=>/\?|\b(?:can you|could you|please share)\b/i.test(m.text));
  const quote=(question??replies[0]).text.replace(/[.!?\r\n“”"]/g,'').trim().split(/\s+/).slice(0,6).join(' ');
  first=question?`You asked, “${quote}”, to investigate the problem.`:`You put your thinking into words: “${quote}”.`;
 }
 const [thinking,next]=advice[caseId]??advice.quickbite;
 return [first,thinking,next];
}
export function roleSummary(cases:{messages:StudentMessage[];foundCause?:boolean}[]):[string,string,string]{
 const answered=cases.filter(c=>hasAnswers(c.messages));
 const found=answered.filter(c=>c.foundCause).length;
 const asked=answered.some(c=>answers(c.messages).some(m=>/\?|\b(?:can you|could you|please share)\b/i.test(m.text)));
 return [`You found the cause in ${found} of ${cases.length} cases.`,
  asked?'You asked questions to understand the problem.':answered.length?'You put your ideas into your own words.':'You made a start by opening these cases.',
  'Next time, check your idea against the evidence before choosing a fix.'];
}
