import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const id of ['SWE-1','DATA-1']){
  const prefix=id.toLowerCase();const token=readFileSync(`proof/${prefix}-role-token.txt`,'utf8').trim();
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const frames=[];page.on('websocket',s=>s.on('framereceived',e=>frames.push(String(e.payload))));
  await page.goto(`${base}/result/${token}`);
  await expect(page.locator('.score')).toHaveCount(2);await expect(page.locator('.message')).toHaveCount(6);
  await expect(page.locator('.chat-title .eyebrow')).toHaveText(`${id} · CASE 1 OF ${id==='SWE-1'?3:2}`);
  await expect(page.getByRole('button',{name:'Next case ↗',exact:true})).toBeVisible();
  const body=await page.locator('body').innerText();
  if(/ROOT CAUSE|GRADER CHECKS|AI AND GRADER ONLY|Clue 1 -/.test(body)||frames.some(f=>/PRIVATE DIAGNOSIS|GRADER CHECKS|AI AND GRADER ONLY/.test(f)))throw Error('Private ticket material reached the browser');
  writeFileSync(`proof/${prefix}-role-weak-chat.txt`,await page.locator('.messages').innerText(),'utf8');
  writeFileSync(`proof/${prefix}-role-weak-result-page.txt`,body,'utf8');
  await page.screenshot({path:`proof/${prefix}-role-weak-result.png`,fullPage:true});
  await page.getByRole('button',{name:'Next case ↗',exact:true}).click();
  await expect(page.locator('.paper-label')).toHaveText(id==='SWE-1'?'SWE-2':'DATA-2');
  const next=readFileSync(`${id==='SWE-1'?'SWE-2':'DATA-2'}.md`,'utf8').replace(/\r\n/g,'\n');
  await expect(page.locator('.role-box p').first()).toHaveText(next.split('ROLE CONTEXT\n')[1].split('\n\n')[0]);
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`proof/${prefix}-role-next-mobile.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto(base);
  await page.getByRole('button',{name:id==='SWE-1'?'Software engineer':'Junior data engineer',exact:true}).click();
  await expect(page.locator('.paper-label')).toHaveText(id);
  await expect(page.locator('main')).not.toContainText('You?ve');
  await page.screenshot({path:`proof/${prefix}-role-start-mobile.png`,fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:`proof/${prefix}-role-start.png`,fullPage:true});
  console.log(`${id}: refreshed the same saved chat and result; no replay. ${base}/result/${token}`);
  await page.close();
 }
}finally{await browser.close();}
