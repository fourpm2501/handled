export type QuestionChip={label:string;question:string};
const chips:Record<string,readonly QuestionChip[]>={
 'SWE-1':[
  {label:'The prices of the two items',question:'Can you share the prices of the two items?'},
  {label:"The app's diary (logs) for this basket",question:"Can you share the app's diary (logs) for this basket?"},
  {label:'The code that adds the total',question:'Can you show me the code that adds the total?'},
 ],
 'SWE-2':[
  {label:'The request the app sends',question:'Can you show me the current request the app sends?'},
  {label:'The response from the app',question:'Can you share the observed ticket-list response?'},
  {label:'What each request option means',question:'Can you share what the assigned and status request options mean?'},
 ],
 'DATA-1':[
  {label:'Some order records for this day',question:'Can you share the sample order rows with their dates and statuses?'},
  {label:'The query used for the report',question:'Can you show me the current SQL query used for the report?'},
  {label:'What the current query returns',question:'What result did the current query return?'},
 ],
 'DATA-3':[
  {label:'The orders and report totals',question:'Can you share the paid orders and the totals before and after the join?'},
  {label:'The region file and loaded rows',question:'Can you share the original region CSV and the rows loaded from it?'},
  {label:'The query used for the revenue report',question:'Can you show me the SQL query used for the revenue report?'},
 ],
 'DATA-2':[
  {label:'The original customer file',question:'Can you share the original CSV rows and customer codes?'},
  {label:'The code that reads the file',question:'Can you show me the code that reads the customer file?'},
  {label:'What the imported codes look like',question:'Can you share the observed preview after the file was read?'},
 ],
 BUGTICKET:[
  {label:'The failed-login logs',question:'Can you share the failed-login logs and exact error messages?'},
  {label:'What changed in the last release',question:'Can you share what changed in the last release?'},
  {label:'Which customers cannot log in',question:'Can you share which customers are affected and an example failing account?'},
 ],
 quickbite:[
  {label:'The details of this order',question:'Can you share what was wrong with this order?'},
  {label:'What the previous agent promised',question:'Can you share the record of what the previous agent promised?'},
  {label:'What help the customer wants',question:'Can you tell me what help you want now?'},
 ],
};
export function getQuestionChips(caseId:string):readonly QuestionChip[]{return chips[caseId]??chips.quickbite;}
