type Message={role:'customer'|'fresher';text:string;timedOut?:boolean};
export const NOTE_VERSION=2;
export const CLOSING_LINE="That's our last case; thanks for working through it with me.";
export const LEGACY_CLOSING_LINE='Thanks for your time; this attempt is now finished.';
export const NO_ANSWERS_NOTE="I didn't receive any answers, so I couldn't assess this attempt.";
export const SILENCE_REMINDER="I haven't received an answer, so I'm ending this attempt.";
export const NO_ANSWERS_STATUS='Not assessed: no answers submitted';
export function isTimeout(m:Message){return m.role==='fresher'&&(!!m.timedOut||/^\[(?:No reply within|Case time limit reached)/.test(m.text));}
export function hasAnswers(messages:Message[]){return messages.some(m=>m.role==='fresher'&&!isTimeout(m)&&!!m.text.trim());}
export function timeoutCount(messages:Message[]){return messages.filter(isTimeout).length;}
export function validFinalNote(note:unknown,ending:string):note is string{
 if(typeof note!=='string'||!note.trim())return false;
 const full=note.trim()+' '+ending;
 return full.split(/\s+/).length<50&&full.split(/[.!?]+(?:\s|$)/).filter(s=>s.trim()).length<=3
  &&!/(?:\bscore\b|\brating\b|\bmarks\b|\brubric\b|\b\d+(?:\.\d+)?\s*\/\s*10\b)/i.test(full);
}
export function dataTwoNote(messages:Message[]){
 const text=messages.filter(m=>m.role==='fresher'&&!isTimeout(m)).map(m=>m.text).join(' ');
 const observation=/number/i.test(text)&&/string|text/i.test(text)&&/zero/i.test(text)
  ?'You spotted that reading codes as numbers can lose their original form.'
  :'I need you to verify the original codes before trusting the imported values.';
 return observation+' Check the original CSV and read customer codes as text.';
}
