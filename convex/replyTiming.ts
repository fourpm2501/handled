export function replyTiming(scenario?:'quickbite'|'bugticket'){
 return scenario==='bugticket'
  ?{limitMs:180000,timeoutText:'[No reply within 3 minutes]'}
  :{limitMs:90000,timeoutText:'[No reply within 90 seconds]'};
}
