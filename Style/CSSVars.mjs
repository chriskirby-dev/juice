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