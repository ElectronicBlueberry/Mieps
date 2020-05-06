import * as Discord from "discord.js";
import {State} from "./state.js";
import {InputType} from "./inputCollector.js";
import {PluginManager} from "./pluginManager";

export enum CommandType {
	Chat,
	Emoji
}

export interface Command {
	type: CommandType,
	permission: Permission,
	getHelpText: () => string,
	name: string
}

export class ChatCommand implements Command {
	type = CommandType.Chat;
	name: string;
	allowNoArgs = false;
	getHelpText() {return ""};
	permission = Permission.Any;

	constructor(name: string, private plugin: iPlugin) {
		this.name = name;
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {};
}

export class EmojiCommand implements Command {
	type = CommandType.Emoji;
	name: string;
	getHelpText() {return ""};
	permission = Permission.Any;

	// Whether to remove uses of this Emoji for Users without the right permissions
	removeInvalid = true;
	
	emoji: Discord.Emoji;

	constructor(name: string, emoji: Discord.Emoji, private plugin: iPlugin) {
		this.name = name;
		this.emoji = emoji;
	}

	async run(reaction: Discord.MessageReaction): Promise<void> {};
}

export interface iPlugin {
	/** The name of the Plugin */
	name: string,
	/** The Plugin Manager that handles this Plugin */
	pluginManager: PluginManager,
	/** The Bots Client */
	client: Discord.Client,
	/** Called once the Bot is ready */
	init?: () => void,
	/** A short description of what the plugin does */
	description?: string,
	/** Will be run on every message */
	messageStream?: MessageStream,
	/** All commands this plugin contains */
	commands?: Array<Command>,
	/** A template for settings to be set on the discord server */
	setupTemplate?: SetupTemplate,
	/** The Plugins State */
	state?: State
}

export class Plugin implements iPlugin {
	constructor(public name: string, public pluginManager: PluginManager, public client: Discord.Client) {}
}

/** A List of settings, to be set by the admin */
export type SetupTemplate = Array<Setting>

export interface MessageStream {
	/** What Channels to run on */
	channels?: Array<Discord.TextChannel>,
	/** Return boolean indicates if message should be passed on to the command processing stage */
	run: (message: Discord.Message) => boolean;
}

export interface Setting {
	name: string,
	type: InputType,
	description?: string
}

export enum Permission {
	Any = 0,
	User = 2,
	Mod = 5,
	Admin = 10
}
