import * as lang from "../lang/plugins/messageMover.js";
import * as Plugin from "../modules/plugin.js";
import { InputType } from "../modules/inputCollector.js";
import { State } from "../modules/state.js";

import * as Discord from "discord.js";

export default class MessageMover extends Plugin.Plugin implements Plugin.iPlugin {
	name = "message_mover";
	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "audit_log_channel", description: lang.auditLogChannel, type: InputType.Channel},
		{name: "start_cut_emoji", description: lang.startCutEmoji, type: InputType.Emoji},
		{name: "end_cut_emoji", description: lang.endCutEmoji, type: InputType.Emoji},
		{name: "delete_emoji", description: lang.deleteEmoji, type: InputType.Emoji},
		{name: "copy_emoji", description: lang.copyEmoji, type: InputType.Emoji}
	];
}

class DeleteSingle extends Plugin.EmojiCommand {
	constructor(private plugin: MessageMover) {
		super("deleteSingle");
	}
}