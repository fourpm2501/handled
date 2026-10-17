import {convexTest} from 'convex-test';
import {describe,it,expect} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {BUGTICKET} from '../convex/bugticket';
import {FACTSHEET} from '../convex/factsheet';
import {quickBitePublic} from '../convex/quickBitePublic';
import {bugParts,appendRequestedClues,hasUnrequestedEvidence} from '../convex/bugRules';
const modules=import.meta.glob('../convex/**/*.*s');
describe('Separate bug-ticket scenario',()=>{
 it('blocks volunteered or invented technical evidence in role-playing drafts',()=>{
 expect(hasUnrequestedEvidence('The release touched the login auth flow and user lookup; no exact details are available.')).toBe(true);
 expect(hasUnrequestedEvidence('Your email comparison fix sounds good.')).toBe(true);
 expect(hasUnrequestedEvidence('The saved emails use mixed case.')).toBe(true);
 expect(hasUnrequestedEvidence('Please send password reset links now; the 1 pm update is coming.')).toBe(false);
 expect(hasUnrequestedEvidence('Here is what you asked for; we still need to move quickly.')).toBe(false);
 });
 it('does not expose hidden clues, root cause or grading answers in the public briefing',async()=>{
 const t=convexTest(schema,modules);const brief=await t.query(api.sessions.facts,{scenario:'bugticket'});
 expect(brief).toContain('Kavya');expect(brief).not.toContain('CLUES');expect(brief).not.toContain('Ravi.K');expect(brief).not.toContain('ROOT CAUSE');expect(brief).not.toContain('RIGHT FIX');
 const code=await t.query(api.sessions.bugCode,{});expect(code).toContain('emailTyped.toLowerCase()');expect(code).toContain('db.findUserByEmail(email)');
 });
 it('keeps the complete saved ticket private on shared chat queries',async()=>{
 const t=convexTest(schema,modules);await t.run(ctx=>ctx.db.insert('sessions',{owner:'private',token:'bug',scenario:'bugticket',factsheet:BUGTICKET,messages:[],status:'customer'}));
 const s=await t.query(api.sessions.get,{token:'bug'});expect(s!.factsheet).not.toContain('Ravi.K');expect(s!.code).toContain('function login');expect(s).not.toHaveProperty('owner');
 });
 it('reveals only the particular clues requested, and nothing if none were requested',()=>{
 expect(appendRequestedClues('Please proceed.',[],BUGTICKET)).toBe('Please proceed.');
 const logs=appendRequestedClues('Here are the logs.',[1],BUGTICKET);expect(logs).toContain('None show "Wrong password"');expect(logs).not.toContain('Ravi.K');expect(logs).not.toContain('one new line');
 const change=appendRequestedClues('Here is the change.',[2],BUGTICKET);expect(change).toContain('one new line');expect(change).not.toContain('Ravi.K');expect(change).not.toContain('None show');
 const affected=appendRequestedClues('Here is an example.',[3],BUGTICKET);expect(affected).toContain('Ravi.K@gmail.com');expect(affected).not.toContain('None show');
 });
 it('keeps the QuickBite source and existing default behavior intact',async()=>{
 const t=convexTest(schema,modules);expect(await t.query(api.sessions.facts,{})).toBe(quickBitePublic(FACTSHEET));expect(await t.query(api.sessions.facts,{scenario:'quickbite'})).toBe(quickBitePublic(FACTSHEET));
 });
});
