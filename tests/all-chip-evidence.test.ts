import {convexTest} from 'convex-test';
import {it,expect} from 'vitest';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {publicTicket,ticketParts} from '../convex/ticketRules';
import type {CaseId} from '../convex/ticketRules';
import {getQuestionChips} from '../src/questionChips';
const modules=import.meta.glob('../convex/**/*.*s');
const expected:Record<CaseId,string[]>={
 'SWE-1':[
  'prices = ["100","50"]',
  '10:01:00.110 C41 prices_loaded prices=["100","50"] types=[text,text]\n10:01:00.115 C41 total_started value=0 type=number\n10:01:00.116 C41 item_added value="0100" type=text\n10:01:00.117 C41 item_added value="010050" type=text',
  'let total = 0;\nfor (const price of prices) {\n  total += price;\n}\nshowTotal(total);',
 ],
 'SWE-2':[
  'GET /tickets?status=open&assigned=true',
  'Reply: 200 (the request worked).\nHelp request returned: 101, open, given to Asha.\nTotal shown: 1.',
  'status=open includes only open tickets; assigned=true includes those with an owner; assigned=false includes only unassigned ones. Omitting assigned includes both. GET changes no record.',
 ],
 BUGTICKET:[
  'failed_login.error = "Account not found"\n"Wrong password" in supplied failures = none',
  '+ const email = emailTyped.toLowerCase();',
  'Failing: Ravi.K@gmail.com, Priya.S@yahoo.com. Working: ravi@gmail.com, anil.k@gmail.com.',
 ],
 'DATA-1':[
  "(1, '2026-10-14', 'delivered')\n(2, '2026-10-14', 'delivered')\n(3, '2026-10-14', 'cancelled')\n(4, '2026-10-14', 'pending')\n(5, '2026-10-13', 'delivered')",
  "SELECT COUNT(*) AS delivered_orders\nFROM orders\nWHERE order_day = '2026-10-14';",
  'Current query returns four',
 ],
 'DATA-3':[
  'Paid orders for 2026-10-14\norder_id,customer_code,amount_rupees\nO1,"0012",100\nO2,"0013",50\nBefore join: 150\nAfter join: North 200; South 50',
  'Original CSV\ncustomer_code,region\n0012,North\n0012,North\n0013,South\n\nLoaded region_upload rows\ncustomer_code,region\n0012,North\n0012,North\n0013,South',
  "SELECT r.region, SUM(o.amount_rupees) AS sales_rupees\nFROM orders o\nLEFT JOIN region_upload r ON r.customer_code = o.customer_code\nWHERE o.order_day = '2026-10-14' AND o.status = 'paid'\nGROUP BY r.region;",
 ],
 'DATA-2':[
  'customer_code,name\n0012,Asha\n0100,Ravi',
  'import pandas as pd\ncustomers = pd.read_csv("customers.csv")\ncustomers["customer_code"] = customers["customer_code"].astype(str)\nprint(customers[["customer_code", "name"]])',
  'customer_code\n"12"\n"100"',
 ],
};
for(const caseId of Object.keys(expected) as CaseId[]){
 for(const [index,chip] of getQuestionChips(caseId).entries()){
  it(`${caseId}: ${chip.label} returns its exact evidence on the first AND final reply`,async()=>{
   const t=convexTest(schema,modules);const ticket=publicTicket(caseId);const owner='evidence-test-owner-123456789012345';
   for(const priorReplies of [0,ticket.maxReplies-1]){
    const messages:{role:'customer'|'fresher';text:string;at:number}[]=[];
    for(let i=0;i<priorReplies;i++)messages.push({role:'customer',text:'What will you check?',at:Date.now()},{role:'fresher',text:'I am still investigating.',at:Date.now()});
    messages.push({role:'customer',text:'What will you check?',at:Date.now()});
    const token=`${caseId}-${index}-${priorReplies}`;const deadlineAt=Date.now()+ticket.timeLimitMs;
    const id=await t.run(ctx=>ctx.db.insert('sessions',{token,owner,caseId,roleId:ticket.roleId,scenario:'bugticket',factsheet:ticketParts(caseId).source,status:'reply',deadlineAt,replyStartedAt:Date.now(),messages}));
    const turn=messages.length;await t.mutation(api.sessions.reply,{token,owner,text:chip.question,turn});
    const saved=(await t.run(ctx=>ctx.db.get(id)))!;const reply=saved.messages.at(-1)!;
    expect(reply.role).toBe('customer');expect(reply.text.split('```')[1]).toBe('\n'+expected[caseId][index]+'\n');
    expect(reply.text).not.toMatch(/I don't have an observed record|GRADER CHECKS|ROOT CAUSE|STRONG ANSWER|RIGHT FIX|CLUES \(/);
    expect(saved.messages.filter(m=>m.role==='fresher')).toHaveLength(priorReplies+1);
    expect(saved.deadlineAt).toBe(deadlineAt);expect(saved.status).toBe(priorReplies===0?'reply':'grading');
    expect(saved.caseGrade).toBeUndefined();expect(saved.grade).toBeUndefined();expect(saved.bugGrade).toBeUndefined();
    await t.mutation(api.sessions.reply,{token,owner,text:chip.question,turn});
    expect((await t.run(ctx=>ctx.db.get(id)))!.messages).toEqual(saved.messages);
   }
  });
 }
}
