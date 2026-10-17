export type MessagePart={kind:'text'|'log';text:string};
export function requestedEvidence(text:string){return /\?|\b(?:show|share|send|give|provide|confirm|compare|want to see|need to see)\b/i.test(text);}
export function seniorMessageParts(text:string,previousStudentReply?:string):MessagePart[]{
 if(!previousStudentReply||!requestedEvidence(previousStudentReply))return [{kind:'text',text}];
 return text.split(/(```[\s\S]*?```)/g).filter(Boolean).flatMap(part=>{
  if(part.startsWith('```'))return [{kind:'log' as const,text:part.replace(/^```[^\n]*\n?/,'').replace(/```$/,'').trimEnd()}];
  return part.split(/(?<=[.!?])\s+(?=[A-Z])|\n{2,}/).filter(s=>s.trim()).map(sentence=>{
   const observation=/\b(?:received|recorded|sample|original|preview|returned|selects|includes|omitting|contains|columns|integers|failure records|saved email|release added|logs|numeric|HTTP)\b/i.test(sentence);
   const instruction=/\?|\b(?:should|must|please|can we|do it now|i will|i'm investigating|send password|add zeros)\b/i.test(sentence);
   return {kind:observation&&!instruction?'log' as const:'text' as const,text:sentence};
  });
 });
}

export function evidenceReadingHint(text:string):string{
 if(/customer_code,region|loaded region table|original CSV has header customer_code,region/i.test(text))return 'Each row links a customer to a region. Compare the file with the loaded rows.';
 if(/Paid orders for|paid orders for October 14|after joining, the report/i.test(text))return 'Each order has its own ID. Compare the totals before and after the join.';
 if(/SUM\(o.amount_rupees\)/.test(text))return 'This adds order amounts after matching rows from the two tables.';
 if(/a customer must have one region/i.test(text))return 'These are the rules for matching customers to regions. Compare them with the sample.';
 if(/\bGET\s+\/|\/tickets\?/.test(text))return 'This is what the app asks for. Each part after ? is a filter.';
 if(/SELECT\b|WHERE\b/i.test(text))return 'This counts rows. WHERE says which rows to include.';
 if(/import pandas|read_csv|astype|for\s*\(|const email|showTotal|total\s*\+=/.test(text))return 'Read from top to bottom. Each line tells the app what to do.';
 if(/customer_code,name|\bAsha\b.*0012|0012,Asha/.test(text))return 'The first row names the columns. Each row below is one customer.';
 if(/prices\s*=|prices.*both recorded as text/i.test(text))return 'These are the two item prices. Quotes mean the values are text.';
 if(/Failing:|saved email|accounts.*logging in|failures.*older accounts/i.test(text))return 'Compare the accounts that fail with the ones that work.';
 if(/assigned.*selects|omitting.*filter|status=open selects|assigned=true includes/i.test(text))return 'Each filter chooses which tickets appear in the list.';
 if(/Reply:|HTTP 200|total 3|tickets 101/i.test(text))return 'This is what the app got back. Compare the list with what it asked for.';
 if(/\(\d+,|sample.*rows|sample day|sample IDs/i.test(text))return 'Each row is one order. Compare its day and status.';
 if(/preview|customer_code|original.*codes|integers|sample rows pair|file has the columns|identifier examples/i.test(text))return 'Compare these codes with the original file, one character at a time.';
 if(/query returned|query returns/i.test(text))return 'This is the count the current query produced. Compare it with the rows.';
 return 'Each line is one step. Check the type of each value.';
}
