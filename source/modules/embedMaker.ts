import * as Discord from "discord.js"

import * as Lang from "../lang/embedMaker.js"


/**
 * creates a embed from a message
 * @param message message to create mebed from
 * @param showUserIcon if the authors icon should be included
 * @param showUserName if the users name should be included
 * @param showTimestamp if the original message timestamp should be included
 */
export async function embedFromMessage(
	message: Discord.Message,
	showUserIcon: boolean = true,
	showUserName: boolean = true,
	showTimestamp: boolean = true
): Promise<Discord.MessageEmbed>
{
	
	// if the message is another bot embed, copy it
	if (message.author.bot && message.embeds.length === 1 && message.content.trim() === "")
	{
		return message.embeds[0];
	}

	let embed = new Discord.MessageEmbed();

	// set embeds author
	let av: string | null = null;
	
	if (showUserIcon)
	{ 
		av = message.author.avatarURL();
	}

	if (showUserName)
	{

		if (message.member !== null)
		{
			embed = embed.setAuthor( message.member.displayName, av || undefined );
		}
		else
		{
			embed = embed.setAuthor( message.author.username, av || undefined );
		}

	}
	
	// colorize embed
	if (message.member !== null)
	{
		embed = embed.setColor( message.member.displayColor );
	}
	else
	{
		embed = embed.setColor('#ffffff');
	}

	// add content
	embed = embed.setDescription( message.content );

	if (showTimestamp)
	{
		embed = embed.setTimestamp( message.createdTimestamp );
	}

	// fetch reply and add preview text
	let replyMsg: Discord.Message | null = null;

	if (message.reference?.channelID === message.channel.id && message.reference.messageID)
	{
		try {
			replyMsg = await message.channel.messages.fetch( message.reference.messageID );
		}
		catch {}
		
		if (replyMsg)
		{
			let replyTxt = "> " + replyMsg.cleanContent;

			replyTxt = replyTxt.replace( /(\r\n|\r|\n)/gm, "\n> ");

			if (replyTxt.length > 64)
			{
				replyTxt = replyTxt.slice(0, 64 - 3) + "...";
			}

			let authorName = "";

			if (replyMsg.member !== null)
			{
				authorName = replyMsg.member.displayName;
			}
			else
			{
				authorName = replyMsg.author.username;
			}

			embed = embed.addField(`\u2514\u2500\u25b7 ${ Lang.reply } ${authorName}:`, replyTxt);
		}
	}

	// reattach image
	let attachment = message.attachments.first();

	if (attachment && (attachment.width || attachment.height))
	{
		embed = embed.attachFiles( [ attachment.url ] )
					 .setImage( `attachment://${attachment.name}` );
	}
	
	return embed;
}
