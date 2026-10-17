import {httpRouter} from 'convex/server';
import {httpAction} from './_generated/server';
import type {ActionCtx} from './_generated/server';
import {internal} from './_generated/api';
import {authorizedOfficer,officerConfigured,validOfficerCode,officerCookie,clearOfficerCookie} from './officerAuth';
import {officerSummary,officerDetail} from './officerRules';
import type {SavedOfficerResult} from './officerRules';
const http=httpRouter();
function json(value:unknown,status=200,extra:Record<string,string>={}){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',...extra}});}
function sameOrigin(request:Request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
async function records(ctx:ActionCtx){const rows:SavedOfficerResult[]=[];let cursor:string|null=null;for(;;){const page:{page:SavedOfficerResult[];isDone:boolean;continueCursor:string}=await ctx.runQuery(internal.officerData.page,{cursor});rows.push(...page.page);if(page.isDone)return rows;cursor=page.continueCursor;}}
http.route({path:'/officer/login',method:'POST',handler:httpAction(async(ctx,request)=>{
 if(!sameOrigin(request))return json({error:'Access denied.'},403);
 if(!officerConfigured())return json({error:'Officer access is not configured.'},503);
 if(!await ctx.runMutation(internal.officerData.loginAttempt,{}))return json({error:'Too many attempts. Try again in 15 minutes.'},429,{'Retry-After':'900'});
 try{const text=await request.text();if(text.length>100)return json({error:'Enter the 6-digit officer code.'},400);const body=JSON.parse(text);
  if(!validOfficerCode(body.code))return json({error:'That code did not match.'},401);
  return json({ok:true},200,{'Set-Cookie':await officerCookie()});
 }catch{return json({error:'Enter the 6-digit officer code.'},400);}
})});
http.route({path:'/officer/logout',method:'POST',handler:httpAction(async(_ctx,request)=>sameOrigin(request)?json({ok:true},200,{'Set-Cookie':clearOfficerCookie()}):json({error:'Access denied.'},403))});
http.route({path:'/officer/summary',method:'GET',handler:httpAction(async(ctx,request)=>{
 if(!sameOrigin(request)||!await authorizedOfficer(request))return json({error:'Enter the officer code to continue.'},401);
 return json(officerSummary(await records(ctx)));
})});
http.route({path:'/officer/student',method:'GET',handler:httpAction(async(ctx,request)=>{
 if(!sameOrigin(request)||!await authorizedOfficer(request))return json({error:'Enter the officer code to continue.'},401);
 const id=new URL(request.url).searchParams.get('id');if(!id||id.length>500)return json({error:'Student not found.'},404);
 const student=officerDetail(await records(ctx),id);return student?json(student):json({error:'Student not found.'},404);
})});
export default http;
