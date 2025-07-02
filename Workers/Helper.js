export async function getAvailableCores() {
    // Browser: navigator.hardwareConcurrency
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency;
    }

    // Node.js (modern): os.availableParallelism()
    try {
        const os = await import("os");
        os = os.default;
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
