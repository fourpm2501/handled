export type Role='software'|'data';
export type StudentMessage={role:'customer'|'fresher';text:string;timedOut?:boolean};
export const roles={
 software:{name:'Junior Software Engineer',senior:'Kavya',description:'Find what broke in the app',count:3},
 data:{name:'Junior Data Engineer',senior:'Meera',description:'Find where the data went wrong',count:3},
};
export function clock(seconds:number){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}

export const BRIEFING_LINE="You don't need to write code. You need to ask, notice and explain.";
export const ROLE_JOB_LINES={software:"This is most of a junior engineer's day: finding where something broke and explaining it simply.",data:"This is most of a junior data engineer's day: finding where the numbers went wrong and explaining it simply."};
export function skillWord(score:number|null){return score===null?'Not assessed':score>=8?'Strong':score>=6?'Good':score>=4?'Building':'Not yet';}
