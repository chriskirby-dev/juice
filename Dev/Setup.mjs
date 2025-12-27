/**
 * Development environment setup utilities.
 * Configures development environment and global root access.
 * @module Dev/Setup
 */

const { __filename, __dirname } = currentFile(import.meta.url);

export const root = window || global;

//root.dev =