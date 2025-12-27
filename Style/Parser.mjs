/**
 * CSS/Style parsing utilities for converting between camelCase and dashed property names.
 * Provides parsers for style strings, CSS rules, and style object conversions.
 * @module Style/Parser
 */

/**
 * Converts a camelCase string to dashed-case.
 * @param {string} str - The camelCase string to convert
 * @returns {string} The dashed-case string
 * @example
 * toDashed("backgroundColor") // returns "background-color"
 */
function toDashed( str ){
	return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamel( str ){
	const parts = str.split(/[_-\s]/);
	return parts.shift().toLowerCase() + ( parts.map((part) => {
		return part.charAt(0).toUpperCase() + part.substr(1);
	}).join('') );
	return str.replace();
}

class CssParser {

	static properties(properties){

		if( typeof properties == 'string' ){
			const items = properties.trim().split(';');
			properties = {};
			for( let i=0;i<items.length;i++ ){
				const [ prop, value ] = items[i].trim().split(/(?:\\\:|[^\:])+/);
				properties[toCamel(prop.trim())] = value.trim();
			};
		}
		
		return {
			toText: () => {
				const arr = [];
				for( const property in properties ){
					const propName = toDashed(property);
					arr.push(`	${propName.trim()}: ${properties[property]};`);
				}
				return arr.join(" \n");
			},
			toObject: () => {
				return properties;
			}
		}

	}

	static fromText( cssStyles ){

	}

	static toText( styleObj ){
		let text = '';

		for( const className in styleObj ){
text += `
${className} {
${ this.properties( styleObj[className] ).toText() }
}
`;
		}

		return text;
	}

    static toObject(styleContent){

        var doc = document.implementation.createHTMLDocument(""),
        styleElement = document.createElement("style");

        styleElement.textContent = styleContent;
		// the style will only be parsed once it is added to a document
		doc.body.appendChild(styleElement);

		const styles = {};
		//debug(styleElement.sheet.cssRules);
		for(var i=0;i<styleElement.sheet.cssRules.length;i++){
			const rule = styleElement.sheet.cssRules[i];
			const selector = rule.selectorText;
			const props = {};
			
			if(rule.style){

				const cssText = rule.style.cssText;
				
				const propNames = cssText.substr(0, cssText.length-1).split(';').map((r) => {
					return r.split(':').shift().trim();
				});

				for( let i=0;i<propNames.length;i++ ){
					const prop = propNames[i];
					var priority = rule.style.getPropertyPriority(prop);
					props[prop] = rule.style[prop];
					if(priority !== ''){
						props[prop] += ' !'+priority
					}
				}
			
				styles[selector] = props;
				
			}else if( rule instanceof CSSKeyframesRule ){
				if(!styles['@text']) styles['@text'] = "";
				styles['@text'] += rule.cssText;
			}else if( rule instanceof CSSContainerRule ){
				if(!styles['@text']) styles['@text'] = "";
				styles['@text'] += rule.cssText;
			}
			
		}

		return styles;

    }
};


export default CssParser;