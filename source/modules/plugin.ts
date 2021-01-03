import * as Discord from "discord.js"

import { State } from "./state.js"
import { InputType } from "./inputCollector.js"
import { PluginManager } from "./pluginManager"
import { criticalPluginError } from "./errorHandling.js"


export { InputType } from "./inputCollector.js"

/** A List of settings, to be set by the admin */
export type SetupTemplate = Array<Setting>;

export enum Permission
{
	Any = 0,
	User = 2,
	Mod = 5,
	Admin = 10
}

export enum CommandType
{
	Chat,
	Emoji
}

/** processes all incoming messages */
export interface MessageStream
{
	/** what Channels to run on */
	channels?: Array<Discord.TextChannel>,

	/** identifying name */
	name: string,

	/** return boolean indicates if message should be passed on to the command processing stage */
	run: (message: Discord.Message) => Promise<boolean>;
}

/** processes joins or leaves */
export interface MemberStream
{
	name: string,
	run: (member: Discord.GuildMember | Discord.PartialGuildMember) => Promise<void>;
}

/** holds a setting which can be changes in the command channel */
export interface Setting
{
	name: string,
	type: InputType,
	description?: string
}

/** a generic command */
export interface iCommand
{
	/** identifying name */
	name: string

	/** command can be either run by text chat, or with reactions */
	type: CommandType,

	/** who is allowed to run this command by default */
	permission: Permission,

	/** return a short held text */
	getHelpText: () => string,
}

export interface iPlugin
{
	/** The name of the Plugin */
	name: string,

	/** The Plugin Manager that handles this Plugin */
	pluginManager: PluginManager,

	/** The Bots Client */
	client: Discord.Client,

	/** Called once the Bot is ready */
	init?: () => Promise<void>,

	/** A short description of what the plugin does */
	description?: string,

	/** Will be run on every message */
	messageStream?: MessageStream,

	/** All commands this plugin contains */
	commands?: Array<iCommand>,

	/** A template for settings to be set on the discord server */
	setupTemplate?: SetupTemplate,

	/** The Plugins State */
	state?: State,

	/** runs when a member joins the server */
	joinStream?: MemberStream,

	/** runs when a member leaves the server */
	leaveStream?: MemberStream
}


// Matches discord IDs
const idRegex = /^[0-9]*$/;


/** a text chat command */
export class ChatCommand implements iCommand
{
	name: string;
	type = CommandType.Chat;
	permission = Permission.Admin;

	allowNoArgs = false;

	constructor(name: string) {
		this.name = name;
	}

	getHelpText() { return "" };

	async run(message: Discord.Message, args: Array<string>): Promise<void> {};
}

/** a reaction command */
export class EmojiCommand implements iCommand
{
	name: string;
	type = CommandType.Emoji;
	permission = Permission.Admin;

	// Whether to remove uses of this emoji for users without the right permissions
	removeInvalid = true;
	
	/**
	 * The emoji that triggers this command.
	 * Set this in the plugins init.
	*/
	emoji?: Discord.Emoji;

	constructor(name: string) {
		this.name = name;
	}

	getHelpText() { return "" };

	async run(reaction: Discord.MessageReaction, member: Discord.GuildMember): Promise<void> {};
}

/**
 * A plugin can hold chat commands, emoji commands,
 * join processors, and leave processors.
 * It can also have a configurable set-up, which the admin can use from the server.
 * Activating, or deactivating a plugin, affects all its commands and processors.
*/
export class Plugin implements iPlugin
{
	/**
	 * Identifying name of the plugin.
	 * Do not leave this on it's default value!
	 */
	public name = "base_plugin";

	/**
	 * A plugins state persists between bot restarts, and holds the set-up settings.
	 * It can also be used to store other information.
	 * All values which are not volatile, should be sotred in the state!
	 */
	state?: State;

	/**
	 * creates a new plugin
	 * @param pluginManager reference to plugin manager, managing this plugin
	 * @param client discordjs client
	 */
	constructor(public pluginManager: PluginManager, public client: Discord.Client) {};

	/**
	 * retrieves a setting from the plugins state, if it exists
	 * @param setting name of the setting
	 * @param type expected type of the setting
	 * @returns value of the setting, or undefined if no setting was set
	 */
	public async getSetting<T>(setting: string, type: InputType): Promise<T | undefined>
	{

		if (!this.state)
		{

			criticalPluginError(
				this.pluginManager.controlChannel,
				`Tried to acess setting ${setting} while no state was set`,
				this
			);

			return undefined;
		}

		let s = this.state.read("config", setting) as any;

		if (!s)
		{

			criticalPluginError(
				this.pluginManager.controlChannel,
				`Could not acess Setting ${setting}`,
				this
			);

			return undefined;
		}

		let guild = this.pluginManager.guild;
		let response: any;

		// Depending on the requested type, the setting is converted
		switch (type)
		{
			case InputType.Channel:
			{
				response = guild.channels.cache.get(s);
			}
			break;

			case InputType.Emoji:
			{

				if (s.match(idRegex))
				{
					// custom Emoji
					response = guild.emojis.cache.get(s);
				}
				else
				{
					// unicode Emoji
					response = new Discord.Emoji( this.client, {id: null, name: s} );
				}

			}
			break;

			case InputType.Role:
			{

				try
				{
					response = await guild.roles.fetch(s);
				}
				catch {}

			}
			break;

			case InputType.User:
			{

				try
				{
					response = await guild.members.fetch(s);
				}
				catch {}

			}
			break;

			case InputType.Message:
			{

				try
				{
					response = await (await guild.channels.cache.get(s[0]) as Discord.TextChannel | undefined)?.messages?.fetch(s[1]);
				}
				catch {}

			}
			break;
			
			case InputType.ChannelList:
			{
				response = [];
			
				if (Array.isArray(s))
				{

					for (let id of s as string[])
					{
						let channel = guild.channels.cache.get(id);

						if (channel)
						{
							response.push(channel);
						}
					}

				}

			}
			break;

			case InputType.RoleList:
			{
				response = [];
			
				if (Array.isArray(s))
				{

					for (let id of s as string[])
					{
						let role;

						try
						{
							role = await guild.roles.fetch(id);
						}
						catch {}

						if (role)
						{
							response.push(role);
						}
					}

				}

			}
			break;

			default:
			{
				response = s;
			}
			break;

		}

		if (!response)
		{

			criticalPluginError(
				this.pluginManager.controlChannel,
				`Could not find any ${ InputType[type] } with the id ${s} on the server. Maybee it no longer exists? Reconfigure the plugin to fix this Error`,
				this
			);

			return undefined;
		}

		return response as T;
	}

}
