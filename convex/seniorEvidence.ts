import type {CaseId} from './ticketRules';
import {CASE_OPENINGS} from './caseConversation';
export type EvidenceFact={id:string;condition:string;text:string;support:string[]};

// These are observation-only adaptations of the source records. Neither the
// classifier nor the reply builder receives expected outcomes or fix policies.
const FACTS:Record<CaseId,EvidenceFact[]>={
 'SWE-1':[
  {id:'prices',condition:'requests for the item price inputs or their types for C41',text:'C41 received the prices "100" and "50", both recorded as text',support:['prices=["100","50"]','types=[text,text]']},
  {id:'start',condition:'requests for the starting total or detailed C41 calculation records',text:'C41 started with a total of numeric 0',support:['total_started value=0']},
  {id:'first-item',condition:'requests for the value after the first item, intermediate totals, or detailed C41 calculation records',text:'after the first item, the total was recorded as text "0100"',support:['item_added value="0100" type=text']},
  {id:'second-item',condition:'requests for the value after the second item, all intermediate totals, or detailed C41 calculation records',text:'after the second item, the total was recorded as text "010050"',support:['item_added value="010050" type=text']},
  {id:'display',condition:'requests to compare the calculated value with what the display received',text:'the display received the same "010050" value recorded at the end of the calculation',support:['total_displayed received exactly','"010050"']},
  {id:'requests',condition:'requests about repeat calls, duplicated items, or whether C42 is part of C41',text:'C41 ran once with each item once, and C42 belongs to a different customer',support:['C41 ran once','C42 is another']},
  {id:'warnings',condition:'requests for warnings, errors, or failure records for C41',text:'there are no warning or failure records for C41',support:['No warning or failure record']},
 ],
 'SWE-2':[
  {id:'assigned-true',condition:'requests for what assigned=true means or the full assigned-filter contract',text:'assigned=true selects tickets with an owner',support:['assigned=true includes those with an owner']},
  {id:'assigned-false',condition:'requests for what assigned=false means or the full assigned-filter contract',text:'assigned=false selects unassigned tickets',support:['assigned=false includes only unassigned']},
  {id:'assigned-omitted',condition:'requests for the assigned default, what an omitted assigned filter does, or the full assigned-filter contract',text:'omitting the assigned filter includes both assigned and unassigned tickets',support:['Omitting assigned includes both']},
  {id:'status-filter',condition:'requests for the status parameter or what status=open selects',text:'status=open selects tickets recorded as open',support:['status=open includes only open tickets']},
  {id:'observed-response',condition:'requests for the observed GET /tickets?status=open response, comparison with no assigned filter, or sample open tickets',text:'the request without the assigned filter returned HTTP 200 with tickets 101, 102 and 103, and total 3; 101 has owner Asha and the other two have no owner',support:['101 (open, Asha)','102 (open, null)','103 (open, null)','total=3']},
  {id:'closed-ticket',condition:'requests about closed tickets in the sample',text:'ticket 104 is recorded as closed and was not in that response',support:['Ticket 104 is closed and excluded']},
  {id:'pagination',condition:'requests about pagination or missing pages in this sample',text:'this sample response is not paginated',support:['Pagination is not involved']},
  {id:'read-method',condition:'requests about whether GET changes data or the HTTP methods',text:'GET does not change a ticket record',support:['GET changes no record']},
 ],
 'DATA-1':[
  {id:'rows',condition:'requests for sample source rows, their dates or statuses, or a comparison of the data',text:'the October 14 sample has rows 1 and 2 marked delivered, row 3 cancelled and row 4 pending; row 5 is delivered but dated October 13',support:["(1, '2026-10-14', 'delivered')","(4, '2026-10-14', 'pending')","(5, '2026-10-13', 'delivered')"]},
  {id:'current-count',condition:'requests for the actual result of the current query, not an expected or correct result',text:'the current query returned four',support:['Current query returns four']},
  {id:'identifiers',condition:'requests about duplicate IDs or identity checks in the sample',text:'the sample IDs are unique',support:['Each id is unique']},
  {id:'other-day',condition:'requests for the other-day or boundary sample rows, not what its answer should be',text:'the other sample day contains one pending order and no delivered rows',support:['one pending order and no delivered orders']},
 ],
 'DATA-3':[
  {id:'orders',condition:'requests for the paid order source rows or totals before the join',text:'the paid orders for October 14 are O1, customer "0012", amount 100, and O2, customer "0013", amount 50; their total before joining is 150',support:['(O1, "0012", 100)','(O2, "0013", 50)','totals 150 before joining']},
  {id:'report',condition:'requests for the report result or totals after the join',text:'after joining, the report shows North 200 and South 50',support:['North has 200 and South has 50']},
  {id:'region-file',condition:'requests for the original region CSV or source rows',text:'the original CSV has header customer_code,region and rows 0012,North; 0012,North; 0013,South',support:['customer_code,region followed by 0012,North then 0012,North then 0013,South']},
  {id:'loaded-rows',condition:'requests for loaded region rows or comparison with the CSV',text:'the loaded region table has the same three rows as the CSV, with leading zeros preserved',support:['same three rows, with leading zeros preserved']},
  {id:'mapping-rules',condition:'requests about mapping repeats, conflicts, missing regions or equal order amounts',text:'a customer must have one region; identical repeated mappings are accidental, conflicting regions require review, unmatched orders remain under Unknown region, and different orders may share an amount',support:['a customer must have one region','different orders may have the same amount']},
 ],
 'DATA-2':[
  {id:'file-header',condition:'requests for the original CSV header, columns, or full file contents',text:'the file has the columns customer_code and name',support:['customer_code,name']},
  {id:'original-codes',condition:'requests for the original customer codes, input values, a before-and-after comparison, or full file contents',text:'the original sample codes are "0012" and "0100"',support:['0012,Asha','0100,Ravi']},
  {id:'source-rows',condition:'requests for the full original CSV rows, names paired with codes, or full file contents',text:'the sample rows pair Asha with "0012" and Ravi with "0100"',support:['0012,Asha','0100,Ravi']},
  {id:'preview',condition:'requests for the observed preview after reading or a before-and-after comparison',text:'the preview shows the codes "12" and "100"',support:['The preview shows "12" and "100"']},
  {id:'read-types',condition:'requests for intermediate values or the column type immediately after read_csv and after astype',text:'immediately after reading, the codes are integers 12 and 100; after the text conversion, they appear as "12" and "100"',support:['integers 12 and 100','astype(str) later makes them text']},
  {id:'identifier-examples',condition:'requests about identifier examples, different lengths, or whether 12 and 0012 identify the same customer',text:'the supplied identifier examples include "12", "0012" and "A7", and "12" and "0012" refer to different customers',support:['"12", "0012", and "A7"','"12" and "0012" are different customers']},
 ],
 BUGTICKET:[
  {id:'logs',condition:'requests for failed-login logs or the exact observed error message',text:'every failed login in the supplied logs says "Account not found"',support:['every failed login shows "Account not found"']},
  {id:'password-errors',condition:'requests for the full failed-login logs, whether Wrong password appears, or comparison of account and password errors',text:'none of the supplied failure records says "Wrong password"',support:['None show "Wrong password"']},
  {id:'release',condition:'requests for the last release change, diff, or the changed line',text:'the release added one line that converts the typed email to lowercase before the search',support:['one new line','typed email is converted to lowercase']},
  {id:'affected-example',condition:'requests for an example failing account or saved email, or the full affected-user evidence',text:'one failing account has the saved email Ravi.K@gmail.com',support:['Ravi.K@gmail.com']},
  {id:'affected-pattern',condition:'requests for which users are affected or patterns across failing accounts',text:'the failures are confined to older accounts with a capital letter in the saved email',support:['only users whose saved email has a capital letter','These accounts were created before the release']},
  {id:'successful-users',condition:'requests for successful users or a comparison with unaffected accounts',text:'accounts with all-lowercase saved emails are logging in',support:['all-lowercase saved emails are fine']},
 ],
};
export function safeEvidence(caseId:CaseId,source:string){
 return FACTS[caseId].filter(fact=>fact.support.every(part=>source.includes(part)));
}
export function evidenceResponseFormat(facts:EvidenceFact[]){
 if(!facts.length)throw new Error('Invalid ticket evidence');
 return {type:'json_schema',json_schema:{name:'requested_evidence',strict:true,schema:{type:'object',properties:{requested:{type:'array',items:{type:'object',properties:{fact:{type:'string',enum:facts.map(f=>f.id)}},required:['fact'],additionalProperties:false}},unavailable:{type:'boolean'}},required:['requested','unavailable'],additionalProperties:false}}};
}
export function evidenceRequests(text:string){
 return text.split(/(?<=[.!?])\s+/).flatMap(sentence=>{
  const trimmed=sentence.trim();
  if(/\?["')\]]*$/.test(trimmed))return [trimmed];
  if(/^(?:please\s+)?(?:show|share|send|give|provide|tell me|confirm|compare)\b/i.test(trimmed))return [trimmed];
  const indirect=trimmed.match(/\b(?:I want to see|I need to see|I would like to see|I'd like to see)\b[\s\S]*/i);
  return indirect?[indirect[0]]:[];
 });
}
const FOLLOW_UPS=["What's your next step?",'What have you found so far?','How will you check your plan?','What will you include in your update?','What evidence would you look at next?'];
function sentenceCount(text:string){return (text.match(/[.!?](?:["']?\s|["']?$)/g)??[]).length;}
export function seniorReply(caseId:CaseId,round:number,priorTexts:string[],facts:EvidenceFact[],requested:string[],trap:string,unavailable=false){
 if(round===0)return CASE_OPENINGS[caseId];
 const pressure=round>0&&!priorTexts.some(text=>text.includes(trap))?trap:'';
 const selected=facts.filter(fact=>requested.includes(fact.id));
 const sentences:string[]=[];
 if(selected.length){
  const slots=Math.min(2,3-sentenceCount(pressure));
  const observations=selected.map(fact=>fact.text);
  if(unavailable)observations.push("I don't have an observed record for the other requested detail");
  const perSentence=Math.ceil(observations.length/Math.max(1,slots));
  for(let i=0;i<observations.length;i+=perSentence){
   const clauses=observations.slice(i,i+perSentence).join('; ');
   sentences.push(clauses[0].toUpperCase()+clauses.slice(1)+'.');
  }
 }else{
  if(unavailable)sentences.push("I don't have an observed record for that detail here.");
  const question=FOLLOW_UPS.find(question=>!priorTexts.some(text=>text.includes(question)));
  if(question&&sentences.length+sentenceCount(pressure)<3)sentences.push(question);
 }
 if(pressure)sentences.push(pressure);
 return sentences.join(' ');
}
