import EventEmitter from "events";

const PASSWORD_ALIASES = [
    "pass",
    "password",
    "pwd",
    "passwd",
    "pw",
    "pwrd",
    "pwd",
    "passwd",
    "pwd",
    "passwd",
    "pwd",
    "passwd",
    "pwd",
    "passwd",
    "pwd",
];
const USERNAME_ALIASES = [
    "user",
    "username",
    "email",
    "login",
    "name",
    "id",
    "user_id",
    "user_name",
    "user_email",
    "user_login",
    "user_name",
    "user_id",
    "user_name",
    "user_id",
    "user_name",
];

class NetworkRequest extends EventEmitter {
    static Network;
    cookies;
    bytes = 0;
    data = {};

    constructor(request) {
        super();
        if (typeof request == "string" || typeof request == "number") {
            this.id = request;
        } else {
            this.id = request.requestId;
            this.data = request;
        }
    }

    get headers() {
        return this.request?.headers;
    }

    get url() {
        return this.data.request.url;
    }

    get method() {
        return this.data.request.method;
    }

    get type() {
        return this.data.type;
    }

    get request() {
        return this.data;
    }

    get postData() {
        return typeof this.data.request.postData == "string"
            ? JSON.parse(this.data.request.postData)
            : this.data.request.postData;
    }

    get postDataFields() {
        return Object.keys(this.postData || {});
    }

    get isLogin() {
        if (this.data.request?.hasPostData) {
            //console.log("post data", this.data.request?.postData);
            if (!this.data.request?.postData) return false;
            let rawData = this.data.request.postData;
            let isJSON = false;
            try {
                rawData = JSON.parse(rawData);
                isJSON = true;
            } catch (e) {}
            if (!isJSON) return false;
            const postDataFields = Object.keys(rawData);
            if (
                postDataFields.some((entry) => USERNAME_ALIASES.includes(entry)) &&
                postDataFields.some((entry) => PASSWORD_ALIASES.includes(entry))
            ) {
                //Login Dected
                const username_field = postDataFields.find((entry) => USERNAME_ALIASES.includes(entry));
                const password_field = postDataFields.find((entry) => PASSWORD_ALIASES.includes(entry));
                this.loginData = {
                    username: this.postData[username_field],
                    password: this.postData[password_field],
                    username_field,
                    password_field,
                };
                //debug('Login Detected', this.loginData);
                return true;
            }
        }
        return false;
    }

    body() {
        return this.constructor.Network.getResponseBody(this.id);
    }

    setData(data, stage) {
        if (stage == "willBeSent") {
            this.data = data;
        } else if (stage == "extra") {
            this.extra = data;
        }
    }

    addChunkSize(bytes) {
        this.bytes += bytes;
        this.emit("chunk");
    }

    failed() {
        this.fail = true;
    }

    setResponse(response) {
        this.response = response;
        this.emit("response", response);
        if (!this.finished) this.complete();
    }

    complete() {
        const { Network } = this.constructor;
        this.finished = true;
        const { response } = this;

        this.statusCode = response.status;

        this.emit("finished");

        //debug('COMPLETE', this, this.isLogin ? 'is login':'');
    }
}

export default NetworkRequest;
