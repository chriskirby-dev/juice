import vElement from './Element.mjs';
import Parser from './Parser.mjs';

import {type,empty} from '../Util/Core.mjs';

function mount(vnode, container){
    const el = (vnode.el = document.createElement(vnode.tag))
}

function changed(node1, node2) {
    return typeof node1 !== typeof node2 ||
           typeof node1 === 'string' && node1 !== node2 ||
           node1.type !== node2.type
}

export const updateElement  = ($parent, newNode, oldNode, index = 0) => {
    if (!oldNode) {
      $parent.appendChild( render(newNode) );
    } else if (!newNode) {
      $parent.removeChild( $parent.childNodes[index] );
    } else if (changed(newNode, oldNode)) {
      $parent.replaceChild( render(newNode), $parent.childNodes[index] );
    } else if (newNode.tag) {
      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;
      for (let i = 0; i < newLength || i < oldLength; i++) {
        updateElement( $parent.childNodes[index], newNode.children[i], oldNode.children[i], i );
      }
    }
  }
  

const renderEl = ( vNode, refs = null ) => {
    if(!vNode) return document.createTextNode('');

    if(type(vNode,'string')) return document.createTextNode(vNode);
    else if(type(vNode,'array')){
      const fragment = document.createDocumentFragment();
      vNode.forEach( node => fragment.append( renderEl(node) ) );
      return fragment;
    }

    if(!vNode.tag) return '';

    let el = vNode.ns ? document.createElementNS(vNode.ns, vNode.tag) : document.createElement(vNode.tag);
    
    if( vNode.attrs || vNode.attributes ){
      const attrs = vNode.attrs || vNode.attributes;

      for(const [k,v] of Object.entries( attrs ) ){
        if( refs && k == 'ref') refs[k] = el;
       // console.log(el);
        try{
          el.setAttribute( k, v );
        }catch(e){
          console.warn(e);
        }
      }
      
    }

    if(vNode.events){
      for(let event in vNode.events){
        el.addEventListener( event, vNode.events[event], false )
      }
    }
    
    let children = vNode.children || vNode.content || [];

    if(typeof children == 'string') children = [children];

    for(const child of children ){
        const _child = renderEl( child, refs );

          el.appendChild( _child );
  
    }

    return refs ? [el, refs] : el;
}

const render = ( vNode ) => {
    if(type(vNode, 'array')){

    }else if(type(vNode, 'string')){
      return document.createTextNode( vNode );
    }

    return renderEl( vNode );
}

export const renderWithRefs = ( vNode, refs={} ) => {
  if( typeof vNode === 'string' ){
      return document.createTextNode( vNode );
  }
  return renderEl( vNode, {} );
}


export default render;