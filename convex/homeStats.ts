import {query} from './_generated/server';
export function weeklyStudentCount(rows:{name?:string;caseId?:string;scenario?:string;_creationTime:number;messages:{at:number}[]}[],now:number){
 // Monday midnight in India; return only an aggregate, with no student details.
 const offset=330*60000,local=new Date(now+offset);
 const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-((local.getUTCDay()+6)%7)*86400000-offset;
 const names=new Set<string>();
 for(const row of rows){
  const name=row.name?.trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
  const finished=row.messages.at(-1)?.at??row._creationTime;
  if(name&&!/test|check|shaktimaan|grading|recovery|abid/i.test(name)&&(row.caseId||row.scenario==='bugticket')&&finished>=start&&finished<=now)names.add(name);
 }
 return names.size;
}
export const studentCount=query({args:{},handler:async ctx=>weeklyStudentCount(await ctx.db.query('sessions').withIndex('by_status',q=>q.eq('status','complete')).collect(),Date.now())});
