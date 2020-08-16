import * as lang from "../lang/plugins/joinGreeting.js";
import * as Plugin from "../modules/plugin.js";
import {State} from "../modules/state.js"
import { description } from "../lang/plugins/freeze.js";
import * as Discord from "discord.js";
import { time } from "console";
import { InputReturns } from "../modules/inputCollector.js";

export default class Greetings extends Plugin.Plugin {
	name = "greetings";
	description = lang.description;

	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "join_channel", description: lang.joinChannelInfo, type: Plugin.InputType.Channel},
		{name: "intro_channel", description: lang.introChannelInfo, type: Plugin.InputType.Channel},
		{name: "rule_channel", description: lang.ruleChannelInfo, type: Plugin.InputType.Channel},
		{name: "timeout", description: lang.timeoutInfo, type: Plugin.InputType.Number}
	];

	joinStream = new JoinGreeting(this);
}

class JoinGreeting implements Plugin.MemberStream {
	name = "join_greeting";
	plugin: Greetings;

	constructor(plugin: Greetings) {
		this.plugin = plugin;
	}

	async run(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void> {
		let joinChannel = await this.plugin.getSetting("join_channel", Plugin.InputType.Channel) as Discord.TextChannel;
		let introChannel = await this.plugin.getSetting("intro_channel", Plugin.InputType.Channel) as Discord.TextChannel;
		let ruleChannel = await this.plugin.getSetting("rule_channel", Plugin.InputType.Channel) as Discord.TextChannel;
		let timeout = await this.plugin.getSetting("timeout", Plugin.InputType.Number) as number * 1000;

		setTimeout(() => {
			joinChannel.send(lang.greeting(member.id, ruleChannel.id, introChannel.id));
		}, timeout);
	}
}
