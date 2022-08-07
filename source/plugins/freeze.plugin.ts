import * as Discord from 'discord.js';
import * as Plugin from "../modules/plugin.js";
import * as Lang from "../lang/plugins/freeze.js";
import { uncaughtError } from '../modules/errorHandling.js';

export default class FreezePlugin extends Plugin.Plugin
{
	name = "freeze";
	description = Lang.description;

	commands = [
		new FreezeTaw(this, true),
		new FreezeTaw(this, false)
	]

	getMemberRole(guild: Discord.Guild): Discord.Role | undefined
	{
		return this.pluginManager.getPermissionRole( Plugin.Permission.User, guild );
	}

	getModRole(guild: Discord.Guild): Discord.Role | undefined
	{
		return this.pluginManager.getPermissionRole( Plugin.Permission.SuperMod, guild );
	}
}

class FreezeTaw extends Plugin.ChatCommand
{
	permission = Plugin.Permission.ChatMod;
	plugin: FreezePlugin;
	freeze: boolean;

	constructor(plugin: FreezePlugin, freeze: boolean)
	{
		super(freeze ? "freeze" : "unfreeze");
		this.plugin = plugin;
		this.freeze = freeze;
	}

	getHelpText()
	{
		return Lang.help;
	}

	async run(message: Discord.Message): Promise<void>
	{
		let channel = message.channel as Discord.TextChannel;
		
		if (!message.guild)
		{
			return;
		}

		let memberRole = this.plugin.getMemberRole( message.guild );
		let modRole = this.plugin.getModRole( message.guild );

		if (!channel.manageable || !memberRole || !modRole)
		{
			if (this.freeze) channel.send( Lang.error );

			return;
		}

		try
		{
			if (this.freeze)
			{
				// Block members from writing, and allow mods to write
				await channel.permissionOverwrites.edit(memberRole, {'SendMessages': false}, {reason: "channel freeze"})
				await channel.permissionOverwrites.edit( modRole, { 'SendMessages': true } );
				
				channel.send( Lang.freeze );
			}
			else
			{
				// Reset member perm to neutral on unfreeze
				await channel.permissionOverwrites.edit( memberRole, { 'SendMessages': null } );

				channel.send( Lang.unfreeze );
			}

		}
		catch(e)
		{
			
			uncaughtError(
				this.plugin.pluginManager.controlChannel,
				(this.freeze) ? "freeze" : "unfreeze",
				e,
				message.content
			);

		}

	}
	
}
