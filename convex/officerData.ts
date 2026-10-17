import {v} from 'convex/values';
import {internalQuery,internalMutation} from './_generated/server';
export const page=internalQuery({args:{cursor:v.union(v.string(),v.null())},handler:async(ctx,{cursor})=>{
 const r=await ctx.db.query('sessions').withIndex('by_status',q=>q.eq('status','complete')).paginate({numItems:50,cursor});
 return {isDone:r.isDone,continueCursor:r.continueCursor,page:r.page.map(s=>({id:s._id,name:s.name,caseId:s.caseId,roleId:s.roleId,scenario:s.scenario,started:s._creationTime,messages:s.messages,caseGrade:s.caseGrade,seniorNote:s.seniorNote}))};
}});
// Only login attempt counts live here; student records are never written.
export const loginAttempt=internalMutation({args:{},handler:async ctx=>{
 const now=Date.now(),windowMs=15*60*1000;
 const saved=await ctx.db.query('officerAccessLimits').unique();
 if(!saved){await ctx.db.insert('officerAccessLimits',{started:now,attempts:1});return true;}
 if(now-saved.started>=windowMs){await ctx.db.patch(saved._id,{started:now,attempts:1});return true;}
 if(saved.attempts>=20)return false;
 await ctx.db.patch(saved._id,{attempts:saved.attempts+1});return true;
}});
