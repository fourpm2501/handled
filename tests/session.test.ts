import {convexTest} from 'convex-test';
import {describe,it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.*s');
const owner='test-owner-12345678901234567890';
async function setup(count=1){
 const t=convexTest(schema,modules);const started=Date.now();
 const messages=Array.from({length:count*2-1},(_,i)=>({role:i%2?'fresher' as const:'customer' as const,text:i%2?'Prior reply':'Customer demand',at:started-1000}));
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'test',owner,factsheet:'Test sheet',status:'reply',replyStartedAt:started,messages}));
 return {t,id,started};
}
afterEach(()=>vi.useRealTimers());
describe('Practice rules',()=>{
 it('records response time from the server and refuses duplicate replies',async()=>{
 vi.useFakeTimers();const {t,id}=await setup();vi.advanceTimersByTime(4321);
 await t.mutation(api.sessions.reply,{token:'test',owner,text:'I can refund ₹60 + ₹40.',turn:1});
 await t.mutation(api.sessions.reply,{token:'test',owner,text:'Duplicate',turn:1});
 const s=await t.run(ctx=>ctx.db.get(id));expect(s!.messages).toHaveLength(2);expect(s!.messages[1].responseMs).toBe(4321);expect(s!.status).toBe('customer');
 });
 it('expires a reply at 90 seconds and ignores stale timeout jobs',async()=>{
 vi.useFakeTimers();const {t,id,started}=await setup();vi.advanceTimersByTime(90000);
 await t.mutation(internal.sessions.expire,{id,started});await t.mutation(internal.sessions.expire,{id,started});
 const s=await t.run(ctx=>ctx.db.get(id));expect(s!.messages).toHaveLength(2);expect(s!.messages[1]).toMatchObject({text:'[No reply within 90 seconds]',responseMs:90000,timedOut:true});
 });
 it('ends after the eighth customer message',async()=>{
 const {t,id}=await setup(8);await t.mutation(api.sessions.reply,{token:'test',owner,text:'I will escalate and you will hear back within 24 hours.',turn:15});
 const s=await t.run(ctx=>ctx.db.get(id));expect(s!.status).toBe('grading');expect(s!.messages).toHaveLength(16);
 });
 it('rejects another browser and hides the private write token',async()=>{
 const {t}=await setup();await expect(t.mutation(api.sessions.reply,{token:'test',owner:'someone-else',text:'No',turn:1})).rejects.toThrow();
 const s=await t.query(api.sessions.get,{token:'test'});expect(s).not.toHaveProperty('owner');expect(s).not.toHaveProperty('lease');
 });
 it('records a late submitted reply as a timeout',async()=>{
 vi.useFakeTimers();const {t,id}=await setup();vi.advanceTimersByTime(91000);await t.mutation(api.sessions.reply,{token:'test',owner,text:'Late answer',turn:1});
 const s=await t.run(ctx=>ctx.db.get(id));expect(s!.messages[1].text).toBe('[No reply within 90 seconds]');expect(s!.messages[1].responseMs).toBe(90000);
 });
 it('keeps all grades absent after an action failure and allows retry',async()=>{
 const {t,id}=await setup();await t.run(ctx=>ctx.db.patch(id,{status:'grading',lease:'worker',leaseAt:Date.now()}));
 await t.mutation(internal.sessions.fail,{id,lease:'worker'});let s=await t.run(ctx=>ctx.db.get(id));expect(s!.status).toBe('error');expect(s!.grade).toBeUndefined();
 await t.mutation(api.sessions.retry,{token:'test',owner});s=await t.run(ctx=>ctx.db.get(id));expect(s!.status).toBe('grading');expect(s!.grade).toBeUndefined();
 });
});
