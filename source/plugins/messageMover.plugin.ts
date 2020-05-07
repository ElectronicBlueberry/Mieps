import * as lang from "../lang/plugins/messageMover.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";

import * as Discord from "discord.js";
import { embedFromMessage } from "../modules/embedMaker.js";
import { stat } from "fs";
import { stringify } from "querystring";

// ========== Plugin ==========

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
	private startSelection = new Selection(this, "start");
	private endSelection = new Selection(this, "end");

	async init(): Promise<void> {
		this.deleteSingle.emoji = await this.getSetting<Discord.Emoji>("delete_emoji", Plugin.InputType.Emoji);
		this.copySingle.emoji = await this.getSetting<Discord.Emoji>("copy_emoji", Plugin.InputType.Emoji);
		this.startSelection.emoji = await this.getSetting<Discord.Emoji>("start_cut_emoji", Plugin.InputType.Emoji);
		this.endSelection.emoji = await this.getSetting<Discord.Emoji>("end_cut_emoji", Plugin.InputType.Emoji);
	}

	async getLogChannel(): Promise<Discord.TextChannel | undefined> {
		return await this.getSetting<Discord.TextChannel>("audit_log_channel", Plugin.InputType.Channel);
	}

	commands = [
		this.deleteSingle,
		this.copySingle,
		this.startSelection,
		this.endSelection,
		new MoveMessages(this),
		new DeleteMessages(this),
		new CopyMessages(this)
	]
}

// ========== Interfaces ==========

interface SelectionMark {
	channel: string,
	message: string,
	id: string
}

// ========== Functions ==========

async function fetchSelected(member: Discord.GuildMember, state: State): Promise<Discord.Collection<string, Discord.Message> | undefined> {
	let startIds: SelectionMark | undefined = state.read(member.id, "start");
	let endIds: SelectionMark | undefined = state.read(member.id, "end");

	// If no Ids were set, return now
	if (!startIds || !endIds || startIds.channel !== endIds.channel) return;

	let guild = member.guild;
	let channel = guild.channels.cache.get(startIds.channel) as Discord.TextChannel;

	// If channel no longer exists, return now
	if (!channel) return;

	let messages = new Discord.Collection<string, Discord.Message>();

	// This is wrapped in a try catch block, as the messages may be deleted
	try {
		// Get the first and the last message
		let start = await channel.messages.fetch(startIds.message);
		let end = await channel.messages.fetch(endIds.message);
		
		// Start populating the Message Collection
		messages.set(start.id, start);

		// Keep fetching messages, until we have arrived at the last message
		let current = start;

		while(current.createdTimestamp < end.createdTimestamp) {
			let newMessages = await channel.messages.fetch({ after: current.id });
			newMessages = newMessages.sort((a, b) => {return a.createdTimestamp - b.createdTimestamp});
			messages = messages.concat(newMessages);
			current = newMessages.last() as Discord.Message;

			// Edge-Case that occurs when a crucial message was deleted
			if (!current) break;
		}

		// Filter all messages, which were psoted after the last message
		messages = messages.filter(m => m.createdTimestamp <= end.createdTimestamp);
	} catch {
		return;
	}

	return messages;
}

// ========== Emoji Commands ==========

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

			await (logChannel as Discord.TextChannel).send(lang.logMessage(member), embed);
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

class Selection extends Plugin.EmojiCommand {
	constructor(private plugin: MessageMover, private position: string) {
		super("startSelection");
	}

	permission = Plugin.Permission.Mod;

	getHelpText() {
		return lang.startCutHelp;
	}

	async run(reaction: Discord.MessageReaction, member: Discord.GuildMember): Promise<void> {
		// Delete the old mark, if one is present
		let oldR = this.plugin.state.read(member.id, this.position) as SelectionMark | undefined;
		if (oldR) {
			try {
				let guild = member.guild;
				let channel = guild.channels.cache.get(oldR.channel) as Discord.TextChannel;
				let oldRMessage = await channel?.messages.fetch(oldR.message);

				if (!(oldRMessage.id === reaction.message.id && oldRMessage.channel.id === reaction.message.channel.id))
					await (await oldRMessage.reactions.cache.get(oldR.id)?.fetch())?.users.remove(member.id);
			} catch {}
		}

		this.plugin.state.write(member.id, this.position, {
			channel: reaction.message.channel.id,
			message: reaction.message.id,
			id: reaction.emoji.id
		} as SelectionMark);
	}
}

// ========== Chat Commands ==========

class MoveMessages extends Plugin.ChatCommand {
	constructor(private plugin: MessageMover) {
		super("move");
	}

	permission = Plugin.Permission.Mod;

	getHelpText() {
		return lang.moveHelp;
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let member = message.member as Discord.GuildMember;

		try {
			let messages = await fetchSelected(member, this.plugin.state);

			if (!messages) {
				message.channel.send(lang.failMessage());
				return;
			}

			let embeds = messages.map(m => {
				return embedFromMessage(m);
			});

			// Send Messages to new Channel
			for (const embed of embeds) {
				await message.channel.send("", embed);
			}

			// Delete old Messages
			messages.forEach(m => {
				m.delete();
			});

			// Post Response
			let attachment = new Discord.MessageAttachment("./img/banner.gif");
			let sourceChannelId = (this.plugin.state.read(member.id, "start") as SelectionMark).channel;
			let sourceChannel = member.guild.channels.cache.get(sourceChannelId) as Discord.TextChannel;
			sourceChannel.send(lang.moved(embeds.length, message.channel as Discord.TextChannel), attachment);

			// Delete Command
			message.delete();
		} catch {
			message.channel.send(lang.failMessage());
		}
	}
}

class CopyMessages extends Plugin.ChatCommand {
	constructor(private plugin: MessageMover) {
		super("copy");
	}

	permission = Plugin.Permission.Mod;

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let member = message.member as Discord.GuildMember;

		try {
			let messages = await fetchSelected(member, this.plugin.state);

			if (!messages) {
				message.channel.send(lang.copyFailed());
				return;
			}

			let embeds = messages.map(m => {
				return embedFromMessage(m);
			});

			// Send Messages to new Channel
			for (const embed of embeds) {
				await message.channel.send("", embed);
			}

			// Delete Command
			await message.delete();
		} catch {
			message.channel.send(lang.copyFailed());
		}
	}
}

class DeleteMessages extends Plugin.ChatCommand {
	constructor(private plugin: MessageMover) {
		super("delete");
	}

	permission = Plugin.Permission.Mod;

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let member = message.member as Discord.GuildMember;
		let logChannel = await this.plugin.getLogChannel();

		try {
			let messages = await fetchSelected(member, this.plugin.state);

			if (!messages) {
				message.channel.send(lang.deleteFailed());
				return;
			}

			let embeds = messages.map(m => {
				return embedFromMessage(m);
			});

			// Log Message
			await (logChannel as Discord.TextChannel).send(lang.logMessage(member));

			// Send Messages to log-Channel
			for (const embed of embeds) {
				await (logChannel as Discord.TextChannel).send("", embed);
			}

			// Delete old Messages
			messages.forEach(m => {
				m.delete();
			});

			// Delete Command
			await message.delete();
		} catch {
			message.channel.send(lang.deleteFailed());
		}
	}
}
