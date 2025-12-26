/**
 * Configuration module for Juice framework.
 * Provides a centralized configuration system using dot notation for property access.
 * @module Configuration
 */

import DotNotation from "./Util/DotNotation.mjs";

const root = window || global;

/**
 * Default configuration object for the Juice framework.
 * Can be overridden by setting window.JUICE_CONFIG or global.JUICE_CONFIG.
 * @type {Object}
 */
const DEFAULT_CONFIG = {
    version: "1.0.0",
    description: "",
    repository: {},
    homepage: "",
    license: "ISC",
    dependencies: {},
};

// Merge global JUICE_CONFIG if it exists
if (root.JUICE_CONFIG) {
    Object.assign(DEFAULT_CONFIG, root.JUICE_CONFIG);
}

/**
 * Global configuration instance using DotNotation for nested property access.
 * @type {DotNotation}
 * @example
 * import config from './Configuration.mjs';
 * config.set('paths.root', '/app');
 * const rootPath = config.get('paths.root');
 */
export default new DotNotation(DEFAULT_CONFIG);