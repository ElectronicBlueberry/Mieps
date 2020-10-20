import * as lang from "../lang/plugins/pin.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";

import * as Discord from "discord.js";
import { embedFromMessage } from "../modules/embedMaker.js";
import { timeStamp } from "console";

// ========== Constants ==========
const timeLimit = 600000;


// ========== Plugin ==========

export default class MessagePinner extends Plugin.Plugin implements Plugin.iPlugin {
	name = "message_pinner";
	description = lang.pluginDescription;

	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "pin_channel", description: lang.pinChannel, type: Plugin.InputType.Channel},
		{name: "pin_count", description: lang.pinCount, type: Plugin.InputType.Number},
		{name: "pin_emoji", description: lang.pinEmoji, type: Plugin.InputType.Emoji}
	];

	private pin = new Pin(this);

	async init(): Promise<void> {
		this.pin.emoji = await this.getSetting<Discord.Emoji>("pin_emoji", Plugin.InputType.Emoji);
	}

	commands = [
		this.pin
	]
}

// ========== Emoji Commands ==========

class Pin extends Plugin.EmojiCommand {
	constructor(private plugin: MessagePinner) {
		super("pin");
	}

	permission = Plugin.Permission.User;

	getHelpText() {
		return lang.pinHelp;
	}

	async run(reaction: Discord.MessageReaction, member: Discord.GuildMember): Promise<void> {
		let count = await this.plugin.getSetting("pin_count", Plugin.InputType.Number) as number;

		// Check if there are enough Reactions
		if (!reaction.count || reaction.count < count) {
			return;
		}

		let message = reaction.message;
		let author = message.author;

		// Check if author has reacted
		if (!await checkForAuthor(reaction, author)) {
			return;
		}

		// Check if message was pinned before
		let channelMessages = this.plugin.state.read("pins", message.channel.id)
		if (channelMessages && channelMessages.includes(message.id)) {
			return;
		}

		// Note it down as a pinned message
		this.plugin.state.write("pins", message.channel.id, message.id);

		let pinChannel = await this.plugin.getSetting("pin_channel", Plugin.InputType.Channel) as Discord.TextChannel;
		let messages = await fetchMessages(message, author);

		let embeds: Array<Discord.MessageEmbed> = [];

		// Iterate the Array backwards, as the order is reversed
		for (var i = messages.length - 1; i >= 0; i--) {
			embeds.push(await embedFromMessage(messages[i], false, false))
		}

		await pinChannel.send(lang.pinHeadingMessage(author, message.channel));

		for (const embed of embeds) {
			await pinChannel.send("", embed);
		}

	}
}

// ========== Functions ==========

async function checkForAuthor(reaction: Discord.MessageReaction, author: Discord.User): Promise<boolean> {
	await reaction.users.fetch();
	return reaction.users.cache.has(author.id);
}

async function fetchMessages(message: Discord.Message, author: Discord.User): Promise<Array<Discord.Message>> {
	let messages: Array<Discord.Message> = [message];
	let channel = message.channel;

	let msg = message;

	// Add up to 25 messages from same author
	for(var i = 0; i < 25; i++) {
		var nextFetch = await channel.messages.fetch({
			limit: 1,
			before: msg.id
		});

		var nextMsg = nextFetch.first();
		
		// There is no next message
		if (!nextMsg) {
			break;
		}

		// Next message is not by author
		if (nextMsg.author.id !== author.id) {
			break;
		}

		// Next message was posted more than 10 min ago
		if (msg.createdTimestamp - nextMsg.createdTimestamp > timeLimit) {
			break;
		}

		messages.push(nextMsg);
		msg = nextMsg;
	}

	return messages;
}
