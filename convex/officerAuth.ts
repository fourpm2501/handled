const COOKIE='handled_officer';
export const COOKIE_PATH='/api/officer';
const encoder=new TextEncoder();
function settings(){const code=process.env.OFFICER_CODE,secret=process.env.OFFICER_SESSION_SECRET;return code&&/^\d{6}$/.test(code)&&secret&&secret.length>=32?{code,secret}:null;}
export function officerConfigured(){return settings()!==null;}
export function validOfficerCode(input:unknown){const config=settings();if(!config||typeof input!=='string'||!/^\d{6}$/.test(input))return false;let different=0;for(let i=0;i<6;i++)different|=input.charCodeAt(i)^config.code.charCodeAt(i);return different===0;}
function encode(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(text:string){return Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function signingKey(){const config=settings();if(!config)throw new Error('Officer access unavailable');return crypto.subtle.importKey('raw',encoder.encode(config.secret+':'+config.code),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function officerCookie(now=Date.now()){
 const nonce=crypto.getRandomValues(new Uint8Array(18));const payload=encode(encoder.encode(JSON.stringify({exp:now+3600000,nonce:encode(nonce)})));
 const signature=await crypto.subtle.sign('HMAC',await signingKey(),encoder.encode(payload));
 return `${COOKIE}=${payload}.${encode(new Uint8Array(signature))}; HttpOnly; Secure; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=3600`;
}
export function clearOfficerCookie(){return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=0`;}
export async function authorizedOfficer(request:Request,now=Date.now()){
 if(!officerConfigured())return false;
 const value=request.headers.get('Cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!value||value.length>1000)return false;
 try{const [payload,signature,extra]=value.split('.');if(!payload||!signature||extra)return false;
  if(!await crypto.subtle.verify('HMAC',await signingKey(),decode(signature),encoder.encode(payload)))return false;
  const parsed=JSON.parse(new TextDecoder().decode(decode(payload)));return typeof parsed.exp==='number'&&parsed.exp>now&&parsed.exp<=now+3600000;
 }catch{return false;}
}
