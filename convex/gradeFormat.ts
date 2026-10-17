export function gradeResponseFormat(quotes:string[]){
 if(!quotes.length)throw new Error('Invalid grade');
 return {type:'json_schema',json_schema:{name:'ticket_grade',strict:true,schema:{type:'object',properties:{score:{type:'integer',minimum:1,maximum:10},quoteIndex:{type:'integer',enum:quotes.map((_,i)=>i)},reason:{type:'string'}},required:['score','quoteIndex','reason'],additionalProperties:false}}};
}
export function restoreGradeQuote(content:string,quotes:string[]){
 const parsed=JSON.parse(content);
 if(!Number.isInteger(parsed.quoteIndex)||parsed.quoteIndex<0||parsed.quoteIndex>=quotes.length)throw new Error('Invalid grade');
 return JSON.stringify({score:parsed.score,quote:quotes[parsed.quoteIndex],reason:parsed.reason});
}
