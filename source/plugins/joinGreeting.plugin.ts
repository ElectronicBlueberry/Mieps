import * as Discord from "discord.js"

import * as Lang from "../lang/plugins/joinGreeting.js"
import * as Plugin from "../modules/plugin.js"
import { State } from "../modules/state.js"


export default class Greetings extends Plugin.Plugin
{
	name = "greetings";
	description = Lang.description;

	state = new State( this.name );

	joinStream = new JoinGreeting(this);

	setupTemplate: Plugin.SetupTemplate = [
		{ name: "join_channel", description: Lang.joinChannelInfo, type: Plugin.InputType.Channel },
		{ name: "intro_channel", description: Lang.introChannelInfo, type: Plugin.InputType.Channel },
		{ name: "rule_channel", description: Lang.ruleChannelInfo, type: Plugin.InputType.Channel },
		{ name: "timeout", description: Lang.timeoutInfo, type: Plugin.InputType.Number }
	];

}

class JoinGreeting implements Plugin.MemberStream
{
	name = "join_greeting";
	plugin: Greetings;

	constructor(plugin: Greetings)
	{
		this.plugin = plugin;
	}

	async run(member: Discord.GuildMember | Discord.PartialGuildMember): Promise<void>
	{
		let joinChannel = await this.plugin.getSetting( "join_channel", Plugin.InputType.Channel ) as Discord.TextChannel;
		let introChannel = await this.plugin.getSetting( "intro_channel", Plugin.InputType.Channel ) as Discord.TextChannel;
		let ruleChannel = await this.plugin.getSetting( "rule_channel", Plugin.InputType.Channel ) as Discord.TextChannel;
		let timeout = await this.plugin.getSetting( "timeout", Plugin.InputType.Number ) as number * 1000;

		setTimeout(() => {

			joinChannel.send( Lang.greeting( member.id, ruleChannel.id, introChannel.id ) );

		}, timeout);
	}
	
}
