import type {OfficerStudent} from '../convex/officerRules';
import type {OfficerSkill} from '../convex/officerRules';
export type SortColumn='name'|'role'|'cases'|'readiness'|'weakest'|OfficerSkill;
export function sortStudents(students:OfficerStudent[],column:SortColumn,direction:'asc'|'desc'){
 const value=(s:OfficerStudent):string|number|null=>column==='cases'?s.cases.length:column in s.scores?s.scores[column as OfficerSkill]:column==='weakest'?s.weakest:s[column as 'name'|'role'|'readiness'];
 return [...students].sort((a,b)=>{const x=value(a),y=value(b);if(x===null)return y===null?a.name.localeCompare(b.name):1;if(y===null)return -1;const compared=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true,sensitivity:'base'});return (direction==='asc'?compared:-compared)||a.name.localeCompare(b.name);});
}
