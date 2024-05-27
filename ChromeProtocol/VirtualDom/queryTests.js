import parseSelectorString from './Query.js';

let parsed = parseSelectorString(':is(div#my-div.my-0class + span, ol[attr="hello"], ul[attr="world"])');
console.log(parsed);
parseSelectorString('div > #myId + .class ~ span:first-child, #is2.test2');