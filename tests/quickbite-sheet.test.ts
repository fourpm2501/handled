import {convexTest} from 'convex-test';
import {it,expect} from 'vitest';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {FACTSHEET} from '../convex/factsheet';
const modules=import.meta.glob('../convex/**/*.*s');
const hidden=['CORRECT OUTCOME','TRAP','STRONG ANSWER','WEAK ANSWERS','GRADER CHECKS'];
it('shows only the three permitted sections while preserving the exact full AI sheet, including old chats',async()=>{
 const t=convexTest(schema,modules);
 const start=await t.query(api.sessions.facts,{});
 for(const heading of ['SCENARIO','CUSTOMER','RULES'])expect(start).toContain(heading);
 for(const heading of hidden)expect(start).not.toContain(heading);
 // Legacy chats have no scenario field; their public sheet must also be reduced.
 const id=await t.run(ctx=>ctx.db.insert('sessions',{owner:'private',token:'legacy',factsheet:FACTSHEET,messages:[],status:'customer'}));
 const publicChat=await t.query(api.sessions.get,{token:'legacy'});expect(publicChat!.factsheet).toBe(start);
 const privateChat=await t.query(internal.sessions.read,{id});expect(privateChat!.factsheet).toBe(FACTSHEET);
 for(const heading of hidden)expect(privateChat!.factsheet).toContain(heading);
 const token=await t.mutation(api.sessions.start,{owner:'new-session-owner-123456789012',name:'Test Fresher',scenario:'quickbite'});
 const newChat=await t.query(api.sessions.get,{token});expect(newChat!.factsheet).toBe(start);
 expect((await t.query(internal.sessions.read,{id:newChat!._id}))!.factsheet).toBe(FACTSHEET);
});
