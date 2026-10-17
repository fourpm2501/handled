import {chromium,expect} from '@playwright/test';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
import {readFileSync,writeFileSync} from 'node:fs';
const live=process.argv.includes('--live');
const base=live?'https://affable-gerbil-821.convex.site':'http://127.0.0.1:5173';
const cloud=live?'https://affable-gerbil-821.convex.cloud':readFileSync('.env.local','utf8').match(/^VITE_CONVEX_URL=(.+)$/m)[1].trim();
const client=new ConvexHttpClient(cloud);
const saved=JSON.parse(readFileSync('proof/production-swe1-grader-errors.json','utf8'))[0];
const cases=[
 {id:'SWE-1',replies:saved.messages.filter(m=>m.role==='fresher').map(m=>m.text)},
 {id:'SWE-2',replies:[
  'Can you share the full filter contract for status and assigned, and the observed response to GET /tickets?status=open?',
  'I would use GET /tickets?status=open with no assigned parameter. assigned=true excludes unassigned tickets. I will not put fake owners on them or change their records.',
  'I will compare the returned IDs and total with the sample, check that closed tickets stay out, and test an empty matching set. I have not run those checks yet.',
 ]},
 {id:'BUGTICKET',replies:[
  'Before proposing a fix, can you share the failed-login logs and what changed in the 10 am release?',
  'Which users are affected? Can you give a failing saved email and compare it with accounts that log in?',
  'The typed email is lowercased, but saved emails like "Ravi.K@gmail.com" still contain capitals. An exact lookup misses those accounts before password checking. Compare both saved and typed emails in lowercase; password resets will not solve that lookup failure.',
  'In plain words, we started searching with small letters while some saved emails have capitals. Make the search ignore capitals. I would check mixed-case and lowercase accounts and ensure wrong passwords still fail, then report the cause and the check results honestly.',
 ]},
];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await expect(page.locator('.paper-label')).toHaveText('SWE-1');
 await page.getByLabel('Your name',{exact:true}).fill(`Software grading recovery ${live?'live':'local'}`);
 for(const [caseIndex,run] of cases.entries()){
  await expect(page.locator('.paper-label')).toHaveText(run.id);
  await page.getByRole('button',{name:'Start practice'}).click();await expect(page).toHaveURL(/\/practice\//);
  const token=new URL(page.url()).pathname.split('/').at(-1);
  const state=()=>client.query(anyApi.sessions.get,{token});
  async function waitStatus(status,timeout=90000){await expect.poll(async()=>{const s=await state();if(s.status==='error')throw Error(`${run.id}: ${s.errorStage} failed`);return s.status;},{timeout}).toBe(status);}
  for(const [i,text] of run.replies.entries()){
   await waitStatus('reply');await expect(page.locator('.message')).toHaveCount(i*2+1);
   const input=page.getByLabel('Your reply',{exact:true});await expect(input).toBeEnabled();
   await expect(input).toHaveValue('');
   if(i===0){await input.dispatchEvent('paste');await expect(input).toHaveValue('');await expect(page.getByRole('status').filter({hasText:'Paste is blocked'})).toBeVisible();}
   await input.pressSequentially(text);await expect(input).toHaveValue(text);
   await page.getByRole('button',{name:'Send reply'}).click();
   await expect.poll(async()=>(await state()).messages.filter(m=>m.role==='fresher').length,{timeout:15000}).toBe(i+1);
  }
  await waitStatus('complete',180000);await expect(page).toHaveURL(/\/result\//);
  const result=await state();expect(result.caseId).toBe(run.id);
  await expect(page.locator('.score')).toHaveCount(result.ticket.skills.length);
  expect(result.messages.filter(m=>m.role==='fresher').map(m=>m.text)).toEqual(run.replies);
  const previousQuestions=new Set();
  for(const m of result.messages.filter(m=>m.role==='customer')){
   expect(m.text).not.toContain('\n');
   const sentences=(m.text.match(/[.!?](?:["']?\s|["']?$)/g)??[]).length;
   expect(sentences).toBeGreaterThanOrEqual(1);expect(sentences).toBeLessThanOrEqual(3);
   expect(m.text).not.toMatch(/expected total|should return|count should|must stop|valid non-negative|if asked|10:01:|prices=\[|types=\[|convert each price|case-insensitive lookup/i);
   for(const question of m.text.match(/[^.!?]*\?/g)??[]){expect(previousQuestions.has(question.trim())).toBe(false);previousQuestions.add(question.trim());}
  }
  if(run.id==='SWE-1'){
   const lastSenior=result.messages.filter(m=>m.role==='customer').at(-1).text;
   expect(lastSenior).toContain("I don't have an observed record");expect(lastSenior).not.toContain('C41');
  }
  for(const g of result.caseGrade){expect(run.replies).toContain(g.quote);expect(g.score).toBeGreaterThanOrEqual(1);expect(g.score).toBeLessThanOrEqual(10);}
  const prefix=`${live?'live':'local'}-${run.id.toLowerCase()}-recovery`;
  writeFileSync(`proof/${prefix}-result.json`,JSON.stringify(result,null,2),'utf8');
  writeFileSync(`proof/${prefix}-chat.txt`,await page.locator('.messages').innerText(),'utf8');
  writeFileSync(`proof/${prefix}-score.txt`,await page.locator('.scores').innerText(),'utf8');
  await page.screenshot({path:`proof/${prefix}-result.png`,fullPage:true});
  const guest=await browser.newContext();const shared=await guest.newPage();await shared.goto(`${base}/result/${token}`);await expect(shared.locator('.score')).toHaveCount(result.ticket.skills.length);await expect(shared.locator('.message')).toHaveCount(run.replies.length*2);await guest.close();
  console.log(`${run.id} graded: ${result.caseGrade.map(g=>`${g.label} ${g.score}/10`).join('; ')}\nResult URL: ${base}/result/${token}`);
  if(caseIndex<cases.length-1)await page.getByRole('button',{name:'Next case',exact:false}).click();
  else{await expect(page.locator('.role-results')).toContainText('3 of 3 cases completed');expect(result.roleScore).not.toBeNull();}
 }
 if(errors.length)throw Error(errors.join('\n'));
 await context.close();
}finally{await browser.close();}
