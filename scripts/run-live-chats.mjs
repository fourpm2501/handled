import {chromium,expect} from '@playwright/test';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// Read ONLY the public Convex URL, never a key or shell environment.
const url=readFileSync('.env.local','utf8').match(/^VITE_CONVEX_URL=(.+)$/m)?.[1].trim();
if(!url)throw new Error('Public Convex URL missing');
const client=new ConvexHttpClient(url);const browser=await chromium.launch({channel:'chrome',headless:true});
mkdirSync('proof',{recursive:true});
const runs={
 weak:[
 'Sorry sir. I confirm the last agent promised you this. I will refund the full ₹1,200 and give you ₹500 cash immediately.',
 'Yes sir, whatever you want. The cold biryani is damaged, so the whole order will be refunded.',
 'You are right. We will give you the cash as promised. No manager is needed.',
 'I agree with everything you said. I guarantee ₹1,200 plus ₹500 cash today.',
 'Yes sir, I will do it. Please do not give us a bad review.',
 'You can have any extra compensation you want. I approve it myself.',
 'Everything is approved. You do not need to wait for a manager.',
 'Your full refund and ₹500 cash are confirmed. Sorry for the trouble.'
 ],
 strong:[
 'I’m sorry your family waited 45 minutes beyond our promise. I can refund ₹60 for the missing raita and ₹40 delivery fee, plus offer a ₹150 coupon.',
 'I understand why you’re upset. A full ₹1,200 refund and ₹500 cash need a manager. I’ll escalate both requests; you’ll hear back within 24 hours.',
 'I don’t have a record of that earlier promise, so I cannot confirm it. I’ll ask the manager to review it and respond within 24 hours.',
 'Cold food is a quality complaint, not damage under the sheet. I can log a restaurant complaint and offer the ₹150 coupon; I cannot refund the biryani myself.',
 'I’m sorry the children’s dinner was spoiled. The ₹60 raita and ₹40 delivery fee refunds are available right away, with one ₹150 next-order coupon.',
 'I hear your frustration. I cannot approve cash or a full order refund myself. Those requests are with the manager, who will respond within 24 hours.',
 'The agent-approved offer is ₹100 refunded and a ₹150 coupon. I’ll log the cold-food complaint and keep the full-refund and cash requests escalated.',
 'To confirm: ₹60 raita refund, ₹40 delivery fee refund, one ₹150 coupon, and a restaurant complaint. A manager will review your other requests within 24 hours.'
 ]
};
try{
 for(const [name,replies] of Object.entries(runs)){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 await page.goto('http://127.0.0.1:5173');await page.getByLabel('Your name',{exact:true}).fill(name==='weak'?'Weak fresher test':'Strong fresher test');await page.getByRole('button',{name:'Start practice'}).click();
 await expect(page).toHaveURL(/\/practice\//);const token=new URL(page.url()).pathname.split('/').at(-1);
 const ensureReply=async()=>{await expect.poll(async()=>{const s=await client.query(anyApi.sessions.get,{token});if(s?.status==='error')throw new Error('Grading unavailable, try again');return s?.status;},{timeout:60000}).toBe('reply');await expect(page.getByLabel('Your reply')).toBeEnabled();};
 for(let i=0;i<8;i++){
 await ensureReply();const input=page.getByLabel('Your reply');
 if(i===0){await input.dispatchEvent('paste');await expect(page.getByRole('status').filter({hasText:'Paste is blocked'})).toBeVisible();await expect(input).toHaveValue('');}
 await input.pressSequentially(replies[i]);await page.getByRole('button',{name:'Send reply'}).click();
 await expect.poll(async()=>{const s=await client.query(anyApi.sessions.get,{token});return s?.messages.filter(m=>m.role==='fresher').length;},{timeout:10000}).toBe(i+1);
 }
 await expect.poll(async()=>{const s=await client.query(anyApi.sessions.get,{token});if(s?.status==='error')throw new Error('Grading unavailable, try again');return s?.status;},{timeout:180000}).toBe('complete');
 await expect(page).toHaveURL(/\/result\//);await expect(page.locator('.score')).toHaveCount(3);
 const s=await client.query(anyApi.sessions.get,{token});
 if(s.messages.length!==16 || s.messages.some(m=>m.role==='fresher'&&typeof m.responseMs!=='number'))throw new Error('Transcript or timing missing');
 let out=`${name.toUpperCase()} FRESHER\nLocal result URL: http://127.0.0.1:5173/result/${token}\n\n`;
 for(const m of s.messages)out+=`${m.role==='customer'?'Ramesh uncle':'Fresher'}${m.role==='fresher'?` (response time: ${m.responseMs} ms)`:''}:\n${m.text}\n\n`;
 out+=`GRADER OUTPUTS (VERBATIM)\n${s.graderRaw}\n`;
 writeFileSync(`proof/${name}-chat.txt`,out,'utf8');console.log(out);
 await page.screenshot({path:`proof/${name}-result.png`,fullPage:true});
 // Verify the shareable result can be read from a fresh browser with no login.
 const guest=await browser.newContext();const shared=await guest.newPage();await shared.goto(`http://127.0.0.1:5173/result/${token}`);await expect(shared.locator('.score')).toHaveCount(3);await expect(shared.locator('.message')).toHaveCount(16);await guest.close();await context.close();
 }
}finally{await browser.close();}
