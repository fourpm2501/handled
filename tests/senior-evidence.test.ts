import {it,expect} from 'vitest';
import {ticketParts,ROLE_CASES} from '../convex/ticketRules';
import {safeEvidence,seniorReply,evidenceResponseFormat,evidenceRequests} from '../convex/seniorEvidence';

it('only tells requested observations and never emits raw clue text, expected answers or fix policies',()=>{
 const ticket=ticketParts('SWE-1');const facts=safeEvidence('SWE-1',ticket.source);
 expect(facts).toHaveLength(7);
 const reply=seniorReply('SWE-1',2,[],facts,['prices'],ticket.trap);
 expect(reply).toContain('"100" and "50"');expect(reply).not.toContain('"0100"');
 const everything=seniorReply('SWE-1',1,[],facts,facts.map(f=>f.id),ticket.trap);
 for(const forbidden of ['150','10:01:','prices=[','types=[','must','should','valid non-negative','root cause','if asked','provide'])expect(everything).not.toContain(forbidden);
 const data=ticketParts('DATA-1');const dataFacts=safeEvidence('DATA-1',data.source);
 expect(dataFacts).toHaveLength(4);
 const rows=seniorReply('DATA-1',2,[],dataFacts,['rows'],data.trap);
 expect(rows).toContain('row 3 cancelled');expect(rows).not.toContain('returned four');
 expect(rows).not.toMatch(/should|expected|must|AND status|return two|count.*zero/i);
});
it('routes question sentences instead of treating preceding assertions as requests',()=>{
 const text='The prices are text and the first value is "0100". Can you confirm any other carts show text prices?';
 expect(evidenceRequests(text)).toEqual(['Can you confirm any other carts show text prices?']);
 expect(evidenceRequests('I would change the calculation and check it.')).toEqual([]);
 expect(evidenceRequests('Can you share the GET /tickets?status=open response?')).toEqual(['Can you share the GET /tickets?status=open response?']);
 const ticket=ticketParts('SWE-1');
 const reply=seniorReply('SWE-1',2,[],safeEvidence('SWE-1',ticket.source),[],ticket.trap,true);
 expect(reply).toContain("I don't have an observed record");expect(reply).not.toContain('C41');
});
it('restricts the evidence selector to supported fact references without generating copied request quotes',()=>{
 const ticket=ticketParts('SWE-2');const facts=safeEvidence('SWE-2',ticket.source);
 const schema=evidenceResponseFormat(facts).json_schema.schema;
 expect(schema.properties.requested.items.properties.fact.enum).toEqual(facts.map(f=>f.id));
 expect(schema.properties.requested.items.required).toEqual(['fact']);
 expect(schema.properties.requested.items.additionalProperties).toBe(false);
});

it('keeps replies to one to three natural sentences and does not repeat questions across a case',()=>{
 for(const caseId of [...ROLE_CASES.software,...ROLE_CASES.data]){
  const ticket=ticketParts(caseId);const facts=safeEvidence(caseId,ticket.source);
  expect(facts.length).toBeGreaterThanOrEqual(3);
  const prior:string[]=[];
  for(let round=0;round<ticket.publicTicket.maxReplies;round++){
   const text=seniorReply(caseId,round,prior,facts,[],ticket.trap);
   expect(text).not.toContain('\n');
   const count=(text.match(/[.!?](?:["']?\s|["']?$)/g)??[]).length;
   expect(count).toBeGreaterThanOrEqual(1);expect(count).toBeLessThanOrEqual(3);
   for(const question of text.match(/[^.!?]*\?/g)??[])expect(prior.some(p=>p.includes(question.trim()))).toBe(false);
   prior.push(text);
  }
  const all=seniorReply(caseId,1,[],facts,facts.map(f=>f.id),ticket.trap);
  expect((all.match(/[.!?](?:["']?\s|["']?$)/g)??[]).length).toBeLessThanOrEqual(3);
  const unavailable=seniorReply(caseId,1,[],facts,[],ticket.trap,true);
  expect((unavailable.match(/[.!?](?:["']?\s|["']?$)/g)??[]).length).toBeLessThanOrEqual(3);
 }
});
