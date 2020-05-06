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

	async init(): Promise<void> {
		this.deleteSingle.emoji = await this.getSetting<Discord.Emoji>("delete_emoji", Plugin.InputType.Emoji)
	}

	commands = [
		this.deleteSingle
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

	async run(reaction: Discord.MessageReaction): Promise<void> {
		let logChannel = await this.plugin.getSetting<Discord.TextChannel>("audit_log_channel", Plugin.InputType.Channel);

		try {
			let message = reaction.message;
			let embed = embedFromMessage(message);

			await logChannel?.send(lang.logMessage(reaction.users.cache.first()), embed);
			await message.delete();
		} catch {
			logChannel?.send(lang.deleteFailed());
		}
	}
}