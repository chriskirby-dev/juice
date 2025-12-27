/**
 * Virtual DOM utility functions for node cleaning and manipulation.
 * Provides helper functions for DOM node processing and normalization.
 * @module VirtualDom/Util
 */

/*
This function recursively removes any "nodeType" that is equal to 8 or 3, 
and includes a new line (\n) from a given node object. 
It will then decrement the "n" value of the for loop in order to take into account the removal of a node. 
If the nodeType is 1, the function will recursively call itself until all undesired elements are removed.
*/

/**
 * Recursively removes comment and empty text nodes from a DOM tree.
 * @param {Node} node - The DOM node to clean
 * @returns {Node} The cleaned node
 */
export function clean(node)
{
  for(var n = 0; n < node.childNodes.length; n ++)
  {
    var child = node.childNodes[n];
    if
    (
      child.nodeType === 8 
      || 
      (child.nodeType === 3 && !/\S/.test(child.nodeValue) && child.nodeValue.includes('\n'))
    )
    {
      node.removeChild(child);
      n --;
    }
    else if(child.nodeType === 1)
    {
      clean(child);
    }
  }
}

export function getnodeType(node) {
  if(node.nodeType==1) return node.tagName.toLowerCase();
  else return node.nodeType;
};