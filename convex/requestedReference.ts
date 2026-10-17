// Only an explicit request can release the already-public case reference.
// No hidden ticket source is accepted by this helper.
export function asksForReference(text:string){
 const asks=/\?|\b(?:show|share|send|provide|give|see)\b/i.test(text);
 const reference=/\b(?:source code|code|sql|function|current query|original query|current request|original request|request being sent|reference)\b/i.test(text);
 const wantsToSee=/\b(?:show|share|send|provide|give|see|what is|what's|what does)\b/i.test(text);
 return asks&&reference&&wantsToSee&&!/\b(?:hidden|grader|root cause|strong answer)\b/i.test(text);
}
export function withRequestedReference(text:string,reference:string,requested:boolean){
 return requested?`${text}\n\n\`\`\`\n${reference}\n\`\`\``:text;
}
