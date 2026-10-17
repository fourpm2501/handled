import {ROLE_CASES,ticketParts} from './ticketRules';
import type {CaseId} from './ticketRules';

// Use only the public scenario, never the next ticket's clues or answer.
export function caseTeaser(caseId:CaseId){
 const role=caseId.startsWith('DATA-')?'data':'software';
 const order=ROLE_CASES[role];
 const nextCaseId=order[order.findIndex(id=>id===caseId)+1]??null;
 const otherRole=role==='software'?'data':'software';
 const target=nextCaseId??ROLE_CASES[otherRole][0];
 const symptom=ticketParts(target).scenario;
 const roleName=otherRole==='data'?'Junior Data Engineer':'Junior Software Engineer';
 return {
  message:nextCaseId?`Something new just came in: ${symptom} Want to take it?`:`You've handled the ${role==='software'?'software':'data'} desk. ${symptom} Try ${roleName}?`,
  buttonLabel:nextCaseId?'Take the next ticket':`Try ${roleName}`,
  rolePath:nextCaseId?null:`/role/${otherRole}`,
 };
}
