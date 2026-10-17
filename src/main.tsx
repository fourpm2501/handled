import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexProvider,ConvexReactClient,useAction,useMutation,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {clock,roles,BRIEFING_LINE,ROLE_JOB_LINES,skillWord} from './studentView';
import type {Role} from './studentView';
import {seniorMessageParts,evidenceReadingHint} from './evidenceView';
import {getQuestionChips} from './questionChips';
import './style.css';
import Officer from './Officer';
import HomePreviews from './HomePreviews';
import HomeContext from './HomeContext';
import CaseTeaser from './CaseTeaser';
const client=new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const diagnosisCache=new Map<string,Promise<string[]>>();
const ownerKey='handled-owner';
let owner=localStorage.getItem(ownerKey);if(!owner){owner=crypto.randomUUID();localStorage.setItem(ownerKey,owner);}
function LogBlock({text}:{text:string}){
 return <div className="log-block" tabIndex={0} aria-label="Shared evidence"><pre><code>{text.split(/\r?\n/).map((line,i)=><span className="code-line" key={i}>{line.split(/("(?:\d+|Account not found|Wrong password)")/g).map((part,j)=>/^"(?:\d+|Account not found|Wrong password)"$/.test(part)?<mark key={j}>{part}</mark>:<React.Fragment key={j}>{part}</React.Fragment>)}</span>)}</code></pre></div>;
}
function SeniorMessage({text,previousReply}:{text:string;previousReply?:string}){return <>{seniorMessageParts(text,previousReply).map((part,i)=>part.kind==='log'?<React.Fragment key={i}><LogBlock text={part.text}/><p className="evidence-hint">{evidenceReadingHint(part.text)}</p></React.Fragment>:<p key={i}>{part.text}</p>)}</>;}
function App(){
 const [path,setPath]=useState(location.pathname);
 const rolePath=path.match(/^\/role\/(software|data)$/)?.[1] as Role|undefined;
 const token=path.match(/^\/(?:practice|result|role-done)\/([a-zA-Z0-9-]+)$/)?.[1];
 const previousToken=path.match(/^\/case\/([a-zA-Z0-9-]+)$/)?.[1];
 const [practiceName,setPracticeName]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const briefing=useQuery(api.sessions.briefing,rolePath?{role:rolePath}:previousToken?{afterToken:previousToken}:'skip');
 const previousSession=useQuery(api.sessions.get,previousToken?{token:previousToken}:'skip');
 const session=useQuery(api.sessions.get,token?{token}:'skip');
 const studentCount=useQuery(api.homeStats.studentCount,path==='/'?{}:'skip');
 const activate=useMutation(api.sessions.beginInteraction);
 const interactionRef=useRef<Promise<unknown>|null>(null);
 const start=useMutation(api.sessions.start);const nextCase=useMutation(api.sessions.next);const reply=useMutation(api.sessions.reply);const retry=useMutation(api.sessions.retry);
 const [draft,setDraft]=useState('');const [now,setNow]=useState(Date.now());const [paste,setPaste]=useState('');const [copied,setCopied]=useState(false);
 const diagnose=useAction(api.seniorFeedback.diagnosis);
 const diagnoseRole=useAction(api.seniorFeedback.roleDiagnosis);
 const [feedback,setFeedback]=useState<string[]|undefined>();const [feedbackError,setFeedbackError]=useState(false);const [feedbackRetry,setFeedbackRetry]=useState(0);
 const endRef=useRef<HTMLDivElement>(null);
 const sendingRef=useRef(false);
 const ticket=session&&'ticket' in session?session.ticket:null;
 const caseResults=session&&'caseResults' in session?session.caseResults:[];
 const isWrap=path.startsWith('/role-done/');const isHome=path==='/';
 const scorecard=useQuery(api.sessions.roleScorecard,isWrap&&token?{token}:'skip');
 const isBug=session?.scenario==='bugticket';const senior=ticket?.seniorName??(isBug?'Kavya':'Ramesh uncle');
 const replyLimit=ticket?ticket.timeLimitMs/1000:session?.scenario==='bugticket'?180:90;
 const remaining=ticket?(session?.deadlineAt?Math.max(0,Math.ceil((session.deadlineAt-now)/1000)):replyLimit):session?.replyStartedAt?Math.min(replyLimit,Math.max(0,Math.ceil((session.replyStartedAt+replyLimit*1000-now)/1000))):replyLimit;
 const repliesLeft=ticket?Math.max(session?.awaitingFix&&session.messages.at(-1)?.role==='customer'?1:0,ticket.maxReplies-(session?.messages.filter(m=>m.role==='fresher').length??0)):Math.max(0,8-(session?.messages.filter(m=>m.role==='fresher').length??0));
 const finished=session?.status==='complete';
 const nextId=ticket?.nextCaseId;
 const teaser=session&&'teaser' in session?session.teaser:null;
 function navigate(url:string){history.pushState({},'',url);setPath(url);setError('');setPaste('');window.scrollTo(0,0);}
 useEffect(()=>{const pop=()=>setPath(location.pathname);window.addEventListener('popstate',pop);const timer=setInterval(()=>setNow(Date.now()),200);return()=>{window.removeEventListener('popstate',pop);clearInterval(timer);};},[]);
 useEffect(()=>{interactionRef.current=null;setDraft(token?localStorage.getItem(`handled-draft-${token}`)??'':'');setPaste('');setCopied(false);},[token]);
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[session?.messages.length,session?.status]);
 useEffect(()=>{
  if(!token||!finished)return;
  let active=true;setFeedback(undefined);setFeedbackError(false);
  const cacheKey=(isWrap?'role:':'case:')+token;
  let request=diagnosisCache.get(cacheKey);if(!request){request=isWrap?diagnoseRole({token}):diagnose({token});diagnosisCache.set(cacheKey,request);}
  void request.then(note=>{if(active)setFeedback(note);}).catch(()=>{diagnosisCache.delete(cacheKey);if(active)setFeedbackError(true);});
  return()=>{active=false;};
 },[token,finished,isWrap,feedbackRetry,diagnose,diagnoseRole]);
 async function begin(){
  if(!briefing||busy)return;
  if(!previousToken&&!practiceName.trim()){setError("Add your name so your senior knows who's handling this.");return;}
  setBusy(true);setError('');
  try{const t=previousToken?await nextCase({token:previousToken,owner:owner!}):await start({owner:owner!,name:practiceName.trim(),role:rolePath??'software'});navigate(`/practice/${t}`);}catch{setError("Couldn't start the case. Try again.");}finally{setBusy(false);}
 }
 async function openNext(){if(!token||busy)return;setBusy(true);setError('');try{const t=await nextCase({token,owner:owner!});navigate(`/practice/${t}`);}catch{setError("Couldn't start the case. Try again.");}finally{setBusy(false);}}
 function beginInteraction(){
  if(!ticket||!token||session?.deadlineAt!==undefined)return Promise.resolve();
  if(!interactionRef.current)interactionRef.current=activate({token,owner:owner!}).catch(()=>{interactionRef.current=null;setError("Couldn't start the timer. Try typing again.");});
  return interactionRef.current;
 }
 async function send(question?:string){
  const text=question??draft;
  if(!token||!session||session.status!=='reply'||busy||sendingRef.current||!text.trim()||remaining===0||repliesLeft===0)return;
  sendingRef.current=true;setBusy(true);setError('');
  try{await beginInteraction();await reply({token,owner:owner!,text,turn:session.messages.length});if(question===undefined){setDraft('');localStorage.removeItem(`handled-draft-${token}`);}}
  catch{setError(question===undefined?"Your reply didn't send. It's saved, tap Send again.":"Your question didn't send. Tap it again.");}
  finally{sendingRef.current=false;setBusy(false);}
 }
 async function tryAgain(){if(!token)return;setBusy(true);try{await retry({token,owner:owner!});setError('');}catch{setError("Your senior's reply didn't load. Your chat is saved, try again in a minute.");}finally{setBusy(false);}}
 const role=rolePath??(briefing?.roleId as Role|undefined)??'software';
 const scene=ticket?session?.factsheet.split('SCENARIO\n')[1]?.split('\n\nSENIOR ENGINEER')[0]?.trim()??'':isBug?"Since this morning's release, some customers cannot log in. Support needs an update before more customers are affected.":'A customer received a late, incomplete meal and needs help. Work out what you can offer and explain your next step.';
 const caseTitle=({'SWE-1':'The basket total looks wrong','SWE-2':'The support-ticket count looks wrong','DATA-1':"The delivered-order count does not match",'DATA-2':'Customer codes look different','DATA-3':'The revenue report is too high',BUGTICKET:'Some customers cannot log in'} as Record<string,string>)[ticket?.caseId??'BUGTICKET'];
 return <div className={isHome?'app home-app':'app'}><header className={isHome?'site-header home-header':'site-header'}><a className="brand" href="/" onClick={e=>{e.preventDefault();navigate('/');}}>handled<span>.</span></a>{!isHome&&<a className="quiet-link" href="/" onClick={e=>{e.preventDefault();navigate('/');}}>Home</a>}</header>
 {isHome?<main className="home">
  <div className="ink-strip label">THE HOT SEAT BEFORE THE JOB</div>
  <section className="hero"><div className="hero-inner"><h1>Don't guess the job.<br className="home-headline-break"/>{' '}Handle it.</h1><p>Junior software engineer or junior data engineer. A real work problem, 5 to 12 minutes.</p><p>Your senior engineer brings you a real work problem. Handle it, and find out how this role makes you think.</p><button className="primary hero-button" onClick={()=>document.getElementById('role-choice')?.scrollIntoView({behavior:'smooth'})}>Take the hot seat <span aria-hidden="true">→</span></button><p className="hero-promise">Free · No login · 5–12 minutes per case</p><p className="hero-student-count">{studentCount===undefined?'...':studentCount} engineering students handled their first real case this week.</p></div></section>
  <HomeContext handledLine="Handled puts you in that seat: your senior brings you a real problem, and you make those calls yourself, in 5 to 12 minutes."/>
  <HomePreviews/>
  <section className="role-panel" id="role-choice" aria-labelledby="role-choice-title"><div className="section-inner"><h2 className="label" id="role-choice-title">Choose your role</h2><div className="role-cards">{(['software','data'] as Role[]).map(r=><button className="role-card" key={r} onClick={()=>navigate(`/role/${r}`)}><span className="role-name">{roles[r].name}</span><span>{roles[r].description} · {roles[r].count} cases</span><span className="label">5–12 minutes per case <span className="role-card-action">Handle it <span aria-hidden="true">→</span></span></span></button>)}</div></div></section>

 </main>:rolePath||previousToken?<main className="briefing-screen screen">
  {briefing===undefined?<p role="status">Getting your seat ready…</p>:briefing===null?<div className="empty"><h1>No next case is available.</h1><a href="/" onClick={e=>{e.preventDefault();navigate('/');}}>Choose your role</a></div>:<>
   <p className="label red-label">Your role</p><h1>{roles[role].name}</h1><section className="team-intro"><p>Two weeks into the job</p><p>Your senior is {roles[role].senior}.</p><p>Your senior will message you with a problem. Handle it.</p><p>{BRIEFING_LINE}</p></section>
   <section className="card case-rules"><h2>How a case works</h2><ul><li>{briefing.maxReplies} replies allowed.</li><li>{briefing.timeLimitMs/60000} minutes for this case</li><li>No paste. Type every reply yourself.</li><li>Your senior shares more only if you ask.</li></ul></section>
   <form className="briefing-form" onSubmit={e=>{e.preventDefault();void begin();}}>{previousToken?<p>{previousSession?.name}</p>:<><label htmlFor="practice-name">Your name</label><input id="practice-name" name="name" autoComplete="name" maxLength={100} placeholder="Type your full name" value={practiceName} onChange={e=>{setPracticeName(e.target.value);setError('');}} aria-describedby="name-help"/><p id="name-help">{!practiceName.trim()?"Add your name so your senior knows who's handling this.":' '}</p></>}{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?"Telling your senior you're in…":`Start case ${briefing.caseIndex+1}`}</button></form>
  </>}
 </main>:token?<main className={isWrap?'screen wrap-screen':'case-screen screen'}>
  {session===undefined?<p role="status">{isWrap?'Putting your cases together…':'Getting your seat ready…'}</p>:session===null?<section className="empty"><h1>Chat not found.</h1><a href="/">Choose your role</a></section>:isWrap&&ticket?<>
   <p className="label red-label">Role done</p><h1>You handled {caseResults.filter(c=>c.status==='complete').length} cases as a {ticket.roleLabel.toLowerCase()}</h1><p className="role-job-line">{ROLE_JOB_LINES[ticket.roleId]}</p>
   {feedbackError?<p className="error" role="alert">Couldn't load your summary. Your cases are saved.</p>:feedback===undefined?<p role="status">Putting your {caseResults.length} cases together…</p>:<section className="message senior-final wrap-note" aria-label={`${senior}'s role summary`}><p className="label">{senior}'s reply</p>{feedback.map((sentence,i)=><p className={i===2?'next-time':''} key={i}>{sentence}</p>)}</section>}
   {scorecard===undefined?<p role="status">Loading your scorecard...</p>:!scorecard?.complete?<p className="scorecard-pending">Finish all cases to see your scorecard.</p>:<section className="card skill-scorecard" aria-label="Skill scorecard"><h2>Skill scorecard</h2><p>Based on your saved replies across all three cases.</p><table><thead><tr><th scope="col">Skill</th><th scope="col">Skill level</th></tr></thead><tbody>{scorecard.skills.map(skill=><React.Fragment key={skill.label}><tr><th scope="row">{skill.label}</th><td>{skillWord(skill.score)}</td></tr><tr className="skill-explanation"><td colSpan={2}>{skill.explanation}</td></tr></React.Fragment>)}</tbody></table><p className="work-on-next"><strong>Work on next: {scorecard.next?.label??'Submit an answer'}</strong><br/>{scorecard.next?.advice??'Start by asking your senior for one record to check.'}</p></section>}
   <section className="other-role card"><p className="label">Try the other role</p><h2>{roles[ticket.roleId==='software'?'data':'software'].name}</h2><p>{roles[ticket.roleId==='software'?'data':'software'].description}</p><button className="primary" onClick={()=>navigate(`/role/${ticket.roleId==='software'?'data':'software'}`)}>Try {roles[ticket.roleId==='software'?'data':'software'].name}</button></section>
   <nav className="case-links" aria-label="Re-read each case">{caseResults.map(c=><a key={c.token} href={`/result/${c.token}`} onClick={e=>{e.preventDefault();navigate(`/result/${c.token}`);}}>Re-read {c.caseId}</a>)}</nav>
  </>:<>
   <div className="case-topbar"><span className="label red-label">{ticket?`Case ${ticket.caseIndex+1} of ${ticket.caseCount} · ${ticket.level} · ${ticket.timeLimitMs/60000} min`:isBug?'Login bug':'QuickBite'}</span><span className={`label case-clock ${remaining<=15&&session.status==='reply'?'urgent':''}`} role="timer">{finished?'Case complete':`${repliesLeft} replies left · ${clock(remaining)}`}</span></div>
   <section className="ticket card"><p className="label">{ticket?.caseId??'Your case'}</p><h1>{ticket?caseTitle:isBug?'Some customers cannot log in':'A customer needs help'}</h1><p>{scene}</p></section>
   {!finished&&session.status!=='grading'&&<section className="question-suggestions" aria-label="Questions you can ask"><p className="label reply-cost">Each question uses one reply.</p><p className="label">You can ask {senior} for:</p><div className="question-chips">{getQuestionChips(ticket?.caseId??(isBug?'BUGTICKET':'quickbite')).map(chip=><button type="button" className="question-chip" key={chip.label} disabled={busy||session.status!=='reply'||remaining===0||repliesLeft===0} onClick={()=>void send(chip.question)}>{chip.label}</button>)}</div>{error&&session.status!=='reply'&&<p className="error" role="alert">{error}</p>}</section>}
   <section className="conversation" aria-label="Your conversation"><div className="chat-heading"><h2>Your conversation</h2><span className="label">{session.name?.trim()||'Name not recorded'}</span></div>
    {session.assessmentStatus==='not_assessed'&&<p className="assessment-status" role="status">{session.assessmentLabel} ({session.timeoutCount} {session.timeoutCount===1?'timeout':'timeouts'})</p>}
    <div className="messages">{session.messages.length===0&&<p className="waiting" role="status">{senior} is typing…</p>}{session.messages.map((m,i)=><article className={`message ${m.role}`} key={i}><div className="message-meta"><strong>{m.role==='customer'?senior:'You'}</strong>{m.role==='fresher'&&<span className="label">{((m.responseMs??0)/1000).toFixed(1)}s{m.timedOut?' · timed out':''}</span>}</div>{m.role==='customer'?<SeniorMessage text={m.text} previousReply={i>0&&session.messages[i-1].role==='fresher'&&!session.messages[i-1].timedOut?session.messages[i-1].text:undefined}/>:<p>{m.text}</p>}</article>)}
     {finished&&!feedback&&!feedbackError&&<p className="waiting" role="status">{senior} is reading your replies…</p>}
     {finished&&feedbackError&&<div className="error-box"><p className="error" role="alert">Your senior's reply didn't load. Your chat is saved, try again in a minute.</p><button className="secondary" onClick={()=>setFeedbackRetry(n=>n+1)}>Try again</button></div>}
     {finished&&feedback&&<article className="message customer senior-final" aria-label={`${senior}'s final message`}><p className="label">{senior}'s reply</p>{feedback.map((sentence,i)=><p className={i===2?'next-time':''} key={i}>{sentence}</p>)}</article>}
     {finished&&feedback&&teaser&&<CaseTeaser senior={senior} teaser={teaser} busy={busy} onTake={()=>teaser.rolePath?navigate(teaser.rolePath):void openNext()}/>}
     <div ref={endRef} className="chat-end"/>
    </div>
    {session.status==='customer'&&session.messages.length>0&&<p className="waiting" role="status">{senior} is typing…</p>}
    {session.status==='grading'&&<p className="waiting" role="status">{senior} is reading your replies…</p>}
    {session.status==='error'&&<div className="error-box"><p className="error" role="alert">Your senior's reply didn't load. Your chat is saved, try again in a minute.</p><button className="secondary" disabled={busy} onClick={tryAgain}>Try again</button></div>}
   </section>
   {session.status==='reply'&&<form className="composer" onSubmit={e=>{e.preventDefault();void send();}}><label className="sr-only" htmlFor="reply">Your reply</label><textarea id="reply" placeholder="Ask a question or suggest a fix…" value={draft} maxLength={1600} disabled={busy||remaining===0} onKeyDown={e=>{if(e.key.length===1||['Backspace','Delete','Enter'].includes(e.key))void beginInteraction();}} onChange={e=>{void beginInteraction();setDraft(e.target.value);if(token)localStorage.setItem(`handled-draft-${token}`,e.target.value);}} onPaste={e=>{e.preventDefault();setPaste('Paste is blocked. Type your reply to practise.');}} onDrop={e=>{e.preventDefault();setPaste('Dropping text is blocked. Type your reply to practise.');}} onDragOver={e=>e.preventDefault()} onBeforeInput={e=>{if(['insertFromPaste','insertFromDrop'].includes((e.nativeEvent as InputEvent).inputType)){e.preventDefault();setPaste('Paste is blocked. Type your reply to practise.');}}}/><div className="composer-row"><p className={paste?'error':'composer-hint'} role="status">{paste||'Type it yourself. No paste.'}</p><button className="primary" disabled={busy||remaining===0||!draft.trim()}>{busy?'Sending…':'Send'}</button></div>{error&&<p className="error" role="alert">{error}</p>}</form>}
   {finished&&<div className="case-actions">{!nextId&&ticket?<button className="secondary" onClick={()=>navigate(`/role-done/${token}`)}>See how you did</button>:null}{error&&<p className="error" role="alert">{error}</p>}<div className="result-link"><a href={`/result/${token}`} onClick={e=>{e.preventDefault();navigate(`/result/${token}`);}}>Re-read this case</a><button className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(`${location.origin}/result/${token}`);setCopied(true);}catch{setError('Copy the result URL from your address bar.');}}}>{copied?'Link copied':'Copy result link'}</button></div></div>}
  </>}
 </main>:<main className="screen"><p>This page didn't load. Refresh to try again.</p><a href="/">Home</a></main>}
 <footer><a href="/" onClick={e=>{e.preventDefault();navigate('/');}}>handled.</a><p>The hot seat before the job</p></footer></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ConvexProvider client={client}>{location.pathname.replace(/\/$/,'')==='/officer'?<Officer/>:<App/>}</ConvexProvider></React.StrictMode>);
