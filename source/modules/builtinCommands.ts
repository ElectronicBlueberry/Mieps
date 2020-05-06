import {ChatCommand, Permission, EmojiCommand, iPlugin, Command} from "./plugin.js";
import * as lang from "../lang/builtinCommands.js";
import * as Discord from 'discord.js';
import {PluginManager} from "./pluginManager.js";
import * as Query from "./inputCollector.js";


export class BuiltIn implements iPlugin {
	name = "builtin-commands";
	commands: Array<Command>;
	constructor(public client: Discord.Client, public pluginManager: PluginManager) {

		this.commands = [
			new HelpCommand(this),
			new PluginCommand(this),
			new ConfigCommand(this)
		];

	}
}

class PluginCommand extends ChatCommand {
	permission = Permission.Admin;
	pM: PluginManager;

	constructor(plugin: iPlugin) {
		super("plugin", plugin);

		this.pM = plugin.pluginManager;
	}

	getHelpText() {
		return lang.pluginCommandHelp();
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let channel = message.channel;
		if (args.length === 0) {
			channel.send(this.getHelpText());
			return;
		}

		switch (args[0]) {
			case "activate": {
				if (args.length < 2) {
					channel.send(this.getHelpText());
					return;
				}

				if (args[1] === "all") {
					channel.send(lang.activateAll());
					this.pM.activateAll();
					return;
				}

				let found = this.pM.activatePlugin(args[1]);
				if (!found) {
					channel.send(lang.pluginNotFound(args[1]));
				}
			} break;

			case "deactivate": {
				if (args.length < 2) {
					channel.send(this.getHelpText());
					return;
				}

				let found = this.pM.deactivatePlugin(args[1]);
				if (!found) {
					channel.send(lang.pluginNotFound(args[1]));
				}
			} break;

			case "list": {
				channel.send(lang.pluginList(this.pM.plugins, this.pM.getState()));
			} break;

			default:
				channel.send(this.getHelpText());
		}
	}
}

class HelpCommand extends ChatCommand {
	permission = Permission.Any;
	pM: PluginManager;

	constructor(plugin: iPlugin) {
		super("help", plugin);

		this.pM = plugin.pluginManager;
	}

	getHelpText() {
		return "I heard you like help, so I got you some help for your help";
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let channel = message.channel;
		let member = message.member as Discord.GuildMember;
		let perm = this.pM.getHighestMemberPermission(member);

		let cCommands: Map<string, ChatCommand> = new Map();
		let eCommands: Map<string, EmojiCommand> = new Map();

		this.pM.getChatCommands().forEach(c => {
			if (c.permission <= perm) cCommands.set(c.name, c);
		});

		this.pM.getEmojiCommands().forEach(c => {
			if (c.permission <= perm) eCommands.set(c.emoji.toString(), c);
		});

		if (args.length > 0) {
			let command = cCommands.get(args[0]);

			if (command) {
				channel.send(command.getHelpText());
				return;
			}

			let reaction = eCommands.get(args[0]);

			if (reaction) {
				channel.send(reaction.getHelpText());
				return;
			}
		}

		channel.send(lang.commandList(cCommands, eCommands));
	}
}

class ConfigCommand extends ChatCommand {
	permission = Permission.Admin;
	pM: PluginManager;
	
	constructor(plugin: iPlugin) {
		super("config", plugin);

		this.pM = plugin.pluginManager;
	}

	getHelpText() {
		return lang.configHelp();
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let channel = message.channel;

		if (args.length === 0) {
			channel.send(this.getHelpText());
			return;
		}

		if (args[0] === "all") {
			let pluginState = this.pM.getState();
			let count = 0;

			for (const [name, plugin] of this.pM.plugins) {
				// Only configure configurable Plugins, which are not yet configured
				if (!plugin.setupTemplate || pluginState.read(name, "configured")) continue;

				channel.send(lang.nowConfiguring(name));
				await this.configurePlugin(message, plugin);

				count++;
			}

			if (count === 0) {
				channel.send(lang.noUnconfigured());
			} else {
				channel.send(lang.allComplete());
			}
		} else {
			let plugin: iPlugin | undefined = this.pM.plugins.get(args[0]);

			if (!plugin) {
				channel.send(lang.pluginNotFound(args[0]));
				return;
			}

			await this.configurePlugin(message, plugin);
			channel.send(lang.configDone(plugin.name));
		}
	}

	private async configurePlugin(message: Discord.Message, plugin: iPlugin): Promise<void> {
		let channel = message.channel;

		if (!plugin.setupTemplate) {
			channel.send(lang.noConfig(plugin.name));
			return;
		}

		// Loop through all Settings, and save their values in the Plugins State
		for (const setting of plugin.setupTemplate) {

			let input: string | Query.InputReturns = "";
			
			input = await Query.queryInput(channel as Discord.TextChannel, message.author, setting.description || setting.name, setting.type);
			if (input === Query.InputReturns.Canceled || input === Query.InputReturns.TimedOut) return;

			plugin.state?.write("config", setting.name, input);
		}

		this.pM.setConfigured(plugin.name, true);
	}
}
