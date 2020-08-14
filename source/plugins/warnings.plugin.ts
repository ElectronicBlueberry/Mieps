import * as lang from "../lang/plugins/warnings.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
import * as Query from "../modules/inputCollector.js";

import * as Discord from "discord.js";

// ========== Plugin ==========

export default class Warnings extends Plugin.Plugin {
	name = "warnings";
	description = lang.warningsDescription;

	state = new State(this.name);

	// how many mods have to approve a warning before it can be sent out
	approveCount: number | undefined;

	setupTemplate: Plugin.SetupTemplate = [
		{name: "archive_channel", description: lang.archiveChannelDescription, type: Plugin.InputType.Channel},
		{name: "approve_count", description: lang.approveCountDescription, type: Plugin.InputType.Number}
	]

	async init(): Promise<void> {
		this.approveCount = await this.getSetting<number>("approve_count", Plugin.InputType.Number);
	}

	async getArchiveChannel(): Promise<Discord.TextChannel | undefined> {
		return await this.getSetting<Discord.TextChannel>("archive_channel", Plugin.InputType.Channel);
	}

	commands = [
		new Warning(this)
	]
}

// ========== Functions ==========

function resetWarning(state: State): void {
	state.write("warning", "active", false);
	state.write("warning", "target", null);
	state.write("warning", "author", null);
	state.write("warning", "messageId", null);
	state.write("warning", "approves", null);
	state.write("warning", "vetos", null);
}

function timeoutOrCancel(ans: Query.InputReturns, channel: Discord.TextChannel, state: State): void {
	if (ans === Query.InputReturns.TimedOut) {
		channel.send(lang.creationTimeout);
		resetWarning(state);
		return;
	}

	if (ans === Query.InputReturns.Canceled) {
		channel.send(lang.creationCancel);
		resetWarning(state);
		return;
	}
}

async function getWarningText(channel: Discord.TextChannel, state: State): Promise<string> {
	try {
		let msg = await channel.messages.fetch(state.read("warning", "messageId"));
		return msg.content;
	} catch(e) {
		channel.send(lang.errorWarningNotFound);
	}
	return "";
}

/**
 * Attempts to send a warning, and returns sucess
 * @param channel 
 * @param warning 
 * @param user 
 */
async function sendWarningTo(channel: Discord.TextChannel, warning: string, user: Discord.User): Promise<boolean> {
	try {
		await user.send(lang.warningPretext);
		await user.send(warning);
		await user.send(lang.warningPosttext);
		return true;
	} catch(e) {
		channel.send(lang.errorCouldNotSend);
		return false;
	}
}

// ========== Chat Commands ==========

class Warning extends Plugin.ChatCommand {
	constructor(private plugin: Warnings) {
		super(lang.warningCommand);
	}

	permission = Plugin.Permission.Mod;

	getHelpText() {
		return lang.warningHelp(this.plugin.state.read("warning", "active"));
	}

	async run(message: Discord.Message, args: Array<string>): Promise<void> {
		let channel = message.channel;

		if (args.length === 0) {
			channel.send(this.getHelpText());
			return;
		}

		switch (args[0]) {
			case lang.newCommand:
				newWarning(message, this.plugin.state, this.plugin.approveCount);
				break;

			case lang.cancelCommand:
				cancelWarning(message, this.plugin.state);
				break;

			case lang.vetoCommand:
				vetoWarning(message, this.plugin.state);
				break;

			case lang.approveCommand:
				approveWarning(message, this.plugin.state, this.plugin.approveCount);
				break;

			case lang.previewCommand:
				previewWarning(message, this.plugin.state);
				break;

			case lang.sendCommand:
				sendWarning(message, this.plugin.state, this.plugin.client, this.plugin, this.plugin.approveCount);
				break;
		}
	}
}

// ========== Sub Commands ==========

async function newWarning(message: Discord.Message, state: State, approveCount?: number): Promise<void> {
	let channel = message.channel as Discord.TextChannel;
	let author = message.author;
	
	if (state.read("warning", "active")) {
		channel.send(lang.warningOpen());
		return;
	}

	let user;
	let answer: Query.InputReturns;
	[user, answer] = await Query.queryInput(channel, author, lang.queryUser, Plugin.InputType.User, false);

	if (answer !== Query.InputReturns.Answered) {
		timeoutOrCancel(answer, channel, state);
		return;
	}

	state.write("warning", "active", true);
	state.write("warning", "target", user.id);

	// Feedback found User
	await channel.send(lang.queryUserReturn(user));

	let msg: Query.InputReturns;
	[msg, answer] = await Query.queryInput(channel, author, lang.queryMessage, Plugin.InputType.Message, true, 900000);

	if (answer !== Query.InputReturns.Answered) {
		timeoutOrCancel(answer, channel, state);
		return;
	}

	state.write("warning", "messageId", msg);
	state.write("warning", "author", author.id);

	// Feedback warning creation complete
	channel.send(lang.creationComplete(approveCount || 0));
}

async function cancelWarning(message: Discord.Message, state: State): Promise<void> {
	message.channel.send(lang.canceled);
	resetWarning(state);
}

async function vetoWarning(message: Discord.Message, state: State): Promise<void> {
	let channel = message.channel as Discord.TextChannel;
	let author = message.author;

	// If there is no active warning, print help and decline veto
	if (!state.read("warning", "active")) {
		channel.send(lang.warningHelp(false));
		return;
	}

	let vetos = state.read("warning", "vetos") as Array<string> || [];
	if (!vetos.includes(author.id)) {
		vetos.push(author.id);
	}

	state.write("warning", "vetos", vetos);

	channel.send(lang.veto(author));
}

async function approveWarning(message: Discord.Message, state: State, approveCount?: number): Promise<void> {
	let channel = message.channel as Discord.TextChannel;
	let author = message.author;

	// If there is no active warning, print help and decline vote
	if (!state.read("warning", "active")) {
		channel.send(lang.warningHelp(false));
		return;
	}

	// Get vetos and check if a veto needs to be undone
	let vetos = state.read("warning", "vetos") as Array<string> || [];

	let index = vetos.indexOf(author.id);
	if (index > -1) {
		vetos.splice(index, 1);
		state.write("warning", "vetos", vetos);
	}

	let approves = state.read("warning", "approves") as Array<string> || [];
	if (!approves.includes(author.id)) {
		approves.push(author.id);
	}

	state.write("warning", "approves", approves);

	let ac = approveCount || 0;
	channel.send(lang.approved(author, ac - approves.length, (vetos.length !== 0)));
}

async function previewWarning(message: Discord.Message, state: State): Promise<void> {
	let channel = message.channel as Discord.TextChannel;

	// If there is no active warning, print help
	if (!state.read("warning", "active")) {
		channel.send(lang.warningHelp(false));
		return;
	}

	let warning = await getWarningText(channel, state);

	if (warning == "") {
		return;
	}

	sendWarningTo(channel, warning, message.author);
}

async function sendWarning(message: Discord.Message, state: State, client: Discord.Client, plugin: Warnings, approveCount?: number): Promise<void> {
	let channel = message.channel as Discord.TextChannel;
	let count = approveCount || 0;

	// If there is no active warning, print help and decline vote
	if (!state.read("warning", "active")) {
		channel.send(lang.warningHelp(false));
		return;
	}

	// If there are any Vetos, cancel sending
	let vetos = state.read("warning", "vetos") as Array<string> || [];
	if (vetos.length !== 0) {
		channel.send(lang.blockedByVeto(vetos));
		return;
	}

	// Check if there are enough approves
	let approves = state.read("warning", "approves") as Array<string> || [];
	let deltaC = count - approves.length;
	if (deltaC > 0) {
		channel.send(lang.notEnoughVotes(deltaC));
		return;
	}

	// Find target User
	let targetId = state.read("warning", "target") as string || "";

	let user: Discord.User;
	try {
		user = await client.users.fetch(targetId);
	} catch(e) {
		channel.send(lang.targetNotFound);
		return;
	}

	// Send Warning
	let warning = await getWarningText(channel, state);

	if (warning == "") {
		return;
	}

	sendWarningTo(channel, warning, user);

	// Archive
	let archiveChannel = await plugin.getArchiveChannel();
	archiveChannel?.send(lang.archiveWarning(state.read("warning", "author"), targetId, approves));
	archiveChannel?.send(warning);

	// Reset Warning
	resetWarning(state);
}
