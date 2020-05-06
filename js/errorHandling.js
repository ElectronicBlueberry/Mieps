/**
 * report a critical error that keeps the program from functioning, and crash.
 * It is usually only used in internal errors. Plugins shouldn't ever crash the bot
 * @param error Error that caused the crash
 */
export function criticalError(error) {
    console.log('\x1b[31m%s\x1b[0m', "CRITICAL ERROR! Message:\n");
    console.error(error.message);
    process.exit(1);
}
/**
 * report a critical error that keeps a plugin from functioning, and deactivate it.
 * @param errorMsg the Error Message to send
 * @param plugin the plugin that threw the error
 */
export function criticalPluginError(errorMsg, plugin) {
}
//# sourceMappingURL=errorHandling.js.map