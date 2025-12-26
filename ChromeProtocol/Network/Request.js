/**
 * NetworkRequest class for tracking and analyzing network requests in Chrome DevTools Protocol.
 * Automatically detects login requests by analyzing POST data for username/password fields.
 * @module ChromeProtocol/Network/Request
 */

import EventEmitter from "events";

/**
 * Common password field names used for login detection.
 * @constant {string[]}
 */
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

/**
 * Common username field names used for login detection.
 * @constant {string[]}
 */
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

/**
 * Represents a network request tracked through Chrome DevTools Protocol.
 * @class NetworkRequest
 * @extends EventEmitter
 * @fires NetworkRequest#chunk - Emitted when a data chunk is received
 * @fires NetworkRequest#response - Emitted when response headers are received
 * @fires NetworkRequest#finished - Emitted when request completes
 */
class NetworkRequest extends EventEmitter {
    /**
     * Reference to the Network domain wrapper.
     * @type {Network}
     * @static
     */
    static Network;
    
    cookies;
    bytes = 0;
    data = {};

    /**
     * Creates a new NetworkRequest instance.
     * @param {Object|string|number} request - Request data or request ID
     */
    constructor(request) {
        super();
        if (typeof request == "string" || typeof request == "number") {
            this.id = request;
        } else {
            this.id = request.requestId;
            this.data = request;
        }
    }

    /**
     * Gets the request headers.
     * @returns {Object} The headers object
     */
    get headers() {
        return this.request?.headers;
    }

    /**
     * Gets the request URL.
     * @returns {string} The request URL
     */
    get url() {
        return this.data.request.url;
    }

    /**
     * Gets the HTTP method.
     * @returns {string} The HTTP method (GET, POST, etc.)
     */
    get method() {
        return this.data.request.method;
    }

    /**
     * Gets the resource type.
     * @returns {string} The resource type (Document, Stylesheet, Script, etc.)
     */
    get type() {
        return this.data.type;
    }

    /**
     * Gets the full request data.
     * @returns {Object} The complete request data
     */
    get request() {
        return this.data;
    }

    /**
     * Gets the parsed POST data.
     * @returns {Object} Parsed POST data or original data
     */
    get postData() {
        return typeof this.data.request.postData == "string"
            ? JSON.parse(this.data.request.postData)
            : this.data.request.postData;
    }

    /**
     * Gets the POST data field names.
     * @returns {string[]} Array of field names
     */
    get postDataFields() {
        return Object.keys(this.postData || {});
    }

    /**
     * Checks if this request appears to be a login attempt.
     * Analyzes POST data for username and password fields.
     * @returns {boolean} True if login detected
     */
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

    /**
     * Gets the response body for this request.
     * @returns {Promise<string>} The response body
     */
    body() {
        return this.constructor.Network.getResponseBody(this.id);
    }

    /**
     * Sets request data for a specific stage.
     * @param {Object} data - The data to set
     * @param {string} stage - The request stage ('willBeSent' or 'extra')
     */
    setData(data, stage) {
        if (stage == "willBeSent") {
            this.data = data;
        } else if (stage == "extra") {
            this.extra = data;
        }
    }

    /**
     * Adds received data chunk size to total bytes.
     * @param {number} bytes - Number of bytes received
     * @fires NetworkRequest#chunk
     */
    addChunkSize(bytes) {
        this.bytes += bytes;
        this.emit("chunk");
    }

    /**
     * Marks the request as failed.
     */
    failed() {
        this.fail = true;
    }

    /**
     * Sets the response data.
     * @param {Object} response - The response data
     * @fires NetworkRequest#response
     */
    setResponse(response) {
        this.response = response;
        this.emit("response", response);
        if (!this.finished) this.complete();
    }

    /**
     * Marks the request as complete.
     * @fires NetworkRequest#finished
     */
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