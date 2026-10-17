import {convexTest} from 'convex-test';
import {it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {BUGTICKET} from '../convex/bugticket';
import {ticketParts} from '../convex/ticketRules';
import {SILENCE_REMINDER,NO_ANSWERS_STATUS,NO_ANSWERS_NOTE} from '../convex/resultRules';
const modules=import.meta.glob('../convex/**/*.*s');
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

it('ends a silent legacy attempt after its first unchanged timeout with one reminder and no AI or grades',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);const started=Date.now();
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'silent',owner:'owner',scenario:'bugticket',factsheet:BUGTICKET,status:'reply',replyStartedAt:started,messages:[{role:'customer',text:'Can you investigate?',at:started}]}));
 vi.advanceTimersByTime(179999);await t.mutation(internal.sessions.expire,{id,started});expect((await t.run(ctx=>ctx.db.get(id)))!.status).toBe('reply');
 vi.advanceTimersByTime(1);await t.mutation(internal.sessions.expire,{id,started});
 const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
 await t.action(internal.bugAi.advance,{id});await t.action(internal.bugAi.advance,{id});
 const saved=(await t.run(ctx=>ctx.db.get(id)))!;
 expect(saved.status).toBe('complete');expect(saved.messages).toHaveLength(3);
 expect(saved.messages[1]).toMatchObject({role:'fresher',timedOut:true,responseMs:180000});
 expect(saved.messages[2]).toMatchObject({role:'customer',text:SILENCE_REMINDER});
 expect(saved.bugGrade).toBeUndefined();expect(saved.graderRaw).toBeUndefined();expect(fetchMock).not.toHaveBeenCalled();
 const result=(await t.query(api.sessions.get,{token:'silent'}))!;expect(result.assessmentLabel).toBe(NO_ANSWERS_STATUS);expect(result.timeoutCount).toBe(1);expect(result.seniorNote).toBe(NO_ANSWERS_NOTE);
});

it('skips grading a silent role case after its unchanged case deadline',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);const started=Date.now();
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'silent-role',owner:'owner',scenario:'bugticket',caseId:'DATA-1',roleId:'data',factsheet:ticketParts('DATA-1').source,status:'reply',deadlineAt:started+300000,replyStartedAt:started,messages:[{role:'customer',text:'Where will you start?',at:started}]}));
 vi.advanceTimersByTime(300000);await t.mutation(internal.sessions.expireCase,{id,deadlineAt:started+300000});
 const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);await t.action(internal.bugAi.advance,{id});
 const saved=(await t.run(ctx=>ctx.db.get(id)))!;expect(saved.caseGrade).toBeUndefined();expect(saved.deadlineAt).toBe(started+300000);expect(saved.status).toBe('complete');expect(saved.messages.filter(m=>m.text===SILENCE_REMINDER)).toHaveLength(1);expect(fetchMock).not.toHaveBeenCalled();
 const result=(await t.query(api.sessions.get,{token:'silent-role'}))!;
 expect(result.assessmentStatus).toBe('not_assessed');expect('caseResults' in result&&result.caseResults[0].score).toBeNull();expect('roleScore' in result&&result.roleScore).toBeNull();
});

it('shows historical all-timeout attempts as not assessed while preserving their original records',async()=>{
 const t=convexTest(schema,modules);const oldGrade={questions:{score:1,quote:'[No reply within 3 minutes]',reason:'Old assessment'},cause:{score:1,quote:'[No reply within 3 minutes]',reason:'Old assessment'},fix:{score:1,quote:'[No reply within 3 minutes]',reason:'Old assessment'},explanation:{score:1,quote:'[No reply within 3 minutes]',reason:'Old assessment'}};
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'old-silent',owner:'owner',scenario:'bugticket',factsheet:BUGTICKET,status:'complete',bugGrade:oldGrade,graderRaw:'old grader',messages:Array.from({length:8},(_,i)=>({role:'fresher' as const,text:'[No reply within 3 minutes]',at:i,timedOut:true}))}));
 const result=(await t.query(api.sessions.get,{token:'old-silent'}))!;
 expect(result.assessmentLabel).toBe(NO_ANSWERS_STATUS);expect(result.timeoutCount).toBe(8);expect(result.bugGrade).toBeUndefined();expect(result.graderRaw).toBeUndefined();
 expect((await t.run(ctx=>ctx.db.get(id)))!.bugGrade).toEqual(oldGrade);
});
