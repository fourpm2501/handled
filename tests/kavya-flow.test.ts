import {convexTest} from 'convex-test';
import {it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {BUGTICKET} from '../convex/bugticket';
import {bugParts,KAVYA_OPENING,introduceKavyaTrap} from '../convex/bugRules';
const modules=import.meta.glob('../convex/**/*.*s');
const owner='kavya-test-owner-123456789012345';
afterEach(()=>vi.useRealTimers());
it('shows the exact comment-free code and removes only the public version label',()=>{
 const p=bugParts(BUGTICKET);expect(p.code).toBe('function login(emailTyped, password) {\n  const email = emailTyped.toLowerCase();\n  const user = db.findUserByEmail(email);\n  if (!user) return "Account not found";\n  if (!checkPassword(user, password)) return "Wrong password";\n  return "Login success";\n}');
 expect(p.brief).toContain('Handled');expect(p.brief).not.toContain('Handled v1');expect(BUGTICKET).toContain('GRADER CHECKS');
});
it('keeps the exact neutral opening and schedules the trap only on message three or an early fix',()=>{
 expect(KAVYA_OPENING).toBe("Since the 10 am release, some users get 'Account not found' on login. Tickets are piling up and I need an update by 1 pm. Can you look into it?");
 expect(introduceKavyaTrap(1,false,true,false)).toBe(false);
 expect(introduceKavyaTrap(2,false,false,true)).toBe(false);
 expect(introduceKavyaTrap(2,false,true,false)).toBe(true);
 expect(introduceKavyaTrap(2,false,true,true)).toBe(false);
 expect(introduceKavyaTrap(3,false,false,true)).toBe(true);
 expect(introduceKavyaTrap(3,true,true,false)).toBe(false);
});
it('accepts a Kavya reply after 90 seconds and records the full time',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);const started=Date.now();
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'kavya',owner,scenario:'bugticket',factsheet:BUGTICKET,status:'reply',replyStartedAt:started,messages:[{role:'customer',text:KAVYA_OPENING,at:started}]}));
 vi.advanceTimersByTime(90000);await t.mutation(internal.sessions.expire,{id,started});expect((await t.run(ctx=>ctx.db.get(id)))!.status).toBe('reply');
 vi.advanceTimersByTime(80000);await t.mutation(api.sessions.reply,{token:'kavya',owner,text:'Can you share the logs?',turn:1});
 const s=await t.run(ctx=>ctx.db.get(id));expect(s!.messages[1]).toMatchObject({responseMs:170000,timedOut:false,text:'Can you share the logs?'});
});
it('expires Kavya only at 180 seconds, with accurate timeout timing',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);const started=Date.now();
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'kavya',owner,scenario:'bugticket',factsheet:BUGTICKET,status:'reply',replyStartedAt:started,messages:[{role:'customer',text:KAVYA_OPENING,at:started}]}));
 vi.advanceTimersByTime(180000);await t.mutation(internal.sessions.expire,{id,started});const s=await t.run(ctx=>ctx.db.get(id));
 expect(s!.messages[1]).toMatchObject({text:'[No reply within 3 minutes]',responseMs:180000,at:started+180000,timedOut:true});
});
