import * as fs from 'fs';
import * as Path from 'path';

import {iPlugin, Plugin, ChatCommand, EmojiCommand, MessageStream, CommandType, Permission} from "./plugin.js";
import {criticalError, uncaughtError} from "./errorHandling.js";
import {State, ReadOnlyState} from "./state.js";
import * as lang from "../lang/pluginManager.js"
import * as Discord from 'discord.js';
import * as Query from "./inputCollector.js";

type Collection<K,V> = Discord.Collection<K,V>;

export class PluginManager {
	public plugins: Collection<string, iPlugin> = new Discord.Collection();

	private chatCommands: Collection<string, ChatCommand> = new Discord.Collection();
	private emojiCommands: Collection<string, EmojiCommand> = new Discord.Collection();
	private messageStreams: Collection<string, MessageStream> = new Discord.Collection();

	private pluginState = new State("plugin_manager");

	// used to setup permissions in the configurator
	private permissionPlugin: iPlugin = {
		name: "permissions",
		pluginManager: this,
		client: this.client,
		setupTemplate: [
			{name:"User", type: Query.InputType.Role, description: lang.userRoleDesc()},
			{name:"UserCommandChannel", type: Query.InputType.Channel, description: lang.userChannelDesc()},
			{name:"Mod", type: Query.InputType.Role, description: lang.modRoleDesc()}
		]
	}

	constructor(private client: Discord.Client, private instanceConfig: {control_channel: string}) {
		this.loadPlugin(this.permissionPlugin);
	}

	get guild(): Discord.Guild {
		return this.client.guilds.cache.first() as Discord.Guild;
	}

	get controlChannel(): Discord.TextChannel {
		let c = this.guild.channels.cache.get(this.instanceConfig.control_channel);
		if (!c || c.type !== "text") {
			criticalError("Control Channel not found!");
			return {} as Discord.TextChannel;
		}
		return c as Discord.TextChannel;
	}

	public getState(): ReadOnlyState {
		return this.pluginState;
	}

	public getChatCommands(): Collection<string, ChatCommand> {
		return this.chatCommands;
	}

	public getEmojiCommands(): Collection<string, EmojiCommand> {
		return this.emojiCommands;
	}

	public addChatCommand(command: ChatCommand): void {
		this.chatCommands.set(command.name, command);
	}

	public addEmojiCommand(command: EmojiCommand): void {
		if (command.emoji) {
			this.emojiCommands.set(command.emoji.toString(), command);
		}
	}

	/**
	 * Searches for Plugins on Disk, and loads all found plugins.
	 * This does not activate the Plugins
	 */
	public async scanForPlugins(path: string, suffix: string): Promise<void> {
		try {
			let files = fs.readdirSync(path);
			files = files.filter(file => file.endsWith(suffix));

			for (const file of files) {
				try {
					let _Plugin = await import(Path.resolve(path, file));
					let pluginInstance = new _Plugin.default(this, this.client) as Plugin;
					this.loadPlugin(pluginInstance);
				} catch(e) {
					console.error(`Failed to load Plugin ${file}`, e);
				}
			}
		} catch(e) {
			criticalError("Failed to Load Plugins", e);
		}
	}

	/**
	 * Loads a single Plugin from Memory
	 * @param plugin Plugin to load
	 */
	public loadPlugin(plugin: iPlugin): void {
		this.plugins.set(plugin.name, plugin);

		if (!plugin.setupTemplate) {
			this.pluginState.write(plugin.name, "configured", true);
		} else {
			// If the Plugin has a SetupTemplate, it will also need a state, to make use of it
			plugin.state = new State(plugin.name);
		}
	}

	/** Run a message as a command */
	public async runChatCommand(message: Discord.Message): Promise<void> {
		// Get the member
		let member = message.member;
		if (!member) return;

		// Check if member is in a Query. Members in Query should not be able to issue new commands
		if (Query.isUserInQuery(member.user)) return;

		// Get the arguments
		let args = message.content.toLowerCase().match(/(?<=!|\s)\S+/gm);
		if (!args || args.length === 0) return;

		// Find the command
		let cmd = args.shift() as string;
		let commannd = this.chatCommands.get(cmd);
		if (!commannd) return;

		// Check for permissons
		let memberPerm = this.getHighestMemberPermission(member);
		let perm = memberPerm >= commannd.permission;

		// If Member is a User, and Command is for Users, check they are posting in the right channel
		if (memberPerm === Permission.User && commannd.permission === Permission.User) {
			if (message.channel.id !== this.permissionPlugin.state?.read("config", "UserCommandChannel")) {
				perm = false;
			}
		}

		// Run the command
		try {
			if (perm) commannd.run(message, args);
		} catch(e) {
			uncaughtError(this.controlChannel, commannd.name, e, message.content);
		}

	}

	/** Run a reaction as a emoji command */
	public async runEmojiCommand(reaction: Discord.MessageReaction, user: Discord.User): Promise<void> {
		// Find command
		let command = this.emojiCommands.get(reaction.emoji.toString());
		if (!command) return;

		let member = await this.guild.members.fetch(user);
		if (!member) return;

		// Check for permissons
		let memberPerm = this.getHighestMemberPermission(member);
		let perm = memberPerm >= command.permission;

		if (perm) {
			try {
				command.run(reaction, member);
			} catch (e) {
				uncaughtError(this.controlChannel, command.name, e);
			}
		} else if (command.removeInvalid) {
			reaction.users.remove(member);
		}
	}

	/** Run all message Streams. Return whether message should be processed further */
	public async runChatStreams(message: Discord.Message): Promise<boolean> {
		let proceed = true;

		for (const [key, stream] of this.messageStreams) {
			// If channel is not whitelisted, skip it
			if (stream.channels && !stream.channels.includes(message.channel as Discord.TextChannel)) continue;

			let p = true;

			try {
				p = await stream.run(message);
			} catch(e) {
				uncaughtError(this.controlChannel, stream.name, e);
			}
			proceed = p && proceed;
		}

		return proceed;
	}

	/**
	 * Sets the client for Plugins to use,
	 * calls all Plugins init function,
	 * then loads their commands
	 */
	public initiateAll(): void {		
		this.plugins.forEach(p => {
			this._initiatePlugin(p);
		});
	}

	/** Attempts to activate all Plugins */
	public activateAll(): void {
		this.plugins.forEach(plugin => {
			this.activatePlugin(plugin.name);
		});
	}

	/** Load a Plugins commands, and set it to active. Returns undefined, if the Plugin was not found. Returns false, if the Plugin needs to be configured */
	public activatePlugin(name: string): boolean | undefined {
		let plugin = this.plugins.get(name);

		if (!plugin) {
			return;
		}

		if (this.pluginState.read(plugin.name, "configured")) {
			this.pluginState.write(plugin.name, "active", true);
			this._initiatePlugin(plugin);
			return true;
		} else {
			return false;
		}
	}

	/** Deactive a Plugin, bypassing all its commands and processors. Returns false, if the Plugin was not found */
	public deactivatePlugin(name: string): boolean {
		let plugin = this.plugins.get(name);

		if (plugin) {
			this._unloadCommands(plugin);
			this.pluginState.write(plugin.name, "active", false);
			return true;
		} else {
			return false;
		}
	}

	/** Sets whether or not a plugin is configured */
	public setConfigured(name: string, configured: boolean): void {
		this.pluginState.write(name, "configured", configured);
	}

	/** Load a Plugin as a Built-In, which is required for other plugins/the bots operation, and cannot be deactivated, or configured */
	public async addBuiltin(plugin: iPlugin): Promise<void> {
		await plugin.init?.();
		this._loadCommands(plugin);
	}

	public checkPermission(member: Discord.GuildMember, permission: Permission): boolean {
		let channel = member.guild.channels.resolve(this.instanceConfig.control_channel) as Discord.TextChannel | null;
		
		if (!channel) {
			criticalError("Control channel not found! Please set a valid channel id, in instance.json");
			return false;
		}

		switch (permission) {
			case Permission.Any: {
				return true;
			} break;
				
			case Permission.User: {
				let role = this.permissionPlugin.state?.read("config", "User") as string | undefined;

				if (!role) {
					channel.send(lang.roleNotSet());
					return false;
				}

				return (member.roles.cache.get(role)) ? true : false;
			} break;

			case Permission.Mod: {
				let role = this.permissionPlugin.state?.read("config", "Mod") as string | undefined;

				if (!role) {
					channel.send(lang.roleNotSet());
					return false;
				}

				return (member.roles.cache.get(role)) ? true : false;
			} break;

			case Permission.Admin: {
				return member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);
			} break;
		}
		
		return false;
	}

	public getHighestMemberPermission(member: Discord.GuildMember): Permission {
		if (this.checkPermission(member, Permission.Admin)) return Permission.Admin;
		if (this.checkPermission(member, Permission.Mod)) return Permission.Mod;
		if (this.checkPermission(member, Permission.User)) return Permission.User;
		
		return Permission.Any;
	}

	// ========== Private Functions ==========

	private async _initiatePlugin(p: iPlugin): Promise<void> {
		if (this.pluginState.read(p.name, "active")) {
			await p.init?.();
			this._loadCommands(p);
		}
	}

	/** Loads a Plugins commands */
	private _loadCommands(plugin: iPlugin): void {
		plugin.commands?.forEach(command => {
			if (command.type === CommandType.Chat) this.chatCommands.set(command.name, command as ChatCommand);
			if (command.type === CommandType.Emoji) {
				let _command = command as EmojiCommand;
				if (_command.emoji) {
					this.emojiCommands.set(_command.emoji.toString(), _command);
				}
			}
		});

		if (plugin.messageStream) this.messageStreams.set(plugin.name, plugin.messageStream);
	}

	// Remove a Plugins Commands from the Command Collections, so they wont be called again
	private _unloadCommands(plugin: iPlugin): void {
		plugin.commands?.forEach(command => {
			if (command.type === CommandType.Chat) this.chatCommands.delete(command.name);
			if (command.type === CommandType.Emoji) {
				let commandKey = this.emojiCommands.findKey(c => c.name === command.name);
				if (commandKey) this.emojiCommands.delete(commandKey);
			}
		});

		if (plugin.messageStream) this.messageStreams.delete(plugin.name);
	}
}
