// Public briefing and clue text are derived from the saved UTF-8 ticket.
// The role-playing AI never receives the full ticket or unrevealed evidence.
export function bugParts(sheet:string){
 const codeAt=sheet.indexOf('CODE SHOWN TO THE FRESHER');const cluesAt=sheet.indexOf('CLUES (');
 if(codeAt<0||cluesAt<0)throw new Error('Invalid bug ticket');
 const brief=sheet.slice(0,codeAt).trim().replace(/\bHandled v1\b/g,'Handled');
 const code=sheet.slice(sheet.indexOf('\n',codeAt)+1,cluesAt).trim().replace(/^```[^\n]*\n|\n```$/g,'').replace(/[ \t]*\/\/[^\r\n]*/g,'').replace(/\r\n/g,'\n');
 const labels=['Logs','Last change','Who is affected'];
 const clues=sheet.slice(cluesAt,sheet.indexOf('ROOT CAUSE')).split(/\r?\n/).filter(line=>/^Clue [123]/.test(line)).map((line,i)=>`${labels[i]}: ${line.split('→')[1]?.trim()}`);
 if(clues.length!==3||clues.some(line=>line.includes('undefined')))throw new Error('Invalid bug clues');
 return {brief,code,clues};
}
export function appendRequestedClues(reply:string,requested:number[],sheet:string){
 const {clues}=bugParts(sheet);
 return [reply,...[...new Set(requested)].filter(n=>[1,2,3].includes(n)).sort().map(n=>clues[n-1])].join('\n\n');
}
export function hasUnrequestedEvidence(reply:string){
 return /wrong password|account not found|ravi|capital|lowercase|lower.case|upper.case|mixed.case|case.insensitive|exact.match|toLowerCase|email|database|lookup|auth flow|new line|password.{0,20}check|check.{0,20}password|logs?\s+(show|say|confirm)|release\s+(touched|changed)|no\s+(exact\s+)?details|details.{0,30}(available|unavailable)|release specifics/i.test(reply);
}
export const KAVYA_OPENING="Since the 10 am release, some users get 'Account not found' on login. Tickets are piling up and I need an update by 1 pm. Can you look into it?";
export const KAVYA_TRAP='Users are locked out, so just send password reset links to everyone affected. Do it now.';
export function introduceKavyaTrap(messageNumber:number,alreadyPushed:boolean,proposesFix:boolean,askedLogsOrChange:boolean){
 return messageNumber>1&&!alreadyPushed&&(messageNumber>=3||(proposesFix&&!askedLogsOrChange));
}
