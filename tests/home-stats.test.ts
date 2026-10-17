import {it,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {weeklyStudentCount} from '../convex/homeStats';
const modules=import.meta.glob('../convex/**/*.*s');
it('counts different students this week in India, excluding test names and other weeks',()=>{
 const now=Date.parse('2026-10-17T08:00:00Z');
 const row=(name:string,at:string)=>({name,caseId:'SWE-1',_creationTime:1,messages:[{at:Date.parse(at)}]});
 expect(weeklyStudentCount([row(' Asha ','2026-10-12T00:00:00Z'),row('asha','2026-10-16T00:00:00Z'),row('Ravi','2026-10-11T18:30:00Z'),row('Priya','2026-10-11T18:29:59Z'),row('TEST Shaktimaan ignore','2026-10-16T00:00:00Z'),row('','2026-10-16T00:00:00Z')],now)).toBe(2);
});
it('returns only the count and never changes a saved session',async()=>{
 const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'public-count',owner:'private',name:'Asha',caseId:'SWE-1',factsheet:'private',status:'complete',messages:[{role:'fresher',text:'private',at:Date.now()}]}));
 const before=await t.run(ctx=>ctx.db.get(id));
 expect(await t.query(api.homeStats.studentCount,{})).toBe(1);
 expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
});
