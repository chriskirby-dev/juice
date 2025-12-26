import Component from "../Component.mjs";

export class BaseInput extends Component.HTMLElement {
    static tag = "form-field";

    // delegatesFocus = true;

    static get formAssociated() {
        return true;
    }

    static baseConfig = {
        shadow: true,
        closed: true,
        debug: false,
        properties: {
            name: { linked: true },
            required: { linked: true },
            label: { linked: true },
            value: { linked: true, default: "" },
            default: { linked: true },
            empty: { linked: true },
            pattern: { linked: true },
            placeholder: { linked: true },
        },
    };

    // Override in order to listen to attribute changes
    static get observedAttributes() {
        let attrs = ["name", "value", "required", "label", "default", "pattern", "placeholder"];
        if (this.observed) {
            if (this.observed.attributes) attrs = attrs.concat(this.observed.attributes);
        }
        return attrs;
    }

    //Any properties listed will invoke onPropertyChanged callback
    static get observedProperties() {
        let props = ["name", "value", "required"];
        if (this.observed && this.observed.properties) {
            props = props.concat(this.observed.properties);
        }
        return props;
    }

    label = null;
    customFormElement = true;

    constructor() {
        super();
        // Get access to the internal form control APIs
        this.internals = this.attachInternals();
        // internal value for this control
        this.value_ = "";

        if (this.hasAttribute("value")) {
            this.value_ = this.getAttribute("value");
        }
    }

    idFromName(name) {
        return "input--" + name.replace("_", "-");
    }

    beforeRender(vdom) {
        /*
      if(this.hasAttribute('label') && !this.label ){
          this.label = this.getAttribute('label');
          this.removeAttribute('label');
          this.render();
          return false;
      }*/
        return vdom;
    }

    get required() {
        return this._required;
    }

    set required(isRequired) {
        this._required = isRequired;
        this.internals.ariaRequired = isRequired;
    }

    beforeFirstRender() {
        if (this.hasAttribute("label")) {
            this.label = this.getAttribute("label");
        } else if (this.querySelector('[slot="label"]')) {
            this.label = this.querySelector('[slot="label"]').innerText;
            this.removeChild(this.querySelector('[slot="label"]'));
        }
    }

    static get style() {
        return [
            {
                ":host": {
                    marginBottom: "1rem",
                },
                ".status-wrapper": {
                    borderTopRightRadius: "var(--input-border-radius)",
                    overflow: "hidden",
                    height: "30px",
                    width: "30px",
                    position: "absolute",
                    right: 0,
                    top: 0,
                },
                ".status": {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    zIndex: 100,
                    height: "30px",
                    width: "30px",
                    overflow: "hidden",
                    color: "#FFF",
                },
                ".status status-icon": {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    zIndex: 500,
                    transformOrigin: "center center",
                    transform: "scale(0)",
                    transition: "transform 0.3s ease 0s",
                },
                ".status .bg": {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    left: "100%",
                    transition: "left 0.4s ease 0.5s",
                },
                ".status .bg:before": {
                    content: '""',
                    display: "block",
                    width: "100%",
                    height: "140%",
                    left: "50%",
                    transformOrigin: "left top",
                    transform: "rotate(-45deg)",
                    backgroundColor: "var(--color-dark-gray)",
                },
                ".initial .status .bg": {
                    left: "100%",
                },
                ":not(.initial) .status .bg": {
                    left: "calc(100% - 30px)",
                },
                ".initial .status .bg:before": {
                    backgroundColor: "transparent",
                },
            },
        ];
    }

    wrapper(input) {
        return `
      <div class="initial">
        <div class="status-wrapper">
          <div class="status">
            ${
                this.hasAttribute("error")
                    ? `
            <status-icon size="16.25" delay="500" state="error" color="#FFFFFF"></status-icon>
            `
                    : `
            <status-icon size="16.25" color="#FFFFFF"></status-icon>
            `
            }
            <div class="bg"></div>
          </div>
        </div>
      ${this.label ? `<label for="input" id="label" >${this.label || ""}</label>` : ""}
      ${input}
      </div>
      `;
    }
    /*
    // Form controls usually expose a "value" property
    get value() { return this.value_; }
    
    set value(v) { 
      console.log('SET Value', v, this.value_ );
      if( this.value_ == v ) return false;
      
      this.value_ = v; 

      this.internals.setFormValue(this.value_);
      if(this.onValueChange) this.onValueChange(this.value_);
     // this.internals_.setValidity({});
      if(this.native){
        this.native.value = this.value;
        this.native.dispatchEvent(new Event('input'));
        this.native.dispatchEvent(new Event('change'));
      }

      this.dispatchInput();
      this.dispatchChange();
      
      console.log('value set');
      return this.value_;
    }
*/

    dispatchInput() {
        this.dispatchEvent(new CustomEvent("input", { details: { value: this.value } }));
    }

    dispatchChange() {
        this.dispatchEvent(new CustomEvent("change", { details: { value: this.value } }));
    }

    get form() {
        return this.internals.form;
    }

    get type() {
        return this.localName;
    }

    get name() {
        return this.getAttribute("name");
    }
    set name(value) {
        console.log("set name", value);
        this.setAttribute("name", value);
    }

    get validity() {
        return this.internals.validity;
    }
    get validationMessage() {
        return this.internals.validationMessage;
    }
    get willValidate() {
        return this.internals.willValidate;
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }

    checkValidity() {
        return this.internals.checkValidity();
    }
    reportValidity() {
        return this.internals.reportValidity();
    }

    onFirstConnect() {
        // console.log('onFirstConnect', this.constructor.name, this.children.length );
        // console.log(this.children);
        /********************************
         * SET HIDDEN NATIVE FORM INPUT *
         ********************************/
        const hiddenSlot = this.querySelector('slot[name="hidden"]');
        if (hiddenSlot) hiddenSlot.style.display = "none";

        if (this.hasAttribute("value")) {
            this.value_ = this.getAttribute("value");
        }

        if (this.hasAttribute("name")) {
            //Has Attribute Name part of form...
            this._name = this.getAttribute("name");

            if (!this.id) this.id = "input--" + this._name.replace(/[_]/g, "-");

            if (this.useNative !== false && !this.native) {
                this.native = this.querySelector("input");

                if (!this.native) {
                    const native = document.createElement("input");
                    native.type = this.type == "checkbox" ? "checkbox" : "text";
                    this.appendChild(native);
                    this.native = native;
                }

                this.native.setAttribute("slot", "hidden");
                this.native.setAttribute("autocomplete", "off");
                this.native.tabIndex = -1;
                this.native.value = this.value || "";
                this.native.name = this.getAttribute("name");
                this.native.style.display = "none";

                this.tabIndex = 0;

                this.native.addEventListener("input", (e) => {
                    this.value = this.native.value;
                });

                this.native.addEventListener(
                    "focus",
                    (e) => {
                        //console.dir(this);
                        this.focus();
                    },
                    false
                );

                this.addEventListener(
                    "focus",
                    (e) => {
                        this.classList.add("focus");
                        if (this.onFocus) this.onFocus(e);
                    },
                    false
                );

                this.addEventListener(
                    "blur",
                    (e) => {
                        this.classList.remove("focus");
                        if (this.onBlur) this.onBlur(e);
                    },
                    false
                );

                if (this.hasAttribute("required")) {
                    this.native.setAttribute("required", "");
                }
            }

            if (this.hasAttribute("autocomplete") && this.getAttribute("autocomplete") == "off") {
                this.native.setAttribute("autocomplete", "off");
            }
        }

        this.classList.add("custom-control");

        //this.setAttribute('tabindex', 0);
    }

    onAttributeChanged(property, old, value) {
        // console.log('onAttributeChanged FBC',property, old, value);
        switch (property) {
            case "value":
                this.value = value;
                break;
        }
    }

    onPropertyChanged(property, old, value) {
        //  console.log('onPropertyChanged FBC',property, old, value);
        switch (property) {
            case "value":
                const v = value;
                // console.log('SET Value', v, this.value_ );
                if (this.value_ == v) return false;

                this.value_ = v;

                this.internals.setFormValue(this.value_);
                if (this.onValueChange) this.onValueChange(this.value_);
                // this.internals_.setValidity({});
                if (this.native) {
                    this.native.value = this.value;
                    this.native.dispatchEvent(new Event("input"));
                    this.native.dispatchEvent(new Event("change"));
                }

                this.dispatchInput();
                this.dispatchChange();

                //  console.log('value set');

                break;
        }
    }
}