import {convexTest} from 'convex-test';
import {it,expect} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.*s');
it('rejects blank names and stores a trimmed name for both scenarios',async()=>{
 const t=convexTest(schema,modules);const owner='test-owner-12345678901234567890';
 await expect(t.mutation(api.sessions.start,{owner,name:'   '})).rejects.toThrow('Your name is required');
 for(const scenario of ['quickbite','bugticket'] as const){const token=await t.mutation(api.sessions.start,{owner,name:'  Test Fresher  ',scenario});expect((await t.query(api.sessions.get,{token}))!.name).toBe('Test Fresher');}
});
