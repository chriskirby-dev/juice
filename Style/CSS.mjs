/**
 * CSS stylesheet management with vendor prefixing support.
 * @module Style/CSS
 */

import Browser from '../Client/Browser.mjs';
import Styles from './Styles.mjs';

import CssParser from './Parser.mjs';

const scopes = {
	[document]: {
		sheets: {}
	}
};

const head = document.head || document.getElementsByTagName('head')[0];

const btypes = ['-webkit-', '-moz-', '-o-', '-khtml-', '-ms-'];

const prefixed = ['animation', 'animation-name', 'animation-duration', 'animation-timing-function', 
'animation-iteration-count', 'animation-delay', 'transform', 'transform-origin', 'perspective', 
'transform', 'transition', 'transition-duration', 'transition-delay', 'transition-property', 'transition-timing-function',
'user-select', 'box-shadow'];

let activeSheet = null;
const browserPrefix = null;

/**
 * Gets or creates a style scope.
 * @param {Document} scope - The scope to get or create
 * @returns {Object} The scope object with sheets
 * @private
 */
function getScope(scope){
	const idx = Object.keys(scopes).length;
	if(!scopes[scope]) scopes[scope] = { id: `s-${idx}`, sheets: {} }
	return scopes[scope];
}

class Style {

	type="class";
	properties = {};

	constructor( className, props ){
		this.properties = props;
		if(className.indexOf('@keyframes') != -1){
			this.type="keyframes";
		}

		if( browserPrefix ){

		}
	}

	static prefix( _props ){
		var props = {};
		for(prop in _props){
			if(typeof _props[prop] == 'object'){
				props[prop] = Style.prefix(_props[prop]);
			}else{
				var k = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
				if(prefixed.indexOf(k) != -1){
					props[k] = _props[prop];
					if(Browser.prefix && Browser.prefix.css) props[Browser.prefix.css+k] = _props[prop];
				}else{
					props[k] = _props[prop];
				}
			}
		}
		return props;
	};

	toText(){
		var txt = "";
		for( let prop in this.properties){
			var k = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
			txt += k;
			if(typeof this.properties[prop] == 'object'){
				txt += '{ '+this.toText(this.properties[prop])+' } ';
			}else{
				txt += ':'+this.properties[prop]+';';
			}
		}app.log( txt );
		
		return txt;
	};

}

class StyleSheetRule {

	rule = null;
	selector = null;
	sheet=null;
	properties = {};
	constructor( StyleRule, index ){
		this.index = index;
		this.selector = StyleRule.selectorText;
		this.sheet = StyleRule.parentStyleSheet;
		this.rule = StyleRule;
		if( StyleRule.style )
		for( let i=0;i<StyleRule.style.length;i++ ){
			const prop = StyleRule.style[i];
			this.properties[prop] = StyleRule.style[prop];
		}
	}

	add(){
		const style = new Style( this.selector, this.properties );
		let propText = style.toText();
		app.log(this.sheet);
		const sheet = new StyleSheet(this.sheet);
		if( this.index === undefined ) this.index = sheet.rules.length;
		const ruleTxt = this.selector + '{ '+ propText +' }';
		this.sheet.insertRule( ruleTxt, this.index );

		//sheet.append( this.selector + '{ '+ propText +' }' );
		const rule = sheet.rules.find( this.selector );
		return rule;
	}

	save(){
		if( this.index ){
			this.delete();
			this.add();
		}else{
			this.add();
		}
	}

	delete( ){
		if( !this.index ) return null;
		if(this.sheet.cssRules) { 
			this.sheet.deleteRule( this.index );
		}else{
			this.sheet.removeRule( this.index );
		}
	}

	set( prop, value ){
		this.properties[prop] = value;
	}

	apply( props ){
		for( let prop in props ){
			this.properties[prop] = props[prop];
		}
	}
}

class StyleSheetRules {

	sheet = null;

	constructor( stylesheet ){
		//app.log('StyleSheetRules', stylesheet );
		this.sheet = stylesheet.sheet || stylesheet;
		this.list = this.sheet.rules || this.sheet.cssRules;
	}

	get length(){
		return this.list.length;
	}

	find( selector ){
		for(var i=0;i<this.list.length;i++)
		if( this.list[i].selectorText == selector ) {
		 const rule = new StyleSheetRule( this.list[i], i );
		 return rule;
		}
		return new StyleSheetRule( { parentStyleSheet: this.sheet, selectorText: selector } );
	}

	add( selector, props ){
		const rule = new StyleSheetRule( { parentStyleSheet: this.sheet, selectorText: selector } );
		rule.properties = props;
		rule.save( this.sheet );
		return rule;
	}

	addMany( list ){
		for( let selector in list ){
			this.add( selector, list[selector] );
		}
	}

	remove( selector ){
		var rule = this.find( selector );
		if(!rule) return null;
		rule.delete();
		return;
	};
}

class StyleSheet {

	dom = null;
	scope = null;
	id = null;
	rules = null;

	constructor( id, scope=document ){
		const sheets = getScope(scope).sheets;
		if(scope !== document) id = getScope(scope).id+'-'+id;
		if( scope ) this.scope = scope;
		if( typeof id == 'string' ){
			this.id = id;
			this.dom = sheets[id] || StyleSheet.find( id, scope ) || StyleSheet.create( id, scope );
		}else if( id && ( id.ownerNode || id.owningElement ) ){
			if(  id.ownerNode ){
				this.id = id.ownerNode.id;
				this.dom = id.ownerNode;
			}else{
				this.id = id.owningElement.id;
				this.dom = id.owningElement;
			}
		}
		this.rules = new StyleSheetRules( this.dom );
		//app.log(this);
	}

	static create( id, scope=document ) {
		// Create the <style> tag
		//app.log('Create Stylesheet');
		//app.log(scope);
		const sheets = getScope(scope).sheets;
		var styleSheet = document.createElement("style");
		styleSheet.id = id;
		styleSheet.type = 'text/css';
		styleSheet.disabled = false;
		if(styleSheet.styleSheet){
			styleSheet.styleSheet.cssText = "";
		}else{
			styleSheet.appendChild(document.createTextNode(""));
		}

		let parentElement = scope.querySelector('#style-box');
		if(!parentElement) parentElement = scope === document ? document.getElementsByTagName('head')[0] : scope;
		
		parentElement.appendChild( styleSheet );
		
		sheets[id] = styleSheet;
		return styleSheet;
	}

	static find( id, scope=document ){

		let styleSheet;
		const sheets = getScope(scope).sheets;
		if(sheets[id]) return sheets[id];

		var ss = scope.styleSheets;
		for(var i = 0; i < ss.length; ++i){
			if(ss[i].ownerNode && ss[i].ownerNode.id == id){
				styleSheet = ss[i];
				break;
			}else if (ss[i].owningElement && ss[i].owningElement.id == id) {
				styleSheet = ss[i];
				break;
			}
		}

		if( styleSheet ) sheets[id] = styleSheet;
		return styleSheet;

	};


	append( content ){
		const styleSheet = this.dom;
	//	console.dir(styleSheet);
		if(typeof content == 'object') content = CssParser.toText(content);
	//	console.dir(content);
		if(typeof content == 'string'){
			content += " \n";
			if(styleSheet.styleSheet){
				styleSheet.styleSheet.cssText += content;
			}else{
				styleSheet.appendChild(document.createTextNode(content));
			}
		}
	}

	clear(){
		const styleSheet = this.dom;
		if(styleSheet.styleSheet){
			styleSheet.styleSheet.cssText = "";
		}else{
			styleSheet.innerHTML = "";
			styleSheet.appendChild(document.createTextNode(""));
		}
	}

	replace( content ){
		this.clear();
		this.append( content );
	}


}

class CSS {
	
	static sheets = [];

	static get tags(){
		return document.styleSheets;
	}

	static StyleSheet( id, scope ){
		return new StyleSheet( id, scope );
	}

	static use( id='default', scope=document ){
		const sheets = getScope(scope).sheets;
		if(!sheets[id]){
			if(!StyleSheet.find( id, scope )) StyleSheet.create( id, scope );
		}

		return new StyleSheet(id, scope);
	};

}

export default CSS;