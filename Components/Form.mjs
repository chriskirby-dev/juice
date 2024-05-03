import Component from './Component.mjs';

class FormInput extends Component.HTMLElement {

    static config = {
        properties: {

        }
    }

    static get style(){
        return [{

        }];
    }

    static html(){
        return `<slot></slot>`;
    }

    onFirstConnect(){

        this.native = this.querySelector('input, select');
        this.nativeTag = this.native.tagName.toLowerCase();

        if(this.nativeTag === 'select'){
            if(this.hasAttribute('value')){
                this.native.querySelector('option[value="' + this.getAttribute('value') + '"]').selected = true;
            }
            this.native.addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('change', { detail: e.target.value }));
            });
        }

        if(this.parentNode.classList.contains('row')){
            const childLen = this.parentNode.children.length;
            if(childLen > 1){
                this.style.width = `calc( ${100/childLen}% - ${childLen}rem )`;
            }
        }
        

        console.log(this.native);
    }
}

customElements.define('form-input', FormInput);