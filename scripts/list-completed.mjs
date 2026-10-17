import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
// Administrative read through the existing Convex CLI; no public listing endpoint.
const rows=[];let cursor=null;
for(;;){
 const source=`const r=await ctx.db.query('sessions').withIndex('by_status',q=>q.eq('status','complete')).order('asc').paginate({numItems:100,cursor:${JSON.stringify(cursor)}});return {page:r.page.map(s=>({name:s.name?.trim()||'Name not recorded',scenario:s.scenario==='bugticket'?'Kavya':'QuickBite',started:s._creationTime,token:s.token})),isDone:r.isDone,continueCursor:r.continueCursor};`;
 const raw=execFileSync(process.execPath,[resolve('node_modules/convex/bin/main.js'),'run','--prod','--inline-query',source],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024});
 const result=JSON.parse(raw);rows.push(...result.page);if(result.isDone)break;cursor=result.continueCursor;
}
const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const escape=value=>value.replace(/\\/g,'\\\\').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
const lines=['| Name | Scenario | Date and time (IST, session started) | Result link |','| --- | --- | --- | --- |'];
for(const r of rows){const url=`https://affable-gerbil-821.convex.site/result/${r.token}`;lines.push(`| ${escape(r.name)} | ${r.scenario} | ${formatter.format(r.started)} | [Open result](${url}) |`);}
const table=lines.join('\n');mkdirSync('proof',{recursive:true});writeFileSync('proof/completed-production-sessions.json',JSON.stringify(rows,null,2),'utf8');writeFileSync('proof/completed-production-sessions.txt',table+'\n','utf8');console.log(table);
