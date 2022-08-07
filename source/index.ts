import * as Path from 'path'
import * as Fs from 'fs'

import * as Discord from "discord.js"

import * as config from "./config/server.json"

import { BuiltIn } from "./modules/builtinCommands.js"
import { PluginManager } from "./modules/pluginManager.js"
import { criticalError } from "./modules/errorHandling.js"
import { ChannelType, GatewayIntentBits } from 'discord.js'


// ------ Initialize Bot ------

// attempt to load instance config
var instanceConfig = {
	api_key: "",
	control_channel: ""
};

console.log("loading settings...");

let instancePath = Path.resolve("./instance.json");

try
{
	let cfgFile = Fs.readFileSync(instancePath, 'utf8');
	
	instanceConfig = JSON.parse(cfgFile);
}
catch
{
	let cfgFile = JSON.stringify(instanceConfig);

	try
	{
		Fs.writeFileSync(instancePath, cfgFile, 'utf8');
	}
	catch(e)
	{
		criticalError("Failed to create empty config File", e);
	}
	
	criticalError(`Please configure the "instance.json" file`);
}

if (instanceConfig.api_key === "" || instanceConfig.control_channel === "")
{
	criticalError(`Please configure the "instance.json" file`);
}

// create client and connect
const client = new Discord.Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.MessageContent]});

client.login(instanceConfig.api_key);

console.log("connecting to Discord...");

const pluginManager = new PluginManager(client, instanceConfig);

// scan the plugin folder for plugin files
pluginManager.scanForPlugins( Path.resolve( config.plugin_folder ), config.plugin_suffix );

// add built-in plugin
var builtin = new BuiltIn(client, pluginManager);

pluginManager.addBuiltin(builtin);

// ------ Client Events ------

client.on("ready", () => {

	pluginManager.initiateAll();

	console.log("Mieps ready!");

});

client.on("messageCreate", async (message) => {

	// don't react to non-text messages, or bot messages
	//TODO pruefen ersatz zu message.channel.type !== "text" 
	if (!(message.channel.type === ChannelType.GuildText || message.channel.type === ChannelType.GuildPublicThread ||  message.channel.type === ChannelType.GuildPrivateThread || message.channel.type === ChannelType.DM) || message.author.bot) return;

	// run the message streams
	let runCommands = await pluginManager.runChatStreams(message);

	// if message streams did not block further execution, check for commands and run
	if (runCommands)
	{
		if (message.content.startsWith( config.command_prefix ))
		{
			pluginManager.runChatCommand(message);
		}
	}

});

client.on("messageReactionAdd", async (reaction, user) => {

	if (!(reaction.message.channel.type === ChannelType.GuildText || reaction.message.channel.type === ChannelType.GuildPublicThread ||  reaction.message.channel.type === ChannelType.GuildPrivateThread || reaction.message.channel.type === ChannelType.DM) || user.bot) return;
	if(reaction.partial){
		reaction.fetch()
		.then(fullReaction => {
			pluginManager.runEmojiCommand(fullReaction, user as Discord.User);
		})
		.catch(error => {
			//TODO Fehlermeldung
			console.log('Something went wrong when fetching the message: ', error);
		});
	}else{
		pluginManager.runEmojiCommand(reaction, user as Discord.User);
	}
});

client.on("guildMemberAdd", async (member) => {

	pluginManager.runJoinStreams(member);

});

client.on("guildMemberRemove", async (member) => {

	pluginManager.runLeaveStreams(member);

});

// trigger Reactions for uncached messages
// @ts-ignore: Argument type error
client.on("raw", async (packet) => {

	// we only want reaction add events
    if ('MESSAGE_REACTION_ADD' !== packet.t) return;

	const channel = client.channels.cache.get( packet.d.channel_id ) as Discord.TextChannel;

	// if for whatever reason, the channel does not exists, or is not a text channel, abort
	if (!channel) return;
	if (channel.type !== ChannelType.GuildText) return;

    // there's no need to emit if the message is cached, because the event will fire anyway for that
	if (channel.messages.cache.has( packet.d.message_id )) return;
	
	// fetch and cache message
	let message = await channel.messages.fetch( {message: packet.d.message_id, cache: true, force: false});

	// set the emoji to either a custom one, or a default one
	const emoji = packet.d.emoji.id ?? packet.d.emoji.name;

	const reaction = message.reactions.cache.get(emoji);

	if (reaction)
	{
		// update the reaction cache
		reaction.users.cache.set( packet.d.user_id, client.users.cache.get( packet.d.user_id ) as Discord.User);

		// emit reaction event, with now cached message and reaction
		client.emit('messageReactionAdd', reaction as Discord.MessageReaction, client.users.cache.get( packet.d.user_id ) as Discord.User);
	}

});
