import {chromium,expect} from '@playwright/test';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const live=process.argv.includes('--live');
const base=live?'https://affable-gerbil-821.convex.site':'http://127.0.0.1:5173';
const publicUrl=live?'https://affable-gerbil-821.convex.cloud':readFileSync('.env.local','utf8').match(/^VITE_CONVEX_URL=(.+)$/m)?.[1].trim();
const opening="Since the 10 am release, some users get 'Account not found' on login. Tickets are piling up and I need an update by 1 pm. Can you look into it?";
const trap='Users are locked out, so just send password reset links to everyone affected. Do it now.';
const expectedCode='function login(emailTyped, password) {\n  const email = emailTyped.toLowerCase();\n  const user = db.findUserByEmail(email);\n  if (!user) return "Account not found";\n  if (!checkPassword(user, password)) return "Wrong password";\n  return "Login success";\n}';
let visibleSheet='';
const client=new ConvexHttpClient(publicUrl);const browser=await chromium.launch({channel:'chrome',headless:true});mkdirSync('proof',{recursive:true});
const runs={
 weak:[
 'Yes, Kavya. I will send password reset links to everyone affected right now.',
 'It is a login issue, so their passwords must be broken. Resetting them should fix it.',
 'I agree. I will resend the password reset links and ask everyone to set a new password.',
 'No need to investigate the release first. Password resets are the fastest solution.',
 'I will tell support the users need to reset their passwords and try again.',
 'If the reset does not work, I will roll back the release. I have not checked what changed.',
 'I still think passwords are the problem. Let us send another batch of reset links.',
 'For the manager update, I will say we are fixing this by resetting all affected passwords.'
 ],
 strong:[
 'Before proposing any fix, can you share the failed-login logs and exact error messages?',
 'What changed in the 10 am release, especially in the login function?',
 'Which users are affected? Can you show a failing saved email and compare it with users who can log in?',
 'The new line lowercases the typed email, but Ravi.K@gmail.com is still saved with capitals. The exact search for ravi.k@gmail.com finds nothing. The password is never checked.',
 'Make the email search ignore capitals by comparing both saved and typed emails in lowercase. Password resets will not help because the account lookup fails before checking the password.',
 'In plain words: this morning we started searching with small letters, but some saved emails have capitals. The system needs the same spelling to find them. We will make the search ignore capitals.',
 'A rollback can be a short-term stopgap for this capital-letter mismatch, but the proper fix is case-insensitive lookup. Long term, convert all saved emails to lowercase once.',
 'I will test both mixed-case and lowercase saved emails, and confirm wrong passwords still fail. For your 1 pm update: the cause, the proper search fix, test results and rollout status.'
 ]
};
try{
 for(const [name,replies] of Object.entries(runs).filter(([name])=>!process.argv.includes('--strong-only')||name==='strong')){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.getByLabel('Your name',{exact:true}).fill(name==='weak'?'Weak fresher test':'Strong fresher test');
 await expect(page.getByRole('button',{name:'Start practice'})).toBeEnabled();
 visibleSheet=await page.locator('.facts').evaluate(el=>[...el.children].map(e=>e.textContent==='\u00a0'?'':e.textContent).join('\n'));
 for(const hidden of ['CORRECT OUTCOME','TRAP','STRONG ANSWER','WEAK ANSWERS','GRADER CHECKS'])expect(visibleSheet).not.toContain(hidden);
 await expect(page.getByRole('button',{name:'QuickBite · Customer support',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Login bug · Junior software engineer',exact:true}).click();
 await expect(page.locator('.start-code code')).toContainText('emailTyped.toLowerCase()');expect(await page.locator('.start-code code').textContent()).toBe(expectedCode);
 await expect(page.locator('.chips')).toContainText('3 minutes per reply');
 await expect(page.locator('body')).not.toContainText('Handled v1');await expect(page.locator('main')).not.toContainText('Ravi.K@gmail.com');
 if(name==='weak'){await page.screenshot({path:'proof/kavya-start.png',fullPage:true});await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile page overflows');const m=await page.locator('.start-code pre').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,height:el.clientHeight,scrollHeight:el.scrollHeight}));expect(m.scrollWidth).toBeLessThanOrEqual(m.width+1);expect(m.scrollHeight).toBeLessThanOrEqual(m.height+1);await page.screenshot({path:'proof/kavya-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});}
 await page.getByRole('button',{name:'Start practice'}).click();await expect(page).toHaveURL(/\/practice\//);const token=new URL(page.url()).pathname.split('/').at(-1);
 writeFileSync(`proof/kavya-${name}-token.txt`,token);
 expect(await page.locator('.code-sheet code').textContent()).toBe(expectedCode);
 await expect(page.locator('body')).not.toContainText('Handled v1');
 const state=()=>client.query(anyApi.sessions.get,{token});
 async function waitStatus(target,timeout=90000){await expect.poll(async()=>{const s=await state();if(s?.status==='error')throw new Error(`Grading unavailable, try again (${s.errorStage})`);return s?.status;},{timeout}).toBe(target);}
 for(let i=0;i<8;i++){
 await waitStatus('reply');const s=await state();const latest=s.messages.at(-1).text;
 // Live disclosure and trap timing checks.
 if(i===0)expect(latest).toBe(opening);
 if(name==='weak'&&i===1)expect(latest).toContain(trap);
 if(name==='strong'&&i===1)expect(latest.split(/\n\n(?=Logs:|Last change:|Who is affected:)/)[0]).not.toMatch(/password|reset/i);
 if(name==='strong'&&i===2)expect(latest).toContain(trap);
 if(name==='weak'&&/Logs:|Last change:|Who is affected:|Ravi\.K|capital|lowercase|wrong password/i.test(latest))throw new Error('Kavya volunteered an unrequested clue');
 if(name==='strong'){
 if(i===0&&/Logs:|Last change:|Who is affected:|Ravi\.K|capital|lowercase|wrong password/i.test(latest))throw new Error('Opening leaked a clue');
 if(i===1){if(!latest.includes('Logs:'))throw new Error('Logs question not answered');if(/Last change:|Who is affected:|Ravi\.K/.test(latest))throw new Error('Unrequested clue leaked with logs');}
 if(i===2){if(!latest.includes('Last change:'))throw new Error('Last-change question not answered');if(/Who is affected:|Ravi\.K/.test(latest))throw new Error('Affected users volunteered');}
 if(i===3&&!latest.includes('Who is affected:'))throw new Error('Affected-users question not answered');
 }
 const input=page.getByLabel('Your reply');await expect(input).toBeEnabled();await expect(input).toHaveAttribute('placeholder','Ask a question or suggest a fix');
 const seconds=parseInt(await page.getByRole('timer').innerText());expect(seconds).toBeGreaterThan(160);expect(seconds).toBeLessThanOrEqual(180);
 if(i===0){await input.dispatchEvent('paste');await expect(page.getByRole('status').filter({hasText:'Paste is blocked'})).toBeVisible();await expect(input).toHaveValue('');}
 if(i===3)await page.screenshot({path:`proof/kavya-${name}-practice.png`,fullPage:true});
 await input.pressSequentially(replies[i]);await page.getByRole('button',{name:'Send reply'}).click();
 await expect.poll(async()=>{const s=await state();return s?.messages.filter(m=>m.role==='fresher').length;},{timeout:10000}).toBe(i+1);
 }
 await waitStatus('complete',240000);await expect(page).toHaveURL(/\/result\//);await expect(page.locator('.score')).toHaveCount(4);
 const s=await state();if(s.messages.length!==16||s.messages.some(m=>m.role==='fresher'&&typeof m.responseMs!=='number'))throw new Error('Missing transcript or timings');
 for(const g of Object.values(s.bugGrade)){if(!s.messages.some(m=>m.role==='fresher'&&m.text===g.quote))throw new Error('Grader quote differs from transcript');}
 let output=`${name.toUpperCase()} FRESHER — KAVYA\nResult URL: ${base}/result/${token}\n\n`;
 for(const m of s.messages)output+=`${m.role==='customer'?'Kavya':'Fresher'}${m.role==='fresher'?` (response time: ${m.responseMs} ms)`:''}:\n${m.text}\n\n`;
 output+=`GRADER OUTPUTS (VERBATIM)\n${s.graderRaw}\n`;writeFileSync(`proof/kavya-${name}-chat.txt`,output,'utf8');console.log(output);
 await page.screenshot({path:`proof/kavya-${name}-result.png`,fullPage:true});
 const guest=await browser.newContext();const shared=await guest.newPage();await shared.goto(`${base}/result/${token}`);await expect(shared.locator('.score')).toHaveCount(4);await expect(shared.locator('.message')).toHaveCount(16);await guest.close();
 if(errors.length)throw new Error(errors.join('\n'));await context.close();
 }
 // Existing QuickBite result still renders three grades and all original lines.
 console.log(`KAVYA FIRST MESSAGE (VERBATIM)\n${opening}\n\nVISIBLE QUICKBITE FACT SHEET (VERBATIM)\n${visibleSheet}`);
 const old=readFileSync(live?'proof/production-quickbite-grader.txt':'proof/strong-chat.txt','utf8').match(/Result URL: (.+)/i)?.[1];if(old){const p=await browser.newPage();await p.goto(old);await expect(p.locator('.score')).toHaveCount(3);await expect(p.locator('.message')).toHaveCount(16);await expect(p.locator('.code-sheet')).toHaveCount(0);await p.close();}
}finally{await browser.close();}
