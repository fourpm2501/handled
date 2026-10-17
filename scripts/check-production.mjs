import {chromium,expect} from '@playwright/test';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
import {mkdirSync,writeFileSync} from 'node:fs';
const live='https://affable-gerbil-821.convex.site';
const client=new ConvexHttpClient('https://affable-gerbil-821.convex.cloud');
const replies=[
 'I’m sorry your family waited. I can refund ₹60 for the missing raita and ₹40 delivery fee, plus offer a ₹150 coupon.',
 'A full ₹1,200 refund and ₹500 cash need a manager. I’ll escalate both requests; you’ll hear back within 24 hours.',
 'I have no record of that earlier promise, so I cannot confirm it. The manager will review it within 24 hours.',
 'Cold food is a quality complaint, not damage. I’ll log a complaint against the restaurant.',
 'I can provide ₹100 refunded and one ₹150 next-order coupon right away.',
 'I understand your family’s frustration. The full-refund and cash requests need manager review within 24 hours.',
 'I can offer the permitted refunds now. I cannot approve a full refund or cash myself.',
 'To confirm: ₹60 raita refund, ₹40 delivery fee refund, one ₹150 coupon, and a restaurant complaint. The manager will review your other requests within 24 hours.'
];
mkdirSync('proof',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(live);if(!response?.ok())throw new Error('Live homepage did not load');
 await expect(page.getByRole('button',{name:'QuickBite · Customer support',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('button',{name:'Start practice'})).toBeDisabled();await expect(page.getByLabel('Your name',{exact:true})).toHaveAttribute('required','');
 await page.getByLabel('Your name',{exact:true}).fill('Name field test');await expect(page.getByRole('button',{name:'Start practice'})).toBeEnabled();
 await page.screenshot({path:'proof/production-home.png',fullPage:true});
 await page.getByRole('button',{name:'Start practice'}).click();await expect(page).toHaveURL(/\/practice\//);
 const token=new URL(page.url()).pathname.split('/').at(-1);
 const state=()=>client.query(anyApi.sessions.get,{token});
 async function waitStatus(wanted,timeout=90000){await expect.poll(async()=>{const s=await state();if(s?.status==='error')throw new Error('Grading unavailable, try again');return s?.status;},{timeout}).toBe(wanted);}
 for(let i=0;i<replies.length;i++){
 await waitStatus('reply');const input=page.getByLabel('Your reply');await expect(input).toBeEnabled();
 if(i===0){await input.dispatchEvent('paste');await expect(page.getByRole('status').filter({hasText:'Paste is blocked'})).toBeVisible();await expect(input).toHaveValue('');}
 await input.pressSequentially(replies[i]);await page.getByRole('button',{name:'Send reply'}).click();
 await expect.poll(async()=>(await state())?.messages.filter(m=>m.role==='fresher').length,{timeout:10000}).toBe(i+1);
 }
 await waitStatus('complete',180000);await expect(page).toHaveURL(/\/result\//);await expect(page.locator('.score')).toHaveCount(3);
 const result=await state();if(result.messages.length!==16||result.messages.some(m=>m.role==='fresher'&&typeof m.responseMs!=='number'))throw new Error('Missing chat or timings');
 expect(result.name).toBe('Name field test');await expect(page.locator('.result-name')).toHaveText('Name field test');
 await page.screenshot({path:'proof/production-result.png',fullPage:true});
 const guest=await browser.newContext();const shared=await guest.newPage();await shared.goto(`${live}/result/${token}`);await expect(shared.locator('.score')).toHaveCount(3);await expect(shared.locator('.message')).toHaveCount(16);await expect(shared.locator('.result-name')).toHaveText('Name field test');await guest.close();
 if(errors.length)throw new Error(errors.join('\n'));
 const output=`Live URL: ${live}\nResult URL: ${live}/result/${token}\n\n${result.graderRaw}\n`;
 writeFileSync('proof/production-quickbite-grader.txt',output,'utf8');writeFileSync('proof/production-quickbite-chat.json',JSON.stringify(result,null,2),'utf8');console.log(output);
}finally{await browser.close();}
