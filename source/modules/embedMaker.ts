import * as Discord from "discord.js";
import * as lang from "../lang/embedMaker.js";

export async function embedFromMessage(message: Discord.Message, showUserIcon: boolean = true, showUserName: boolean = true, showTimestamp: boolean = true): Promise<Discord.MessageEmbed> {
	
	// If the Message is another Bot Embed, copy it
	if (message.author.bot && message.embeds.length === 1 && message.content.trim() === "") {
		return message.embeds[0];
	}

	let embed = new Discord.MessageEmbed();

	// Set Embeds Author
	let av: string | null = null;
	
	if (showUserIcon) { 
		av = message.author.avatarURL();
	}

	if (showUserName) {
		if (message.member !== null) {
			embed = embed.setAuthor(message.member.displayName, av || undefined);
		} else {
			embed = embed.setAuthor(message.author.username, av || undefined);
		}
	}
	
	// Colorize Embed
	if (message.member !== null) {
		embed = embed.setColor(message.member.displayColor);
	} else {
		embed = embed.setColor('#ffffff');
	}

	// Add Content
	embed = embed.setDescription(message.content);

	if (showTimestamp) {
		embed = embed.setTimestamp(message.createdTimestamp);
	}

	// Fetch and add Reply
	let replyMsg: Discord.Message | null = null;

	if (message.reference?.channelID === message.channel.id && message.reference.messageID) {
		replyMsg = await message.channel.messages.fetch(message.reference.messageID);
		
		let replyTxt = "> " + replyMsg.cleanContent;

		replyTxt = replyTxt.replace(/(\r\n|\r|\n)/gm, "\n> ");

		if (replyTxt.length > 64) {
			replyTxt = replyTxt.slice(0, 64 - 6) + " [...]";
		}

		let authorName = "";

		if (replyMsg.member !== null) {
			authorName = replyMsg.member.displayName;
		} else {
			authorName = replyMsg.author.username;
		}

		embed = embed.addField(`\u2514\u2500\u25b7 ${lang.reply} ${authorName}:`, replyTxt);
	}

	// Reattach Image
	// TODO multiple Images
	let attachment = message.attachments.first();

	if (attachment && (attachment.width || attachment.height)) {
		embed = embed.attachFiles([ attachment.url ])
					 .setImage(`attachment://${attachment.name}`);
	}
	
	return embed;
}