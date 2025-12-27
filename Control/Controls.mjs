/**
 * Control input aggregator providing keyboard and mouse controllers.
 * Central access point for input control systems.
 * @module Control/Controls
 */

import Keyboard from "./Keyboard.mjs";
import Mouse from "./Mouse.mjs";

const keyboard = new Keyboard();
const mouse = new Mouse();

export default {
    keyboard,
    mouse,
};