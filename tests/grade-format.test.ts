import {it,expect} from 'vitest';
import {gradeResponseFormat,restoreGradeQuote} from '../convex/gradeFormat';

it('does not put quoted student prose into strict-schema literals',()=>{
 const quotes=['The log contains "0100" and prices ["100", "50"].','The next value was "010050".'];
 const format=gradeResponseFormat(quotes);
 expect(JSON.stringify(format)).not.toContain('0100');
 expect(JSON.stringify(format)).not.toContain('010050');
});
it('restores the exact selected quote, including quotes and newlines, and rejects invented references',()=>{
 const quotes=['The value is "0100".\nI need the input types.','Second reply'];
 expect(JSON.parse(restoreGradeQuote('{"score":4,"quoteIndex":0,"reason":"Limited evidence"}',quotes)).quote).toBe(quotes[0]);
 expect(()=>restoreGradeQuote('{"quoteIndex":2}',quotes)).toThrow('Invalid grade');
 expect(()=>restoreGradeQuote('{"quoteIndex":"0"}',quotes)).toThrow('Invalid grade');
});
