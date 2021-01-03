import * as Discord from "discord.js"

import { Plugin } from "./plugin.js"


/**
 * Report a critical error that keeps the program from functioning, and crash.
 * This is usually only used for internal errors. Plugins shouldn't ever crash the bot.
 * @param errorMsg additional custom error message
 * @param error error that caused the crash
 */
export function criticalError(errorMsg: string, error?: Error): void
{
	console.log( '\x1b[31m%s\x1b[0m', "CRITICAL ERROR!");
	console.error(errorMsg);

	if (error)
	{
		console.log( '\x1b[31m%s\x1b[0m', "Message:");
		console.error( error.message );
	}

	process.exit(1);
}

/**
 * report a critical error that keeps a plugin from functioning, deactivate it, and set it as unconfigured
 * @param logChannel channel to report error in
 * @param errorMsg the Error Message to send
 * @param plugin the plugin that threw the error
 */
export function criticalPluginError(logChannel: Discord.TextChannel, errorMsg: string, plugin: Plugin): void
{
	// Push Operation to End of Processing Stack, in case plugins fail during init
	setTimeout(() => {
		logChannel.send(`Critical Error in Plugin ${plugin.name}!`);
		logChannel.send(errorMsg);
		logChannel.send(`Deactivating Plugin`);

		plugin.pluginManager.deactivatePlugin(plugin.name);
		plugin.pluginManager.setConfigured(plugin.name, false);
	}, 0);

}

/**
 * Report an error that happend while executing a plugin, but didn't crash it.
 * This is best used with errors caused by commands.
 * @param logChannel channel to report error in
 * @param plugin plugin that threw the error
 * @param error error message, only logged to internal console
 * @param command command that caused the error
 */
export function uncaughtError(logChannel: Discord.TextChannel, name: string, error?: Error | null, command?: string): void
{
	let msg = `Uncaught Error while running ${name}!`;

	if (command)
	{
		logChannel.send( `${msg} Exact command: ${command}` );
	}
	else
	{
		logChannel.send(msg);
	}

	console.log(msg);

	if (error)
	{
		console.error( error.message );
	}
}
