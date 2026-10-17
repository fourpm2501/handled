import {convexTest} from 'convex-test';
import {it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {ticketParts} from '../convex/ticketRules';
const modules=import.meta.glob('../convex/**/*.*s');
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('counts only finished cases in the saved role attempt without changing results',async()=>{
 const t=convexTest(schema,modules);
 for(const [token,caseId,runToken,status,text] of [
  ['last','DATA-2','run','complete','The reader dropped zeros by reading codes as numbers.'],
  ['first','DATA-1','run','complete','Can you share the logs?'],
  ['other','DATA-1','other','complete','Other student'],
  ['unfinished','DATA-1','run','reply','Not finished']
 ] as const)await t.run(ctx=>ctx.db.insert('sessions',{token,caseId,runToken,roleId:'data',owner:'owner',factsheet:ticketParts(caseId).source,status,messages:[{role:'fresher',text,at:1}]}));
 const before=await t.run(ctx=>ctx.db.query('sessions').collect());
 vi.stubEnv('OPENAI_API_KEY','test-key');
 vi.stubGlobal('fetch',vi.fn(async(_url,options)=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({found:JSON.parse(options.body).messages[1].content.includes('reader dropped zeros')})}}]})})));
 const summary=await t.action(api.seniorFeedback.roleDiagnosis,{token:'last'});
 expect(summary[0]).toBe('You found the cause in 1 of 2 cases.');
 expect(summary).toHaveLength(3);
 expect(summary.join(' ').split(/\s+/).length).toBeLessThan(50);
 expect(await t.run(ctx=>ctx.db.query('sessions').collect())).toEqual(before);
});
