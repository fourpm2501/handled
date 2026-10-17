import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
import {ROLE_CASES,ticketParts} from '../convex/ticketRules';
import {caseTeaser} from '../convex/caseTeaser';
import CaseTeaser from '../src/CaseTeaser';
const modules=import.meta.glob('../convex/**/*.*s');
for(const role of ['software','data'] as const){
 for(const [index,caseId] of ROLE_CASES[role].entries()){
  it(`${caseId}: hands over only the next public symptom and leaves the saved result unchanged`,async()=>{
   const other=role==='software'?'data':'software';
   const next=ROLE_CASES[role][index+1];
   const target=next??ROLE_CASES[other][0];
   const teaser=caseTeaser(caseId);
   const symptom=ticketParts(target).scenario;
   expect(teaser.message).toContain(symptom);
   expect(teaser.message).toBe(next?`Something new just came in: ${symptom} Want to take it?`:`You've handled the ${role==='software'?'software':'data'} desk. ${symptom} Try ${other==='data'?'Junior Data Engineer':'Junior Software Engineer'}?`);
   expect(teaser.rolePath).toBe(next?null:`/role/${other}`);
   expect(teaser.buttonLabel).toBe(next?'Take the next ticket':`Try ${other==='data'?'Junior Data Engineer':'Junior Software Engineer'}`);
   const t=convexTest(schema,modules);
   const id=await t.run(ctx=>ctx.db.insert('sessions',{token:caseId,owner:'unchanged-owner',name:'Student',caseId,roleId:role,factsheet:ticketParts(caseId).source,status:'reply',messages:[]}));
   expect((await t.query(api.sessions.get,{token:caseId}))!.teaser).toBeNull();
   await t.run(ctx=>ctx.db.patch(id,{status:'complete'}));
   const before=await t.run(ctx=>ctx.db.get(id));
   expect((await t.query(api.sessions.get,{token:caseId}))!.teaser).toEqual(teaser);
   expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
   const html=renderToStaticMarkup(<CaseTeaser senior={role==='software'?'Kavya':'Meera'} teaser={teaser} busy={false} onTake={()=>{}}/>);
   expect(html).toContain(teaser.buttonLabel);
   expect(html).toContain('case-teaser');
  });
 }
}
