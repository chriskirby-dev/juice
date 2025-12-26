class AssetType {
    width = 0;
    height = 0;

    constructor(source) {
        this.source = source;
    }

    type() {
        if(this._type) return this._type;
        if( typeof this.source == "string" ) {

        }else if(this.source instanceof HTMLImageElement) {

        }else if(this.source instanceof HTMLCanvasElement) {

        }else if(this.source instanceof HTMLVideoElement) {

        }else if(this.source instanceof HTMLAudioElement) {

        }else if(this.source instanceof Blob) {

        }else if(this.source instanceof File) {

        }else if(this.source instanceof ImageData) {

        }else if(this.source instanceof ArrayBuffer) {

        }else if()
    }
}