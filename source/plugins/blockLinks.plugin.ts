import * as lang from "../lang/plugins/blockLinks.js";
import * as Plugin from "../modules/plugin.js";
import {State} from "../modules/state.js"
import * as Discord from "discord.js";
import { embedFromMessage } from "../modules/embedMaker.js";

export default class BlockLinks extends Plugin.Plugin {
	name = "block_links";
	description = lang.description;

	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "log_channel", description: lang.logDescription, type: Plugin.InputType.Channel},
		{name: "linger", description: lang.lingerDescription, type: Plugin.InputType.Number}
	];

	logChannel: Discord.TextChannel | undefined;
	linger: number = 1000;

	async init(): Promise<void> {
		this.logChannel = await this.getSetting("log_channel", Plugin.InputType.Channel) as Discord.TextChannel;
		this.linger = await this.getSetting("linger", Plugin.InputType.Number) as number * 1000;
	}

	messageStream = new LinkFilter(this);
}

const linkRegex = /https?:\/\/[^\s]+/gm;

class LinkFilter implements Plugin.MessageStream {
	plugin: BlockLinks;
	name = "link_filter";

	constructor(plugin: BlockLinks) {
		this.plugin = plugin;
	}

	async run(message: Discord.Message): Promise<boolean> {
		let member = message.member;

		if (!member || this.plugin.pluginManager.getHighestMemberPermission(member) !== Plugin.Permission.Any) {
			return true;
		}

		if (message.content.match(linkRegex)) {
			let embed = embedFromMessage(message);
			message.delete();
			this.plugin.logChannel?.send(lang.logMessage(message.channel.id));
			this.plugin.logChannel?.send(embed);

			let feedbackMsg = await message.channel.send(lang.feedbackMessage);
			feedbackMsg.delete({timeout: this.plugin.linger})

			return false;
		} else {
			return true;
		}
	}
}
