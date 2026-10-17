import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
mkdirSync('proof',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',err=>errors.push(err.message));
try{
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Start practice'}).waitFor();
 await page.locator('.facts').getByText(/raita \(₹60\)/).waitFor();await page.getByLabel('Your name',{exact:true}).fill('Test Fresher');
 await page.screenshot({path:'proof/factsheet.png',fullPage:true});
 await page.getByRole('button',{name:'Start practice'}).click();
 await page.getByRole('alert').filter({hasText:'Grading unavailable, try again'}).waitFor({timeout:60000});
 if(await page.locator('.score').count())throw new Error('Unexpected scores on failed AI request');
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Grading unavailable, try again'}).waitFor({timeout:60000});
 await page.screenshot({path:'proof/ai-unavailable.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173');
 await page.locator('.facts').getByText(/raita \(₹60\)/).waitFor();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw new Error('Mobile layout overflows');
 await page.screenshot({path:'proof/mobile.png',fullPage:true});
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('PASS: fact sheet rupees, Start, real missing-key failure, retry, no fake scores, mobile width, no browser errors.');
}finally{await browser.close();}
