import render from "./Render.mjs";
import { type, empty, equals } from '../Util/Core.mjs';

//pairs Childpatches, childnodes
const zip = (xs, ys) => {
    const zipped = [];  
    for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
        zipped.push([xs[i], ys[i]]);
    }
    return zipped;
};

/*
This code is comparing two objects (oldAttrs and newAttrs) to identify which attributes need to be updated or deleted 
based on differences between the two. It then creates a set of "patches" that can be applied to the individual node, 
updating and/or deleting the attributes as needed. The app.log() lines are commented out, but appear to be used for debugging purposes.
*/

const diffAttrs = (oldAttrs={}, newAttrs={}) => {
    const patches = [];
   // app.log('diffAttrs',oldAttrs, newAttrs);

    const oldKeys = Object.keys(oldAttrs);
    const newKeys = Object.keys(newAttrs);

    const updates = newKeys.filter( k => !oldKeys.includes(k) || oldAttrs[k] !== newAttrs[k] );
    const deletions = oldKeys.filter(k => !newKeys.includes(k));

   // console.log('ATTR UPDATES', updates)

    // setting newAttrs
    for ( const k of updates ) {
        patches.push($node => {
            $node.setAttribute( k, newAttrs[k] );
            return $node;
        });
    }

    // removing attrs
    for ( const k of deletions ) {
        
        patches.push($node => {
           // app.log('Deleting Attribute', k );
            $node.removeAttribute(k);
            return $node;
        });
    }
    
   // app.log('Attribute Patches', patches);

    return $node => {
       //app.log($node, 'diffAttrs',patches);
        for (const patch of patches) {
            patch($node);
        }
        return $node;
    };
};

/*
This code is used to compare old virtual children with new virtual children and output the differences in form of a patch.
 The first loop compares every old virtual child with its respective new virtual child and stores the differences in the "childPatches" array. 
 The second loop helps if there are new virtual children which were not present earlier and stores the changes in the
 "additionalPatches" array. Finally it returns a patch representing both the results from the two loops.
*/

const diffChildren = (oldVChildren=[], newVChildren=[]) => {
   // app.log('diffChildren', oldVChildren, newVChildren);
    const childPatches = [];
    oldVChildren.forEach((oldVChild, i) => {
        childPatches.push(diff(oldVChild, newVChildren[i]));
    });

    const additionalPatches = [];
    for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
        additionalPatches.push($node => {
            $node.appendChild(render(additionalVChild));
            return $node;
        });
    }
    
    return $parent => {
       // app.log($parent,'initDiffChildren',childPatches, additionalPatches );
        // since childPatches are expecting the $child, not $parent,
        // we cannot just loop through them and call patch($parent)
        for (const [patch, $child] of zip(childPatches, $parent.childNodes)) {
            patch($child);
        }

        for (const patch of additionalPatches) {
            patch($parent);
        }
        //app.log($parent);
        return $parent;
    };
};

/*
 This function is used to find the difference between two virtual trees (oldVTree and newVTree). 
 The function checks if a node exists in oldVTree, but not in newVTree, if yes it removes it; 
 if there is a difference between their attributes, it patches them with patchAttrs() 
 and if their children have a different structure, it patches them using the diffChildren() function. 
 It also checks for a special class in the attributes which prevents the node from being updated.
 */

const diff = (oldVTree, newVTree) => {

    //debug('DIFF', oldVTree, newVTree);
/*
    if( type(oldVTree, 'array') || type(newVTree, 'array') ){

        if(!type(oldVTree, 'array') && !empty(oldVTree) ) oldVTree = [oldVTree];
        if(!type(newVTree, 'array') && !empty(newVTree)  ) newVTree = [newVTree];

        const resp = [];
        while( oldVTree.length || newVTree.length ){
            resp.push(diff(oldVTree.shift(), newVTree.shift()));
        }
        return $node => {

        };
    }
*/

    //If no old tree exists then render the whole stack.
    if (!oldVTree) return $node => {
        const $newNode = render(newVTree);
        $node.appendChild($newNode);
        return $newNode;
    };

    //If no new tree exists then.remove the hole stack.
    if (!newVTree) return $node => $node.remove();

    //If either old tree or new tree is a string.
    if (typeof oldVTree === "string" || typeof newVTree === "string") {
        //If new stream.does not equal old stream then replace it
        //Else Keep the old node.
        return !equals(oldVTree, newVTree ) ? $node => {
            const $newNode = render(newVTree);
            $node.replaceWith($newNode);
            return $newNode;
        } : $node => $node;
    }

    if (!equals(oldVTree.tag, newVTree.tag )) {
        //If TagNames are different replace node.
        return $node => {
            const $newNode = render(newVTree);
            $node.replaceWith($newNode);
            return $newNode;
        };
    }        

    //Both Exist are NOT Strings and same tagName
    //Create Attr Patch
    const patchAttrs = diffAttrs(oldVTree.attrs, newVTree.attrs);
   // console.log('SAME ELEMENT');
    //If element class includes vdom-noupdate skip
    if(oldVTree?.attrs?.class?.includes('vdom-noupdate')) {
        return ($node) => {
            patchAttrs($node);
            return $node;
        };
    }   


    const patchChildren = diffChildren(oldVTree.children, newVTree.children);

    return $node => {
        patchAttrs($node);
        patchChildren($node);
        return $node;
    };
};

export default diff;
