/**
 * Query tests for virtual DOM query functionality.
 * Test suite for VirtualDom query operations.
 * @module ChromeProtocol/VirtualDom/queryTests
 */

import parseSelectorString from './Query.js';

let parsed = parseSelectorString(':is(div#my-div.my-0class + span, ol[attr="hello"], ul[attr="world"])');
console.log(parsed);
parseSelectorString('div > #myId + .class ~ span:first-child, #is2.test2');
