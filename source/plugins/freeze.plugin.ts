import * as Discord from 'discord.js';
import * as Plugin from "../modules/plugin.js";
import * as lang from "../lang/plugins/freeze.js";
import { uncaughtError } from '../modules/errorHandling.js';

export default class FreezePlugin extends Plugin.Plugin {
	name = "freeze";
	description = lang.description;

	commands = [
		new FreezeTaw(this, true),
		new FreezeTaw(this, false)
	];

	getMemberRole(guild: Discord.Guild): Discord.Role | undefined {
		return this.pluginManager.getPermissionRole(Plugin.Permission.User, guild);
	}

	getModRole(guild: Discord.Guild): Discord.Role | undefined {
		return this.pluginManager.getPermissionRole(Plugin.Permission.Mod, guild);
	}
}

class FreezeTaw extends Plugin.ChatCommand {
	permission = Plugin.Permission.Mod;
	plugin: FreezePlugin;
	freeze: boolean;

	constructor(plugin: FreezePlugin, freeze: boolean) {
		super(freeze ? "freeze" : "unfreeze");
		this.plugin = plugin;
		this.freeze = freeze;
	}

	getHelpText() {
		return lang.help;
	}

	async run(message: Discord.Message): Promise<void> {
		let channel = message.channel as Discord.TextChannel;
		
		if (!message.guild) {
			return;
		}

		let memberRole = this.plugin.getMemberRole(message.guild);
		let modRole = this.plugin.getModRole(message.guild);

		if (!channel.manageable || !memberRole || !modRole) {
			if (this.freeze) channel.send(lang.error);
			return;
		}

		try {
			if (this.freeze) {
				// Block members from writing, and allow mods to write
				await channel.updateOverwrite(memberRole, {'SEND_MESSAGES': false}, "channel freeze");
				await channel.updateOverwrite(modRole, {'SEND_MESSAGES': true});

				channel.send(lang.freeze);
			} else {
				// Reset member perm to neutral on unfreeze
				await channel.updateOverwrite(memberRole, {'SEND_MESSAGES': null});

				channel.send(lang.unfreeze);
			}
		} catch(e) {
			uncaughtError(
				this.plugin.pluginManager.controlChannel,
				(this.freeze) ? "freeze" : "unfreeze",
				e,
				message.content
			);
		}
	}
}
