/**
 * CSS custom properties (variables) utilities.
 * Provides methods for getting, setting, and removing CSS variables.
 * @module Style/CSSVars
 */

/**
 * Utilities for managing CSS custom properties.
 * @class CSSVars
 */
class CSSVars {
    static get(name, element = document.documentElement) {
        return window.getComputedStyle(element).getPropertyValue(`--${name}`);
    }
    
    static set(name, value, element = document.documentElement) {
        element.style.setProperty(`--${name}`, value);
    }
    
    static remove(name, element = document.documentElement) {
        element.style.removeProperty(`--${name}`);
    }
}

export default CSSVars;