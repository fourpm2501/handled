import React from 'react';
export type Teaser={message:string;buttonLabel:string;rolePath:string|null};
export default function CaseTeaser({senior,teaser,busy,onTake}:{senior:string;teaser:Teaser;busy:boolean;onTake:()=>void}){
 return <article className="message customer case-teaser" aria-label={`${senior}'s next ticket`}>
  <div className="message-meta"><strong>{senior}</strong></div>
  <p>{teaser.message}</p>
  <button className="primary" disabled={busy} onClick={onTake}>{busy?'Opening the ticket...':teaser.buttonLabel}</button>
 </article>;
}
