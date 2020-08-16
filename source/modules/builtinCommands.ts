import {ChatCommand, Permission, EmojiCommand, iPlugin, iCommand, CommandType} from "./plugin.js";
import * as lang from "../lang/builtinCommands.js";
import * as Discord from 'discord.js';
import {PluginManager} from "./pluginManager.js";
import * as Query from "./inputCollector.js";


export class BuiltIn implements iPlugin {
	name = "builtin-commands";
	commands: Array<iCommand>;
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

	constructor(private plugin: iPlugin) {
		super("plugin");

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
				if (typeof(found) === undefined) {
					channel.send(lang.pluginNotFound(args[1]));
				} else if (!found) {
					channel.send(lang.pluginNotConfigured(args[1]));
				} else {
					channel.send(lang.pluginActivated(args[1]));
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
				} else {
					channel.send(lang.pluginDeactivated(args[1]));
				}
			} break;

			case "list": {
				channel.send(lang.pluginList(this.pM.plugins, this.pM.getState()));
			} break;

			case "commands": {
				let plugin = this.pM.plugins.get(args[1]);
				if (!plugin) {
					channel.send(lang.pluginNotFound(args[1]));
				} else {
					let cCommands = plugin.commands?.filter(p => p.type === CommandType.Chat) as ChatCommand[] | undefined;
					let eCommands = plugin.commands?.filter(p => p.type === CommandType.Emoji) as EmojiCommand[] | undefined;
					channel.send(lang.pluginCommandList(args[1], cCommands, eCommands));
				}
			} break;

			default:
				channel.send(this.getHelpText());
		}
	}
}

class HelpCommand extends ChatCommand {
	permission = Permission.Any;
	pM: PluginManager;

	constructor(private plugin: iPlugin) {
		super("help");

		this.pM = plugin.pluginManager;
	}

	getHelpText() {
		return "I heard you like help, so I got you some help for your help";
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let channel = message.channel;
		let member = message.member as Discord.GuildMember;
		let perm = this.pM.getHighestMemberPermission(member);

		let cCommands: Discord.Collection<string, ChatCommand> = new Discord.Collection();
		let eCommands: Discord.Collection<string, EmojiCommand> = new Discord.Collection();

		this.pM.getChatCommands().forEach(c => {
			if (c.permission <= perm) cCommands.set(c.name, c);
		});

		this.pM.getEmojiCommands().forEach(c => {
			if (c.permission <= perm && c.emoji) eCommands.set(c.emoji.toString(), c);
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
	
	constructor(private plugin: iPlugin) {
		super("config");

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

			let input;
			let ans: Query.InputReturns = Query.InputReturns.TimedOut;
			
			[input, ans] = await Query.queryInput(channel as Discord.TextChannel, message.author, setting.description || setting.name, setting.type);
			if (ans !== Query.InputReturns.Answered) return;

			if (setting.type === Query.InputType.Message) {
				plugin.state?.write("config", setting.name, [channel.id, input]);
			} else {
				plugin.state?.write("config", setting.name, input);
			}
		}

		this.pM.setConfigured(plugin.name, true);

		// If plugin is allready actrive, reload it
		if(this.pM.getActive(plugin.name)) {
			this.pM.deactivatePlugin(plugin.name);
			this.pM.activatePlugin(plugin.name);
		}
	}
}
