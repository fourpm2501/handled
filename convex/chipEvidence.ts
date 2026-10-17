import {getQuestionChips} from '../src/questionChips';
import {ticketParts} from './ticketRules';
import type {CaseId} from './ticketRules';

// This fixture demonstrates the operation recorded in SWE-1. The ticket contains
// logs, not implementation code, so this is explicitly labelled as a sample.
export const SWE1_ADDITION_SAMPLE='let total = 0;\nfor (const price of prices) {\n  total += price;\n}\nshowTotal(total);';
function match(source:string,pattern:RegExp){const found=source.match(pattern);if(!found)throw new Error('Invalid chip evidence');return found;}
function clue(source:string,n:number){return match(source,new RegExp(`^Clue ${n} [^\\n]+$`,'m'))[0];}

export function chipEvidence(caseId:CaseId,savedSource:string,question:string):{label:string;block:string}|null{
 const chips=getQuestionChips(caseId);const index=chips.findIndex(chip=>chip.question===question.trim()||chip.label===question.trim());
 if(index<0)return null;
 const {source,publicTicket}=ticketParts(caseId,savedSource);
 let block='';let label=chips[index].label;
 if(caseId==='SWE-1'){
  if(index===0)block='prices = ['+match(source,/prices=\[([^\]]+)\]/)[1]+']';
  if(index===1)block=match(clue(source,1),/provide (10:[\s\S]+?)\. The approved expected/)[1].replace(/;\s*(?=\d\d:\d\d:\d\d\.)/g,'\n');
  if(index===2){label='Case code sample matching the supplied logs';block=SWE1_ADDITION_SAMPLE;}
 }else if(caseId==='SWE-2'){
  if(index===0)block='GET '+match(publicTicket.code,/GET[^\n]*?(\/tickets[^\n]*)/)[1];
  if(index===1)block=publicTicket.code.split('\n').slice(1).join('\n');
  if(index===2)block=match(clue(source,1),/provide (.+)$/)[1];
 }else if(caseId==='DATA-1'){
  if(index===0){const rows=clue(source,1).match(/\(\d+, '[^']+', '[^']+'\)/g);if(!rows?.length)throw new Error('Invalid chip evidence');block=rows.join('\n');}
  if(index===1)block=match(publicTicket.code,/SELECT[\s\S]+?;/)[0];
  if(index===2)block=match(clue(source,1),/Current query returns [^;]+/)[0];
 }else if(caseId==='DATA-3'){
  if(index===0)block='Paid orders for 2026-10-14\norder_id,customer_code,amount_rupees\nO1,"0012",100\nO2,"0013",50\nBefore join: 150\nAfter join: North 200; South 50';
  if(index===1)block='Original CSV\ncustomer_code,region\n0012,North\n0012,North\n0013,South\n\nLoaded region_upload rows\ncustomer_code,region\n0012,North\n0012,North\n0013,South';
  if(index===2)block=match(publicTicket.code,/SELECT[\s\S]+?;/)[0];
 }else if(caseId==='DATA-2'){
  if(index===0)block=match(clue(source,1),/raw lines (.+?)\. The preview/)[1].split(' then ').join('\n');
  if(index===1)block=publicTicket.code;
  if(index===2){const values=match(clue(source,1),/The preview shows "([^"]+)" and "([^"]+)"/);block=`customer_code\n"${values[1]}"\n"${values[2]}"`;}
 }else{
  if(index===0){const observed=match(clue(source,1),/every failed login shows "([^"]+)"\. None show "([^"]+)"/);label='Supplied failure log observations';block=`failed_login.error = "${observed[1]}"\n"${observed[2]}" in supplied failures = none`;}
  if(index===1)block='+ '+match(publicTicket.code,/const email = [^\n]+/)[0];
  if(index===2)block='Failing: Ravi.K@gmail.com, Priya.S@yahoo.com. Working: ravi@gmail.com, anil.k@gmail.com.';
 }
 if(!block)throw new Error('Invalid chip evidence');
 return {label,block};
}

export function chipReply(caseId:CaseId,source:string,question:string,priorMessages:{role:string;text:string}[]):string|null{
 const evidence=chipEvidence(caseId,source,question);if(!evidence)return null;
 const ticket=ticketParts(caseId,source);const seniors=priorMessages.filter(m=>m.role==='customer');
 const pressure=seniors.length>=1&&!seniors.some(m=>m.text.includes(ticket.trap))?`\n\n${ticket.trap}`:'';
 return `${evidence.label}:\n\n\`\`\`\n${evidence.block}\n\`\`\`${pressure}`;
}
