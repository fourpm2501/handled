import React from 'react';
import './homeContext.css';
export default function HomeContext({handledLine}:{handledLine:string}){
 return <section className="home-context" aria-labelledby="home-context-title">
  <h2 id="home-context-title">AI writes more of the code now. Engineers still make the calls.</h2>
  <dl>
   <div><dt>What's changing</dt><dd>AI tools now write much of the everyday code, from a login screen to the first draft of a fix.</dd></div>
   <div><dt>What's left for engineers</dt><dd>Someone still has to read the logs, find what actually broke, and decide whether the quick fix is safe to ship.</dd></div>
   <div><dt>What Handled does</dt><dd>{handledLine}</dd></div>
  </dl>
 </section>;
}
