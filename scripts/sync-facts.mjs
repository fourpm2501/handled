import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('convex',{recursive:true});
writeFileSync('convex/factsheet.ts', '// Generated from FACTSHEET.md; edit the source, not this file.\nexport const FACTSHEET = '+JSON.stringify(readFileSync('FACTSHEET.md','utf8'))+';\n');
writeFileSync('convex/bugticket.ts', '// Generated from BUGTICKET.md; edit the source, not this file.\nexport const BUGTICKET = '+JSON.stringify(readFileSync('BUGTICKET.md','utf8'))+';\n');
const caseIds=['SWE-1','SWE-2','BUGTICKET','DATA-1','DATA-2','DATA-3'];
const tickets=Object.fromEntries(caseIds.map(id=>[id,readFileSync(`${id}.md`,'utf8')]));
const map=readFileSync('ROLE-MAP.md','utf8').trim().split(/\r?\n/).map(line=>line.split(' | '));
const settings=Object.fromEntries(caseIds.map(id=>{
 const row=map.find(row=>row[0]===id);
 if(!row)throw new Error(`Missing role map settings: ${id}`);
 const limits=row[4].match(/^(\d+) minutes \((\d+) student replies\)$/);
 if(!limits)throw new Error(`Invalid role map limits: ${id}`);
 return [id,{level:row[1],tools:row[2],skills:row[3],minutes:Number(limits[1]),maxReplies:Number(limits[2])}];
}));
writeFileSync('convex/tickets.ts','// Generated server-only ticket sources; never import into src.\nexport const TICKETS = '+JSON.stringify(tickets)+' as const;\nexport const MAP_SETTINGS = '+JSON.stringify(settings)+' as const;\n');
