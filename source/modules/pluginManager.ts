import * as Fs from 'fs'
import * as Path from 'path'

import * as Discord from "discord.js"

import * as Lang from "../lang/pluginManager.js"
import * as Query from "./inputCollector.js"

import { iPlugin, Plugin, ChatCommand, EmojiCommand, MessageStream, CommandType, Permission, MemberStream } from "./plugin.js"
import { criticalError, uncaughtError } from "./errorHandling.js"
import { State, ReadOnlyState } from "./state.js"


type Collection<K, V> = Discord.Collection<K, V>;


export class PluginManager
{
	public plugins: Collection<string, iPlugin> = new Discord.Collection();

	private chatCommands: Collection<string, ChatCommand> = new Discord.Collection();
	private emojiCommands: Collection<string, EmojiCommand> = new Discord.Collection();
	private messageStreams: Collection<string, MessageStream> = new Discord.Collection();
	private joinStreams: Collection<string, MemberStream> = new Discord.Collection();
	private leaveStreams: Collection<string, MemberStream> = new Discord.Collection();

	private pluginState = new State("plugin_manager");

	// used to setup permissions in the configurator
	private permissionPlugin: iPlugin =
	{
		name: "permissions",
		pluginManager: this,
		client: this.client,
		setupTemplate:
		[
			{ name:"User", type: Query.InputType.Role, description: Lang.userRoleDesc() },
			{ name:"UserCommandChannel", type: Query.InputType.Channel, description: Lang.userChannelDesc() },
			{ name:"SuperMod", type: Query.InputType.Role, description: Lang.modRoleDesc() },
			{ name: "ChatMod", type: Query.InputType.Role, description: Lang.chatModRoleDesc() }
		]
	}

	constructor (private client: Discord.Client, private instanceConfig: { control_channel: string })
	{
		this.loadPlugin( this.permissionPlugin );
	}

	/** read-only - the guild this Plugin Manager is operating on */
	get guild(): Discord.Guild
	{
		return this.client.guilds.cache.first() as Discord.Guild;
	}

	/** read-only - the fallback channel this bot can always be controlled from */
	get controlChannel(): Discord.TextChannel
	{
		let c = this.guild.channels.cache.get( this.instanceConfig.control_channel );

		if (!c || c.type !== "text")
		{
			criticalError("Control Channel not found!");

			return { } as Discord.TextChannel;
		}

		return c as Discord.TextChannel;
	}

	public getState(): ReadOnlyState
	{
		return this.pluginState;
	}

	/** get all chat commands */
	public getChatCommands(): Collection<string, ChatCommand>
	{
		return this.chatCommands;
	}

	/** get all emoji commands */
	public getEmojiCommands(): Collection<string, EmojiCommand>
	{
		return this.emojiCommands;
	}

	/**
	 * Adds a single new chat command.
	 * Once added, the command can be used.
	 * 
	 * @param command chat command to add
	*/
	public addChatCommand(command: ChatCommand): void
	{
		this.chatCommands.set( command.name, command);
	}

	/**
	 * Adds a single new emoji command.
	 * Once added, the command can be used.
	 * 
	 * @param command emoji command to add
	 */
	public addEmojiCommand(command: EmojiCommand): void
	{

		if (command.emoji)
		{
			this.emojiCommands.set( command.emoji.toString(), command);
		}

	}

	/**
	 * Searches for Plugins on Disk, and loads all found plugins.
	 * This does not activate the Plugins.
	 * 
	 * @param path path to plugin directory
	 * @param suffix files with this suffix will be treated as plugins
	 */
	public async scanForPlugins(path: string, suffix: string): Promise<void>
	{

		try
		{
			let files = Fs.readdirSync(path);
			files = files.filter(file => file.endsWith(suffix));

			for (const file of files)
			{

				try
				{
					let _Plugin = await import( Path.resolve(path, file) );
					let pluginInstance = new _Plugin.default(this, this.client ) as Plugin;

					this.loadPlugin(pluginInstance);
				}
				catch (e)
				{
					console.error(`Failed to load Plugin ${file}`, e);
				}

			}

		}
		catch (e) 
		{
			criticalError("Failed to Load Plugins", e);
		}

	}

	/**
	 * loads a single Plugin from memory
	 * @param plugin plugin to load
	 */
	public loadPlugin(plugin: iPlugin): void
	{
		this.plugins.set(plugin.name, plugin);

		if (!plugin.setupTemplate)
		{
			this.pluginState.write( plugin.name, "configured", true);
		}
		else
		{
			// If the Plugin has a SetupTemplate, it will also need a state, in order to use it
			plugin.state = new State( plugin.name );
		}
	}

	/**
	 * run a message as a command
	 * @param message message which is being ran as command
	 */
	public async runChatCommand(message: Discord.Message): Promise<void>
	{
		// Get the member
		let member = message.member;

		if (!member) return;

		// Check if member is in a Query. Members in Query should not be able to issue new commands
		if (Query.isUserInQuery( member.user )) return;

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

		// If Member is a User, check they are posting in the right channel
		if (memberPerm <= Permission.User)
		{
			if (message.channel.id !== this.permissionPlugin.state?.read("config", "UserCommandChannel"))
			{
				perm = false;
			}
		}

		// Run the command
		try
		{
			if (perm) await commannd.run(message, args);
		}
		catch (e)
		{
			uncaughtError( this.controlChannel, commannd.name, e, message.content );
		}

	}

	/**
	 * run a reaction as a emoji command
	 * @param reaction reaction which was posted under a message
	 * @param user user who posted reaction
	 */
	public async runEmojiCommand(reaction: Discord.MessageReaction, user: Discord.User): Promise<void>
	{
		// Find command
		let command = this.emojiCommands.get( reaction.emoji.toString() );

		if (!command) return;

		let member = await this.guild.members.fetch(user);

		if (!member) return;

		// Check for permissons
		let memberPerm = this.getHighestMemberPermission(member);
		let perm = memberPerm >= command.permission;

		if (perm)
		{

			try
			{
				await command.run(reaction, member);
			}
			catch (e)
			{
				uncaughtError( this.controlChannel, command.name, e);
			}

		}
		else if (command.removeInvalid)
		{
			try
			{
				reaction.users.remove(member);
			}
			catch {}
		}
	}

	/**
	 * run all plugins message streams. Return whether message should be processed further
	 * @param message message to run through the streams
	 */
	public async runChatStreams(message: Discord.Message): Promise<boolean>
	{
		let proceed = true;

		for (const [key, stream] of this.messageStreams)
		{
			// If channel is not whitelisted, skip it
			if (stream.channels && !stream.channels.includes( message.channel as Discord.TextChannel)) continue;

			let p = true;

			try
			{
				p = await stream.run(message);
			}
			catch(e)
			{
				uncaughtError( this.controlChannel, stream.name, e);
			}
			
			proceed = p && proceed;
		}

		return proceed;
	}

	/**
	 * run all plugins join streams
	 * @param member new member who joined
	 */
	public async runJoinStreams(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void>
	{
		let currStream: MemberStream | undefined;

		try
		{

			this.joinStreams.forEach( stream => {

				currStream = stream;
				stream.run(member);

			});

		}
		catch (e)
		{
			uncaughtError( this.controlChannel, (currStream) ? currStream.name : "unknown", e);
		}

	}

	/**
	 * run all plugins leave streams
	 * @param member member who left
	 */
	public async runLeaveStreams(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void>
	{

		let currStream: MemberStream | undefined;

		try
		{

			this.leaveStreams.forEach( stream => {

				currStream = stream;
				stream.run(member);

			});

		}
		catch (e)
		{
			uncaughtError( this.controlChannel, (currStream) ? currStream.name : "unknown", e);
		}

	}

	/**
	 * Sets the client for plugins to use,
	 * calls all plugins init function,
	 * then loads their commands.
	 */
	public initiateAll(): void
	{		
		this.plugins.forEach( p => {
			this._initiatePlugin(p);
		});
	}

	/**
	 * Attempts to activate all plugins.
	 * Plguins which failed to activate, will be ignored.
	 */
	public activateAll(): void
	{
		this.plugins.forEach( plugin => {
			this.activatePlugin( plugin.name );
		});
	}

	/**
	 * Load a plugins commands, and set it to active.
	 * 
	 * Returns undefined, if the plugin was not found.
	 * Returns false, if the plugin needs to be configured.
	 * 
	 * @param name name of plugin to activate
	 */
	public activatePlugin(name: string): boolean | undefined
	{
		let plugin = this.plugins.get(name);

		if (!plugin)
		{
			return;
		}

		if ( this.pluginState.read( plugin.name, "configured") )
		{
			this.pluginState.write( plugin.name, "active", true);
			this._initiatePlugin(plugin);

			return true;
		}
		else
		{
			return false;
		}

	}

	/**
	 * Deactive a Plugin, unloading all its commands and processors.
	 * 
	 * Returns false, if the Plugin was not found
	 * 
	 * @param name name of plugin to deactivate
	 */
	public deactivatePlugin(name: string): boolean
	{
		let plugin = this.plugins.get(name);

		if (plugin)
		{
			this._unloadCommands(plugin);
			this.pluginState.write( plugin.name, "active", false);

			return true;
		}
		else
		{
			return false;
		}

	}

	/**
	 * sets whether or not a plugin is configured
	 * @param name name of plugin to set
	 * @param configured if the plugin is ocnfigured
	 */
	public setConfigured(name: string, configured: boolean): void 
	{
		this.pluginState.write(name, "configured", configured);
	}

	/**
	 * gets whether a plugin is active
	 * @param name name of plugin to check
	 */
	public getActive(name: string): boolean
	{

		if (this.pluginState.read(name, "active"))
		{
			return true;
		}
		else
		{
			return false;
		}

	}

	/**
	 * Load a plugin as a built-in. 
	 * Build-in plugins are required for other plugins or the bots operation,
	 * and cannot be deactivated, or configured.
	 * 
	 * @param plugin object to add as built-in plugin
	 */
	public async addBuiltin(plugin: iPlugin): Promise<void>
	{
		await plugin.init?.();
		this._loadCommands(plugin);
	}

	/**
	 * Checks if a guild member has a permission.
	 * Permission references bot permissions, not Discord permissions.
	 * 
	 * @param member the guild member to check
	 * @param permission the bot permission to check for
	 */
	public checkPermission(member: Discord.GuildMember, permission: Permission): boolean
	{
		let channel = this.guild.channels.resolve( this.instanceConfig.control_channel ) as Discord.TextChannel | null;
		
		if (!channel)
		{
			criticalError("Control channel not found! Please set a valid channel id, in instance.json");

			return false;
		}

		switch (permission)
		{

			case Permission.Any:
			{
				return true;
			}
			break;

			case Permission.Admin:
			{
				return member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);
			}
			break;

			default:
			{
				let role = this.getPermissionRole(permission, this.guild);

				if (!role)
				{
					channel.send( Lang.roleNotSet() );

					return false;
				}

				return (member.roles.cache.get(role.id)) ? true : false;
			}
			break;

		}
		
		return false;
	}

	/**
	 * returns the highest permission a guild member has
	 * @param member the guild member to check
	 */
	public getHighestMemberPermission(member: Discord.GuildMember): Permission
	{
		if ( this.checkPermission(member, Permission.Admin ) ) return Permission.Admin;
		if ( this.checkPermission(member, Permission.SuperMod ) ) return Permission.SuperMod;
		if ( this.checkPermission(member, Permission.ChatMod ) ) return Permission.ChatMod;
		if ( this.checkPermission(member, Permission.User ) ) return Permission.User;
		
		return Permission.Any;
	}

	/**
	 * Returns a Discord role associated to a bot permission.
	 * Or undefined, if none was found.
	 * 
	 * @param permission the bot permission
	 * @param guild the guild from where to get the role
	 */
	public getPermissionRole(permission: Permission, guild: Discord.Guild): Discord.Role | undefined
	{
		let role = this.permissionPlugin.state?.read("config", Permission[permission] ) as string | undefined;

		if (role)
		{
			return guild.roles.cache.get(role);
		}
		else
		{
			return;
		}
		
	}

	// ========== Private Functions ==========

	/**
	 * Calls a plugins initializer,
	 * then loads its commands.
	 * 
	 * @param p object to load as plugin
	 */
	private async _initiatePlugin(p: iPlugin): Promise<void>
	{

		if (this.pluginState.read( p.name, "active"))
		{
			try {
				await p.init?.();
				this._loadCommands(p);
			}
			catch (e)
			{
				uncaughtError( this.controlChannel, p.name, e, "initialize");
			}
		}

	}

	/**
	 * loads a plugins commands
	 * @param plugin objects from which to load commands from
	 */
	private _loadCommands(plugin: iPlugin): void
	{
		plugin.commands?.forEach( command => {

			if (command.type === CommandType.Chat) this.chatCommands.set( command.name, command as ChatCommand);

			if (command.type === CommandType.Emoji)
			{
				let _command = command as EmojiCommand;

				if (_command.emoji)
				{
					this.emojiCommands.set( _command.emoji.toString(), _command);
				}
			}

		});

		if (plugin.messageStream) this.messageStreams.set( plugin.name, plugin.messageStream );
		if (plugin.joinStream) this.joinStreams.set( plugin.name, plugin.joinStream );
		if (plugin.leaveStream) this.leaveStreams.set( plugin.name, plugin.leaveStream );
	}

	/**
	 * remove a plugins commands from the command collections, so they wont be called again
	 * @param plugin object from which to unload commands
	 */
	private _unloadCommands(plugin: iPlugin): void
	{

		plugin.commands?.forEach( command => {

			if (command.type === CommandType.Chat) this.chatCommands.delete( command.name );

			if (command.type === CommandType.Emoji)
			{
				let commandKey = this.emojiCommands.findKey( c => c.name === command.name );
				if (commandKey) this.emojiCommands.delete(commandKey);
			}

		});

		if (plugin.messageStream) this.messageStreams.delete( plugin.name );
		if (plugin.joinStream) this.joinStreams.delete( plugin.name );
		if (plugin.leaveStream) this.leaveStreams.delete( plugin.name );
	}

}
