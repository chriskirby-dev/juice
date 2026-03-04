/**
 * Worker thread utilities for CPU core detection.
 * Provides cross-environment methods to determine available CPU cores for worker threads.
 * @module Workers/Helper
 */

/**
 * Detects the number of available CPU cores across different environments.
 * @returns {Promise<number>} Number of available CPU cores
 * @example
 * const cores = await getAvailableCores(); // Returns 4, 8, etc.
 */
export async function getAvailableCores() {
    // Browser: navigator.hardwareConcurrency
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency;
    }

    // Node.js (modern): os.availableParallelism()
    try {
<<<<<<< HEAD
        let os = await import("os");
        os = os.default;
=======
        const osi = await import("os");
        os = osi.default;
>>>>>>> 7a5a1e84a8e673f92a68aa68b275825c9c217282
        if (typeof os.availableParallelism === "function") {
            return os.availableParallelism();
        }
        if (Array.isArray(os.cpus)) {
            return os.cpus().length;
        }
    } catch (e) {
        // Likely not Node.js, or restricted environment
    }

    // Fallback for unknown environments
    return 1;
}
