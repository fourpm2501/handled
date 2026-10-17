import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
const base='http://127.0.0.1:5173';
const cloud=readFileSync('.env.local','utf8').match(/^VITE_CONVEX_URL=(.+)$/m)?.[1].trim();
if(!cloud?.includes('small-manatee-504'))throw Error('This check requires the development backend');
const client=new ConvexHttpClient(cloud);
const browser=await chromium.launch({channel:'chrome',headless:true});
mkdirSync('proof',{recursive:true});
const runs=[
 {id:'SWE-1',role:'Software engineer',next:'SWE-2',replies:[
  'Just remove the zero at the front and let checkout continue.',
  'Yes, trim the first character. If there are no warnings, the calculation must be fine.',
  'I have not checked the detailed records. I would leave the calculation alone and change only the displayed text.',
 ]},
 {id:'DATA-1',role:'Junior data engineer',next:'DATA-2',replies:[
  'Mark the pending orders as delivered so the counts agree.',
  'Yes, change the statuses. I do not need to compare the rows or the query.',
  'I would just subtract two from the count every day and leave the query as it is.',
 ]},
];
try{
 for(const run of runs){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const frames=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('websocket',socket=>socket.on('framereceived',e=>frames.push(String(e.payload))));
  await page.goto(base);
  await expect(page.getByRole('group',{name:'Choose your role'}).getByRole('button')).toHaveCount(2);
  await expect(page.getByRole('button',{name:/QuickBite/})).toHaveCount(0);
  await page.getByRole('button',{name:run.role,exact:true}).click();
  await expect(page.locator('.paper-label')).toHaveText(run.id);
  const source=readFileSync(`${run.id}.md`,'utf8').replace(/\r\n/g,'\n');
  const contextText=source.split('ROLE CONTEXT\n')[1].split('\n\n')[0];
  await expect(page.locator('.role-box p').first()).toHaveText(contextText);
  await expect(page.locator('.chips')).toContainText('5 minutes total');
  await expect(page.locator('.chips')).toContainText('3 student replies');
  await page.getByLabel('Your name',{exact:true}).fill(`${run.id} weak local test`);
  await page.screenshot({path:`proof/${run.id.toLowerCase()}-role-start.png`,fullPage:true});
  await page.getByRole('button',{name:'Start practice',exact:false}).click();
  await expect(page).toHaveURL(/\/practice\//);
  const token=new URL(page.url()).pathname.split('/').at(-1);
  writeFileSync(`proof/${run.id.toLowerCase()}-role-token.txt`,token,'utf8');
  const state=()=>client.query(anyApi.sessions.get,{token});
  async function waitStatus(target,timeout=90000){await expect.poll(async()=>{const s=await state();if(s?.status==='error')throw Error(`${run.id}: AI unavailable at ${s.errorStage}`);return s?.status;},{timeout}).toBe(target);}
  for(let i=0;i<run.replies.length;i++){
   await waitStatus('reply');
   const input=page.getByLabel('Your reply',{exact:true});
   await expect(input).toBeEnabled();
   const seconds=parseInt(await page.getByRole('timer').innerText());
   expect(seconds).toBeGreaterThan(180);expect(seconds).toBeLessThanOrEqual(300);
   if(i===0){
    const before=(await state()).deadlineAt;
    await page.reload();await expect(input).toBeEnabled();expect((await state()).deadlineAt).toBe(before);
    await input.dispatchEvent('paste');await expect(page.getByRole('status').filter({hasText:'Paste is blocked'})).toBeVisible();await expect(input).toHaveValue('');
    await input.dispatchEvent('drop');await expect(page.getByRole('status').filter({hasText:'Dropping text is blocked'})).toBeVisible();await expect(input).toHaveValue('');
   }
   await input.pressSequentially(run.replies[i]);
   await page.getByRole('button',{name:'Send reply'}).click();
   await expect.poll(async()=>(await state()).messages.filter(m=>m.role==='fresher').length,{timeout:10000}).toBe(i+1);
  }
  await waitStatus('complete',180000);await expect(page).toHaveURL(/\/result\//);
  await expect(page.locator('.score')).toHaveCount(2);await expect(page.locator('.message')).toHaveCount(6);
  await expect(page.locator('.role-results')).toContainText(`1 of ${run.id==='SWE-1'?3:2} cases completed`);
  const result=await state();
  expect(result.caseId).toBe(run.id);expect(result.messages.filter(m=>m.role==='fresher').map(m=>m.text)).toEqual(run.replies);
  const skills=source.match(/^SKILLS TESTED: (.+)$/m)[1].split('; ');
  expect(result.caseGrade.map(g=>g.label)).toEqual(skills);
  for(const g of result.caseGrade){expect(run.replies).toContain(g.quote);expect(g.score).toBeLessThanOrEqual(4);}
  for(const m of result.messages)if(m.role==='fresher')expect(typeof m.responseMs).toBe('number');
  const hidden=/AI-only behaviour|AI AND GRADER ONLY|CLUES \(revealed|ROOT CAUSE\n|RIGHT FIX\n|GRADER CHECKS|STRONG ANSWER\n|WEAK ANSWERS\n|NON-CODER EXPLANATION/;
  if(frames.some(f=>hidden.test(f.replaceAll('\\n','\n')))||hidden.test(JSON.stringify(result).replaceAll('\\n','\n')))throw Error('Hidden ticket section reached the browser');
  if(run.id==='SWE-1'&&result.messages.some(m=>m.role==='customer'&&/10:01:00.116|approved expected amount|types=\[text/.test(m.text)))throw Error('Unrequested log evidence leaked');
  if(run.id==='DATA-1'&&result.messages.some(m=>m.role==='customer'&&/\(1, '2026|AND status|query filters the day/.test(m.text)))throw Error('Unrequested SQL evidence leaked');
  writeFileSync(`proof/${run.id.toLowerCase()}-role-weak-result.json`,JSON.stringify(result,null,2),'utf8');
  const chat=await page.locator('.messages').innerText();
  const resultPage=await page.locator('body').innerText();
  writeFileSync(`proof/${run.id.toLowerCase()}-role-weak-chat.txt`,chat,'utf8');
  writeFileSync(`proof/${run.id.toLowerCase()}-role-weak-result-page.txt`,resultPage,'utf8');
  await page.screenshot({path:`proof/${run.id.toLowerCase()}-role-weak-result.png`,fullPage:true});
  const guest=await browser.newContext();const shared=await guest.newPage();
  await shared.goto(`${base}/result/${token}`);await expect(shared.locator('.score')).toHaveCount(2);await expect(shared.locator('.message')).toHaveCount(6);await guest.close();
  await page.getByRole('button',{name:'Next case',exact:false}).click();
  await expect(page.locator('.paper-label')).toHaveText(run.next);
  const nextSource=readFileSync(`${run.next}.md`,'utf8').replace(/\r\n/g,'\n');
  await expect(page.locator('.role-box p').first()).toHaveText(nextSource.split('ROLE CONTEXT\n')[1].split('\n\n')[0]);
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`proof/${run.id.toLowerCase()}-role-next-mobile.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`${run.id}: genuine weak chat completed, two skill grades, shared result and next-case preview checked.\nResult URL: ${base}/result/${token}`);
  await context.close();
 }
 const legacy=readFileSync('proof/strong-chat.txt','utf8').match(/Result URL: (.+)/i)?.[1];
 if(legacy){const page=await browser.newPage();await page.goto(legacy.replace(new URL(legacy).origin,base));await expect(page.locator('.score')).toHaveCount(3);await expect(page.locator('.message')).toHaveCount(16);await page.close();console.log('Old development QuickBite result still opens with its three scores and full conversation.');}
}finally{await browser.close();}
