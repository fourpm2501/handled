import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { internal } from './_generated/api';
import { FACTSHEET } from './factsheet';
import { grade, bugGrade, scenario, roleId, caseGrade } from './schema';
import { BUGTICKET } from './bugticket';
import { bugParts } from './bugRules';
import { quickBitePublic } from './quickBitePublic';
import { replyTiming } from './replyTiming';
import { ROLE_CASES, ticketParts, publicTicket, publicGradeReason } from './ticketRules';
import type {Doc} from './_generated/dataModel';
import type { CaseId, RoleId } from './ticketRules';
import {hasAnswers,timeoutCount,NOTE_VERSION,NO_ANSWERS_NOTE,NO_ANSWERS_STATUS,SILENCE_REMINDER,validFinalNote,LEGACY_CLOSING_LINE} from './resultRules';
import {studentFeedback,roleSummary} from './studentPresentationRules';
import {chipReply} from './chipEvidence';
import {buildRoleScorecard} from './roleScorecard';
import {caseTeaser} from './caseTeaser';
async function createCase(ctx:MutationCtx,owner:string,name:string,role:RoleId,caseId:CaseId,runToken?:string){
 const token=crypto.randomUUID();const ticket=ticketParts(caseId);
 const source=caseId==='BUGTICKET'?ticket.source.replace(/^(#[^\n]+)\n/,`$1\n\nLEVEL: ${ticket.publicTicket.level}\nTOOLS TESTED: ${ticket.publicTicket.tools}\nSKILLS TESTED: ${ticket.publicTicket.skills.join('; ')}\nTIME LIMIT: ${ticket.publicTicket.timeLimitMs/60000} minutes total for this case\nMAX REPLIES: ${ticket.publicTicket.maxReplies} student replies\n`):ticket.source;
 const id=await ctx.db.insert('sessions',{token,owner,name,scenario:'bugticket',roleId:role,caseId,
  runToken:runToken??token,factsheet:source,messages:[],status:'customer'});
 await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id});
 return token;
}
const lookup = async (ctx:QueryCtx|MutationCtx,token:string) => ctx.db.query('sessions').withIndex('by_token',q=>q.eq('token',token)).unique();
async function activateClock(ctx:MutationCtx,s:Doc<'sessions'>){
 if(!s.caseId||s.deadlineAt!==undefined)return s.deadlineAt;
 const deadlineAt=Date.now()+publicTicket(s.caseId,s.factsheet).timeLimitMs;
 await ctx.db.patch(s._id,{deadlineAt,...(s.status==='reply'?{replyStartedAt:Date.now()}:{})});
 await ctx.scheduler.runAfter(deadlineAt-Date.now(),internal.sessions.expireCase,{id:s._id,deadlineAt});
 return deadlineAt;
}
export const beginInteraction=mutation({args:{token:v.string(),owner:v.string()},returns:v.union(v.number(),v.null()),handler:async(ctx,{token,owner})=>{
 const s=await lookup(ctx,token);if(!s||s.owner!==owner)throw new Error('Session unavailable');
 if(!s.caseId||!['customer','reply'].includes(s.status))return null;
 return (await activateClock(ctx,s))??null;
}});
export const facts = query({args:{scenario:v.optional(scenario)},returns:v.string(),handler:(_ctx,a)=>a.scenario==='bugticket'?bugParts(BUGTICKET).brief:quickBitePublic(FACTSHEET)});
export const bugCode = query({args:{},returns:v.string(),handler:()=>bugParts(BUGTICKET).code});
export const briefing = query({args:{role:v.optional(roleId),afterToken:v.optional(v.string())},handler:async(ctx,a)=>{
 if(a.afterToken){
  const previous=await lookup(ctx,a.afterToken);
  if(!previous?.caseId||!previous.roleId||previous.status!=='complete')return null;
  const order=ROLE_CASES[previous.roleId];const next=order[order.findIndex(id=>id===previous.caseId)+1];
  return next?publicTicket(next):null;
 }
 const role=a.role??'software';return publicTicket(ROLE_CASES[role][0]);
}});
export const start = mutation({args:{owner:v.string(),name:v.string(),scenario:v.optional(scenario),role:v.optional(roleId)},returns:v.string(),handler:async(ctx,{owner,name,scenario,role})=>{
 if(owner.length<24 || owner.length>100) throw new Error('Invalid session');
 name=name.trim();if(!name||name.length>100)throw new Error('Your name is required (maximum 100 characters)');
 if(role)return createCase(ctx,owner,name,role,ROLE_CASES[role][0]);
 const token=crypto.randomUUID();
 const id=await ctx.db.insert('sessions',{token,owner,name,factsheet:scenario==='bugticket'?BUGTICKET:FACTSHEET,...(scenario?{scenario}:{}),messages:[],status:'customer'});
 await ctx.scheduler.runAfter(0,scenario==='bugticket'?internal.bugAi.advance:internal.ai.advance,{id}); return token;
}});
export const get = query({args:{token:v.string()},handler:async(ctx,{token})=>{
 const s=await lookup(ctx,token); if(!s) return null;
 const {owner,lease,leaseAt,...stored}=s;
 const notAssessed=s.status==='complete'&&!hasAnswers(s.messages);
 const ending=s.caseId?publicTicket(s.caseId,s.factsheet).handoff:LEGACY_CLOSING_LINE;
 const seniorNote=notAssessed?NO_ANSWERS_NOTE:s.seniorNoteVersion===NOTE_VERSION&&validFinalNote(s.seniorNote,ending)?s.seniorNote:undefined;
 const safe={...stored,seniorNote,assessmentStatus:notAssessed?'not_assessed':s.status==='complete'?'assessed':'pending',assessmentLabel:notAssessed?NO_ANSWERS_STATUS:null,timeoutCount:timeoutCount(s.messages),...(notAssessed?{grade:undefined,bugGrade:undefined,caseGrade:undefined,graderRaw:undefined}:{})};
 if(s.caseId){
  const {factsheet,graderRaw,caseGrade:privateGrade,...publicSession}=safe;
  const ticket=publicTicket(s.caseId,factsheet);
  const cases=s.runToken?await ctx.db.query('sessions').withIndex('by_run',q=>q.eq('runToken',s.runToken)).collect():[s];
  const order=ROLE_CASES[ticket.roleId];
  const caseResults=cases.sort((a,b)=>order.findIndex(id=>id===a.caseId)-order.findIndex(id=>id===b.caseId)).map(c=>({caseId:c.caseId!,token:c.token,status:c.status,notAssessed:c.status==='complete'&&!hasAnswers(c.messages),score:hasAnswers(c.messages)&&c.caseGrade?.length?c.caseGrade.reduce((sum,g)=>sum+g.score,0)/c.caseGrade.length:null}));
  const completed=caseResults.filter(c=>c.status==='complete'&&c.score!==null);
  const roleScore=completed.length===order.length?completed.reduce((sum,c)=>sum+c.score!,0)/order.length:null;
  const caseGrade=privateGrade?.map(g=>({...g,reason:g.quote?publicGradeReason(g.label,g.score):'No student reply was recorded for this skill.'}));
  return {...publicSession,caseGrade,factsheet:ticket.brief,code:ticket.code,ticket,caseResults,roleScore,teaser:s.status==='complete'?caseTeaser(s.caseId):null};
 }
 return s.scenario==='bugticket'?{...safe,factsheet:bugParts(s.factsheet).brief,code:bugParts(s.factsheet).code}:{...safe,factsheet:quickBitePublic(s.factsheet),code:null};
}});
export const next = mutation({args:{token:v.string(),owner:v.string()},returns:v.string(),handler:async(ctx,{token,owner})=>{
 const previous=await lookup(ctx,token);
 if(!previous||previous.owner!==owner)throw new Error('Session unavailable');
 if(!previous.caseId||!previous.roleId||previous.status!=='complete')throw new Error('Finish this case first');
 if(previous.nextToken)return previous.nextToken;
 const order=ROLE_CASES[previous.roleId];const next=order[order.findIndex(id=>id===previous.caseId)+1];
 if(!next)throw new Error('This role is complete');
 const nextToken=await createCase(ctx,owner,previous.name??'Name not recorded',previous.roleId,next,previous.runToken);
 await ctx.db.patch(previous._id,{nextToken});return nextToken;
}});
export const reply = mutation({args:{token:v.string(),owner:v.string(),text:v.string(),turn:v.number()},returns:v.null(),handler:async(ctx,a)=>{
 const s=await lookup(ctx,a.token); if(!s || s.owner!==a.owner) throw new Error('Session unavailable');
 if(s.status!=='reply' || s.messages.length!==a.turn) return null;
 if(a.text.length>1600) throw new Error('Reply is too long');
 if(s.caseId){
  const ticket=publicTicket(s.caseId,s.factsheet);
  const deadlineAt=(await activateClock(ctx,s))!;
  const elapsed=Math.max(0,Date.now()-(s.deadlineAt===undefined?Date.now():s.replyStartedAt!));const timedOut=Date.now()>=deadlineAt;
  if(!timedOut&&!a.text.trim())throw new Error('Write a reply first');
  const messages=[...s.messages,{role:'fresher' as const,text:timedOut?'[Case time limit reached]':a.text.trim(),at:Date.now(),responseMs:Math.min(elapsed,Math.max(0,deadlineAt-(s.deadlineAt===undefined?Date.now():s.replyStartedAt!))),timedOut}];
  const count=messages.filter(m=>m.role==='fresher').length;
  // A chip is a normal student reply. Its requested evidence is delivered in
  // the same transaction, including on the final reply, before grading starts.
  const evidenceReply=timedOut||s.awaitingFix?null:chipReply(s.caseId,s.factsheet,a.text,s.messages);
  if(evidenceReply){
   const at=Date.now();messages.push({role:'customer',text:evidenceReply+(count>=ticket.maxReplies?"\n\nI've saved your work. Let's review this case.":''),at});
   const status=count>=ticket.maxReplies?'grading' as const:'reply' as const;
   await ctx.db.patch(s._id,{messages,status,replyStartedAt:status==='reply'?at:undefined});
   if(status==='grading')await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id:s._id});
   return null;
  }
  const status=timedOut?'grading' as const:'customer' as const;
  await ctx.db.patch(s._id,{messages,status,replyStartedAt:undefined});
  await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id:s._id});return null;
 }
 const {limitMs,timeoutText}=replyTiming(s.scenario);
 const elapsed=Math.max(0,Date.now()-s.replyStartedAt!);const timedOut=elapsed>=limitMs;
 if(!timedOut && !a.text.trim()) throw new Error('Write a reply first');
 const messages=[...s.messages,{role:'fresher' as const,text:timedOut?timeoutText:a.text.trim(),at:Date.now(),responseMs:Math.min(elapsed,limitMs),timedOut}];
 const status=messages.filter(m=>m.role==='customer').length>=8?'grading' as const:'customer' as const;
 await ctx.db.patch(s._id,{messages,status,replyStartedAt:undefined});
 await ctx.scheduler.runAfter(0,s.scenario==='bugticket'?internal.bugAi.advance:internal.ai.advance,{id:s._id});return null;
}});
export const expireCase = internalMutation({args:{id:v.id('sessions'),deadlineAt:v.number()},returns:v.null(),handler:async(ctx,{id,deadlineAt})=>{
 const s=await ctx.db.get(id);
 if(!s?.caseId||s.deadlineAt!==deadlineAt||!['customer','reply','error'].includes(s.status))return null;
 const left=deadlineAt-Date.now();if(left>0){await ctx.scheduler.runAfter(left,internal.sessions.expireCase,{id,deadlineAt});return null;}
 const messages=[...s.messages];
 if(s.status==='reply')messages.push({role:'fresher',text:'[Case time limit reached]',at:deadlineAt,responseMs:Math.max(0,deadlineAt-s.replyStartedAt!),timedOut:true});
 if(messages.at(-1)?.role==='customer'||s.awaitingFix)messages.push({role:'customer',text:"Time is up. I've saved your work; let's review this case.",at:deadlineAt});
 await ctx.db.patch(id,{messages,status:'grading',replyStartedAt:undefined,errorStage:undefined,lease:undefined,leaseAt:undefined});
 await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id});return null;
}});
export const expire = internalMutation({args:{id:v.id('sessions'),started:v.number()},returns:v.null(),handler:async(ctx,{id,started})=>{
 const s=await ctx.db.get(id);if(!s || s.status!=='reply' || s.replyStartedAt!==started) return null;
 const {limitMs,timeoutText}=replyTiming(s.scenario);
 const left=started+limitMs-Date.now();if(left>0){await ctx.scheduler.runAfter(left,internal.sessions.expire,{id,started});return null;}
 const messages=[...s.messages,{role:'fresher' as const,text:timeoutText,at:started+limitMs,responseMs:limitMs,timedOut:true}];
 await ctx.db.patch(id,{messages,status:messages.filter(m=>m.role==='customer').length>=8?'grading':'customer',replyStartedAt:undefined});
 await ctx.scheduler.runAfter(0,s.scenario==='bugticket'?internal.bugAi.advance:internal.ai.advance,{id});return null;
}});
export const retry = mutation({args:{token:v.string(),owner:v.string()},returns:v.null(),handler:async(ctx,a)=>{
 const s=await lookup(ctx,a.token);if(!s || s.owner!==a.owner) throw new Error('Session unavailable');
 if(s.status!=='error') return null;
 await ctx.db.patch(s._id,{status:s.errorStage!,errorStage:undefined});await ctx.scheduler.runAfter(0,s.scenario==='bugticket'?internal.bugAi.advance:internal.ai.advance,{id:s._id});return null;
}});
export const read = internalQuery({args:{id:v.id('sessions')},handler:(ctx,{id})=>ctx.db.get(id)});
export const claim = internalMutation({args:{id:v.id('sessions'),lease:v.string()},returns:v.boolean(),handler:async(ctx,{id,lease})=>{
 const s=await ctx.db.get(id);if(!s || !['customer','grading'].includes(s.status) || (s.lease && Date.now()-s.leaseAt!<120000))return false;
 if(!hasAnswers(s.messages)&&(timeoutCount(s.messages)>0||s.status==='grading')){
  const messages=[...s.messages];
  if(!messages.some(m=>m.role==='customer'&&m.text===SILENCE_REMINDER))messages.push({role:'customer',text:SILENCE_REMINDER,at:Date.now()});
  await ctx.db.patch(id,{messages,status:'complete',seniorNote:NO_ANSWERS_NOTE,seniorNoteVersion:NOTE_VERSION,replyStartedAt:undefined,errorStage:undefined,lease:undefined,leaseAt:undefined});
  return false;
 }
 await ctx.db.patch(id,{lease,leaseAt:Date.now()});return true;
}});
export const fail = internalMutation({args:{id:v.id('sessions'),lease:v.string()},returns:v.null(),handler:async(ctx,{id,lease})=>{
 const s=await ctx.db.get(id);if(s && s.lease===lease)await ctx.db.patch(id,{status:'error',errorStage:s.status==='grading'?'grading':'customer',lease:undefined,leaseAt:undefined});return null;
}});
export const customer = internalMutation({args:{id:v.id('sessions'),lease:v.string(),text:v.string()},returns:v.null(),handler:async(ctx,{id,lease,text})=>{
 const s=await ctx.db.get(id);if(!s || s.lease!==lease || s.status!=='customer')return null;
 if(s.caseId&&s.deadlineAt!==undefined&&Date.now()>=s.deadlineAt){await ctx.scheduler.runAfter(0,internal.sessions.expireCase,{id,deadlineAt:s.deadlineAt!});return null;}
 const started=Date.now();await ctx.db.patch(id,{messages:[...s.messages,{role:'customer',text,at:started}],status:'reply',replyStartedAt:started,lease:undefined,leaseAt:undefined});
 if(!s.caseId)await ctx.scheduler.runAfter(replyTiming(s.scenario).limitMs,internal.sessions.expire,{id,started});return null;
}});
export const graded = internalMutation({args:{id:v.id('sessions'),lease:v.string(),grade,raw:v.string()},returns:v.null(),handler:async(ctx,a)=>{
 const s=await ctx.db.get(a.id);if(s && s.lease===a.lease && s.status==='grading')await ctx.db.patch(a.id,{grade:a.grade,graderRaw:a.raw,status:'complete',lease:undefined,leaseAt:undefined});return null;
}});
export const bugGraded = internalMutation({args:{id:v.id('sessions'),lease:v.string(),grade:bugGrade,raw:v.string()},returns:v.null(),handler:async(ctx,a)=>{
 const s=await ctx.db.get(a.id);if(s && s.scenario==='bugticket' && s.lease===a.lease && s.status==='grading')await ctx.db.patch(a.id,{bugGrade:a.grade,graderRaw:a.raw,status:'complete',lease:undefined,leaseAt:undefined});return null;
}});
export const ticketGraded = internalMutation({args:{id:v.id('sessions'),lease:v.string(),grade:caseGrade,raw:v.string()},returns:v.null(),handler:async(ctx,a)=>{
 const s=await ctx.db.get(a.id);
 if(!s?.caseId||s.lease!==a.lease||s.status!=='grading')return null;
 const skills=publicTicket(s.caseId,s.factsheet).skills;
 if(a.grade.length!==skills.length||a.grade.some((g,i)=>g.label!==skills[i]||!Number.isInteger(g.score)||g.score<1||g.score>10||!g.reason.trim()||(g.quote&&!s.messages.some(m=>m.role==='fresher'&&!m.timedOut&&m.text===g.quote))))throw new Error('Invalid grade');
 await ctx.db.patch(a.id,{caseGrade:a.grade,graderRaw:a.raw,status:'complete',lease:undefined,leaseAt:undefined});return null;
}});

// Feedback is separate from grading and never changes grades or session state.
export const feedbackSession = internalQuery({args:{token:v.string()},handler:(ctx,{token})=>lookup(ctx,token)});
export const saveSeniorNote = internalMutation({args:{id:v.id('sessions'),note:v.string()},returns:v.string(),handler:async(ctx,{id,note})=>{
 const s=await ctx.db.get(id);if(!s||s.status!=='complete')throw new Error('Result unavailable');
 const ending=s.caseId?publicTicket(s.caseId,s.factsheet).handoff:LEGACY_CLOSING_LINE;
 if(!validFinalNote(note,ending))throw new Error('Invalid feedback');
 if(s.seniorNoteVersion===NOTE_VERSION&&validFinalNote(s.seniorNote,ending))return s.seniorNote;
 await ctx.db.patch(id,{seniorNote:note,seniorNoteVersion:NOTE_VERSION});return note;
}});

// Read-only student presentation: no writes, scores, or hidden ticket material.
export const studentPresentation = query({args:{token:v.string()},handler:async(ctx,{token})=>{
 const s=await lookup(ctx,token);if(!s||s.status!=='complete')return null;
 const cases=s.runToken?await ctx.db.query('sessions').withIndex('by_run',q=>q.eq('runToken',s.runToken)).collect():[s];
 return {feedback:studentFeedback(s.caseId??(s.scenario==='bugticket'?'BUGTICKET':'quickbite'),s.messages),summary:roleSummary(cases.filter(c=>c.status==='complete'))};
}});

export const feedbackRun=internalQuery({args:{token:v.string()},handler:async(ctx,{token})=>{
 const s=await lookup(ctx,token);
 if(!s||s.status!=='complete')throw new Error('Result unavailable');
 const cases=s.runToken?await ctx.db.query('sessions').withIndex('by_run',q=>q.eq('runToken',s.runToken)).collect():[s];
 return cases.filter(c=>c.status==='complete'&&c.roleId===s.roleId);
}});

// End a new attempt after a proposed fix; keep the existing grader unchanged.
export const finishProposedFix=internalMutation({args:{id:v.id('sessions'),lease:v.string()},returns:v.null(),handler:async(ctx,{id,lease})=>{
 const s=await ctx.db.get(id);
 if(!s?.caseId||s.status!=='customer'||s.lease!==lease)return null;
 await ctx.db.patch(id,{status:'grading',replyStartedAt:undefined,lease:undefined,leaseAt:undefined});
 await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id});
 return null;
}});

export const roleScorecard=query({args:{token:v.string()},handler:async(ctx,{token})=>{
 const s=await lookup(ctx,token);
 if(!s?.roleId)return null;
 const results=s.runToken?await ctx.db.query('sessions').withIndex('by_run',q=>q.eq('runToken',s.runToken)).collect():[s];
 return buildRoleScorecard(s.roleId,results.filter(c=>c.roleId===s.roleId));
}});

export const askForFix=internalMutation({args:{id:v.id('sessions'),lease:v.string(),text:v.string()},returns:v.null(),handler:async(ctx,{id,lease,text})=>{
 const s=await ctx.db.get(id);if(!s?.caseId||s.status!=='customer'||s.lease!==lease||s.awaitingFix)return null;
 if(s.deadlineAt!==undefined&&Date.now()>=s.deadlineAt){await ctx.scheduler.runAfter(0,internal.sessions.expireCase,{id,deadlineAt:s.deadlineAt});return null;}
 const at=Date.now();await ctx.db.patch(id,{awaitingFix:true,messages:[...s.messages,{role:'customer',text,at}],status:'reply',replyStartedAt:at,lease:undefined,leaseAt:undefined});return null;
}});

export const closeWithAnswer=internalMutation({args:{id:v.id('sessions'),lease:v.string(),text:v.string()},returns:v.null(),handler:async(ctx,{id,lease,text})=>{
 const s=await ctx.db.get(id);if(!s?.caseId||s.status!=='customer'||s.lease!==lease)return null;
 await ctx.db.patch(id,{messages:[...s.messages,{role:'customer',text:text+" I've saved your work; let's review this case.",at:Date.now()}],status:'grading',replyStartedAt:undefined,lease:undefined,leaseAt:undefined});
 await ctx.scheduler.runAfter(0,internal.bugAi.advance,{id});return null;
}});
