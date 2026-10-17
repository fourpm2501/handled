import React,{useState} from 'react';
import './homePreviews.css';
const sampleSkills=[['Analytical thinking','Strong'],['Technical understanding','Good'],['Problem-solving method','Building'],['Communication','Good']];
export default function HomePreviews(){const [expanded,setExpanded]=useState(false);return <>
 <section className="home-case-preview" aria-labelledby="home-case-preview-title">
  <div className="home-preview-heading"><h2 id="home-case-preview-title">See how an engineer thinks</h2></div>
  <div className="home-preview-desk" data-ui="case-preview" aria-label="Demo payment case conversation">
   <div className="home-preview-topbar"><span>Sample case</span></div>
   <article className="home-preview-ticket"><h3>A customer in a Swiggy-style app was charged ₹240 twice for one order.</h3></article>
   <div className="home-preview-chat">
    <article className="home-preview-bubble home-preview-senior"><p className="home-preview-speaker">Kavya</p><p>A customer says they paid twice for one biryani. Can you check?</p></article>
    <article className="home-preview-bubble home-preview-student"><p className="home-preview-speaker">Student</p><p>Can I see the payment requests for that order?</p></article>
    <article className="home-preview-bubble home-preview-senior home-preview-evidence"><p className="home-preview-speaker">Kavya</p><div className="home-preview-log"><pre><code>{'21:04:12.100 POST /pay order=A17 amount=240\n21:04:12.480 POST /pay order=A17 amount=240'}</code></pre></div><p className="home-preview-log-hint">Each line is one request. Check the times.</p></article>
    <article className="home-preview-bubble home-preview-student"><p className="home-preview-speaker">Student</p><p>The logs show two payment requests 0.38 seconds apart for the same order. This could be a double tap or an automatic retry. Can I see the tap events and retry logs to tell them apart before naming the cause?</p></article>
    <button className="secondary home-preview-expand" type="button" aria-expanded={expanded} aria-controls="home-preview-ending" onClick={()=>setExpanded(!expanded)}>{expanded?'Hide ending':'See how it ends'}</button>
    <div id="home-preview-ending" className="home-preview-ending" hidden={!expanded}>
    <article className="home-preview-bubble home-preview-senior"><p className="home-preview-speaker">Kavya</p><p>Should we just refund everyone who complains?</p></article>
    <article className="home-preview-bubble home-preview-student"><p className="home-preview-speaker">Student</p><p>No. Confirm the duplicate charge and refund it. Check the tap events and retry logs before naming the cause, and have the server reject a second payment for the same order.</p></article>
    <article className="home-preview-bubble home-preview-senior"><p className="home-preview-speaker">Kavya</p><p>Good call asking for tap events and retry logs. That's the evidence we need to tell a double tap from an automatic retry before naming the cause.</p></article>
    <aside className="home-preview-your-turn"><p>Your turn. A customer's basket total shows ₹010050. What would you ask Kavya first?</p><button className="primary" type="button" onClick={()=>document.getElementById('role-choice')?.scrollIntoView({behavior:'smooth',block:'start'})}>Take the hot seat</button></aside>
    </div>
   </div>
  </div>
 </section>
 <section className="home-score-preview" aria-labelledby="home-score-preview-title">
  <h2 id="home-score-preview-title">What you get at the end</h2>
  <div className="home-preview-scorecard" data-ui="scorecard-preview" aria-label="Sample Role done skill scorecard">
   <div className="home-preview-score-heading"><p>Role done</p><span>Sample scorecard</span></div>
   <h3>How you think on the job</h3>
   <dl>{sampleSkills.map(([skill,level])=><div key={skill}><dt>{skill}</dt><dd>{level}</dd></div>)}</dl>
   <blockquote><p>“Two pay requests 0.38 seconds apart for the same order. The customer tapped Pay twice and the app sent both.”</p><p className="home-preview-quote-caption">A sample student reply</p></blockquote>
  </div>
 </section>
 </>;}
