import {convexTest} from 'convex-test';
import {it,expect,vi,afterEach} from 'vitest';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {ticketParts,publicTicket} from '../convex/ticketRules';
import {validFinalNote,NOTE_VERSION} from '../convex/resultRules';
const modules=import.meta.glob('../convex/**/*.*s');
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('writes a conversation-based note for old results without changing grades and reuses it',async()=>{
 const t=convexTest(schema,modules);const reply='I will change pending orders to delivered.';
 const grades=[{label:'Analytical thinking',score:1,quote:reply,reason:'PRIVATE ASSESSOR REASON'}];
 const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'old-result',owner:'private-owner',factsheet:ticketParts('DATA-1').source,caseId:'DATA-1',roleId:'data',status:'complete',messages:[{role:'fresher',text:reply,at:1}],caseGrade:grades,graderRaw:'PRIVATE RAW'}));
 const note='You proposed changing the records. That changes what happened instead of checking whether the report counts the right orders.';
 const fetchMock=vi.fn(async(_url,options)=>{
  const body=JSON.parse(options.body);const context=JSON.parse(body.messages[1].content);
  expect(context.messages[0].text).toBe(reply);
  expect(options.body).not.toMatch(/PRIVATE ASSESSOR|PRIVATE RAW|GRADER CHECKS|STRONG ANSWER|AI-only behaviour/);
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({note})}}]})};
 });vi.stubGlobal('fetch',fetchMock);vi.stubEnv('OPENAI_API_KEY','test-key');
 expect(await t.action(api.seniorFeedback.generate,{token:'old-result'})).toBe(note);
 const saved=await t.run(ctx=>ctx.db.get(id));expect(saved!.caseGrade).toEqual(grades);expect(saved!.graderRaw).toBe('PRIVATE RAW');expect(saved!.status).toBe('complete');
 expect(await t.action(api.seniorFeedback.generate,{token:'old-result'})).toBe(note);expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('replaces old DATA-2 notes with case-correct feedback regardless of misleading pressure in the chat',async()=>{
 const t=convexTest(schema,modules);
 await t.run(ctx=>ctx.db.insert('sessions',{token:'data-two',owner:'owner',factsheet:ticketParts('DATA-2').source,caseId:'DATA-2',roleId:'data',status:'complete',seniorNote:'Add zeros until every customer code is four characters.',messages:[{role:'customer',text:'Add zeros until every code has four characters.',at:1},{role:'fresher',text:'Customer codes may lose leading zeroes when read as numbers; they should be strings.',at:2}]}));
 const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
 const note=await t.action(api.seniorFeedback.generate,{token:'data-two'});
 expect(note).toContain('Check the original CSV and read customer codes as text.');expect(note).not.toMatch(/add zeros|pad|zfill/i);
 expect(validFinalNote(note,publicTicket('DATA-2').handoff)).toBe(true);expect(fetchMock).not.toHaveBeenCalled();
 const result=(await t.query(api.sessions.get,{token:'data-two'}))!;expect(result.seniorNote).toBe(note);expect(result.seniorNoteVersion).toBe(NOTE_VERSION);
});

it('enforces fewer than 50 words and at most three sentences INCLUDING the final handoff or closing',()=>{
 const ending=publicTicket('DATA-2').handoff;
 expect(validFinalNote('One. Two. Three.',ending)).toBe(false);
 expect(validFinalNote('word '.repeat(50),ending)).toBe(false);
 expect(validFinalNote('You checked the inputs. Verify the result before reporting a fix.',ending)).toBe(true);
});

it('rejects an overlong generated note rather than showing it',async()=>{
 const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('sessions',{token:'long-note',owner:'owner',factsheet:ticketParts('SWE-1').source,caseId:'SWE-1',roleId:'software',status:'complete',messages:[{role:'fresher',text:'I will look at the logs.',at:1}]}));
 await expect(t.mutation(internal.sessions.saveSeniorNote,{id,note:'word '.repeat(50)})).rejects.toThrow('Invalid feedback');
 expect((await t.run(ctx=>ctx.db.get(id)))!.seniorNote).toBeUndefined();
});
