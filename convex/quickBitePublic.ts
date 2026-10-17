// Only this view goes to the fresher. The saved sheet used by AI stays intact.
export function quickBitePublic(sheet:string):string {
 const allowed=new Set(['SCENARIO','CUSTOMER','RULES']);
 const sections:string[]=[];let heading='';let lines:string[]=[];
 const flush=()=>{if(allowed.has(heading))sections.push(lines.join('\n').trim());};
 for(const line of sheet.split(/\r?\n/)){
  if(/^[A-Z][A-Z 0-9,–-]+$/.test(line)){flush();heading=line;lines=[line];}
  else if(heading)lines.push(line);
 }
 flush();return sections.join('\n\n');
}
