import * as Discord from "discord.js";
import {BuiltIn} from "./modules/builtinCommands.js";
import {PluginManager} from "./modules/pluginManager.js";
import * as fs from 'fs';
import {criticalError} from "./modules/errorHandling.js";
import * as Path from 'path';

import * as config from "./config/server.json";

// Attempt to load Instance Config
var instanceConfig = {
	api_key: "",
	control_channel: ""
};

let instancePath = Path.resolve("./instance.json");

try {
	let cfgFile = fs.readFileSync(instancePath, 'utf8');
	instanceConfig = JSON.parse(cfgFile);
} catch {
	let cfgFile = JSON.stringify(instanceConfig);
	try {
		fs.writeFileSync(instancePath, cfgFile, 'utf8');
	} catch(e) {
		criticalError("Failed to create empty config File", e);
	}
	
	criticalError(`Please configure the "instance.json" file`);
}

if (instanceConfig.api_key === "" || instanceConfig.control_channel === "") {
	criticalError(`Please configure the "instance.json" file`);
}

// Create Client and connect
const client = new Discord.Client();
client.login(instanceConfig.api_key);

const pluginManager = new PluginManager(client, instanceConfig);

// Scan the Plugin Folder for Plugin Files
pluginManager.scanForPlugins(Path.resolve(config.plugin_folder), config.plugin_suffix);

// Add Built-ins
var builtin = new BuiltIn(client, pluginManager);
pluginManager.addBuiltin(builtin);

// Events
client.on("ready", () => {
	pluginManager.initiateAll();
});

client.on("message", async (message) => {
	if (message.channel.type !== "text" || message.author.bot) return;

	if (await pluginManager.runChatStreams(message)) {
		if (message.content.startsWith(config.command_prefix)) {
			pluginManager.runChatCommand(message);
		}
	}
});

client.on("messageReactionAdd", async (reaction, user) => {
	if (reaction.message.channel.type !== "text" || reaction.me) return;

	pluginManager.runEmojiCommand(reaction, user as Discord.User);
});

// Trigger Reactions for uncached messages
// @ts-ignore: Argument type error
client.on("raw", async (packet) => {
    if ('MESSAGE_REACTION_ADD' !== packet.t) return;

	const channel = client.channels.cache.get(packet.d.channel_id) as Discord.TextChannel;

	if (!channel) return;
	if (channel.type !== "text") return;

    // There's no need to emit if the message is cached, because the event will fire anyway for that
	if (channel.messages.cache.has(packet.d.message_id)) return;
	
	let message = await channel.messages.fetch(packet.d.message_id, true);
	const emoji = packet.d.emoji.id || packet.d.emoji.name;
	const reaction = message.reactions.cache.get(emoji);
	if (reaction) {
		reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id) as Discord.User);
		client.emit('messageReactionAdd', reaction as Discord.MessageReaction, client.users.cache.get(packet.d.user_id) as Discord.User);
	}
});
