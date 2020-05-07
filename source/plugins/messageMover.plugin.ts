import * as lang from "../lang/plugins/messageMover.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";

import * as Discord from "discord.js";
import { embedFromMessage } from "../modules/embedMaker.js";

export default class MessageMover extends Plugin.Plugin implements Plugin.iPlugin {
	name = "message_mover";
	description = lang.pluginDescription;

	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "audit_log_channel", description: lang.auditLogChannel, type: Plugin.InputType.Channel},
		{name: "start_cut_emoji", description: lang.startCutEmoji, type: Plugin.InputType.Emoji},
		{name: "end_cut_emoji", description: lang.endCutEmoji, type: Plugin.InputType.Emoji},
		{name: "delete_emoji", description: lang.deleteEmoji, type: Plugin.InputType.Emoji},
		{name: "copy_emoji", description: lang.copyEmoji, type: Plugin.InputType.Emoji}
	];

	private deleteSingle = new DeleteSingle(this);
	private copySingle = new CopySingle(this);

	async init(): Promise<void> {
		this.deleteSingle.emoji = await this.getSetting<Discord.Emoji>("delete_emoji", Plugin.InputType.Emoji);
		this.copySingle.emoji = await this.getSetting<Discord.Emoji>("copy_emoji", Plugin.InputType.Emoji);
	}

	async getLogChannel(): Promise<Discord.TextChannel | undefined> {
		return await this.getSetting<Discord.TextChannel>("audit_log_channel", Plugin.InputType.Channel);
	}

	commands = [
		this.deleteSingle,
		this.copySingle
	]
}

class DeleteSingle extends Plugin.EmojiCommand {
	constructor(private plugin: MessageMover) {
		super("deleteSingle");
	}

	permission = Plugin.Permission.Mod;
	
	getHelpText() {
		return lang.deleteSingleHelp;
	}

	async run(reaction: Discord.MessageReaction, member: Discord.GuildMember): Promise<void> {
		let logChannel = await this.plugin.getLogChannel();

		try {
			let message = reaction.message;
			let embed = embedFromMessage(message);

			await logChannel?.send(lang.logMessage(member), embed);
			await message.delete();
		} catch {
			logChannel?.send(lang.deleteFailed());
		}
	}
}

class CopySingle extends Plugin.EmojiCommand {
	constructor(private plugin: MessageMover) {
		super("copySingle");
	}

	permission = Plugin.Permission.Mod;

	getHelpText() {
		return lang.copySingleHelp;
	}

	async run(reaction: Discord.MessageReaction, member: Discord.GuildMember): Promise<void> {
		let logChannel = await this.plugin.getLogChannel();

		try {
			let message = reaction.message;
			let embed = embedFromMessage(message);

			await logChannel?.send(lang.copyLog(member), embed);
		} catch {
			logChannel?.send(lang.copyFailed());
		}
	}
}