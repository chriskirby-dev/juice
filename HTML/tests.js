/**
 * HTML utility tests.
 * Test suite for HTML processing utilities.
 * @module HTML/tests
 */

import Template from "./Template.mjs";

const loaderFromFileSystem = (filePath) => {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
        return `<!-- Failed to load ${filePath}: ${err.message} -->`;
    }
};

const tpl = `

    {each head as item{
        {{item}}
    }}

    {each{}}

    {each a as b{
    
    }}


    {each scripts as script{
        <script src="{{script}}"></script>
    }}

    {include ../pages/game.tpl{page}}

    {{testvar}}
`;

const engine = new Template({ loader: loaderFromFileSystem });
const rendered = engine.render(tpl, {});

console.log(rendered);
