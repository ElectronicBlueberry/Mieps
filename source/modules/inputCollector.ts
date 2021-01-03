import * as Discord from "discord.js"
import EmojiRegex from "emoji-regex"

import * as lang from "../lang/inputCollector.js"
import { command_prefix } from "../config/server.json"


export enum InputType
{
	/** a server member */
	User,

	/** a default or custom emoji */
	Emoji,

	/** a server role */
	Role,

	/** a channel on the server */
	Channel,

	/** the response message */
	Message,

	/** the text content of the response */
	Text,

	/** the response as a number */
	Number,

	/** a list of text items seperated by linebreaks */
	TextList,

	/** a list of channel ids in string format */
	ChannelList,

	/** a list of role ids in string format */
	RoleList
}

export enum InputReturns
{
	/** user canceled input */
	Canceled,

	/** user did not respond in time */
	TimedOut,

	/** user answered */
	Answered
}

// matches default discord emojis
const emojiRegex = EmojiRegex();

let _usersInQuery: Map<string, Discord.User> = new Map();

/**
 * Queries the user for an Input
 * @param channel Channel the query is taking place in
 * @param user The User to Query
 * @param query The Query to ask
 * @param type The expected type of the queries answer
 * @param queryID If the Query should return only the ID, instead of the entire object. Does nothing for "Emoji"
 * @param timeout Time in Milliseconds to wait for a response. 5 min by default
 */
export async function queryInput(
	channel: Discord.TextChannel,
	user: Discord.User,
	query: string,
	type: InputType, 
	queryID: boolean = true,
	timeout: number = 300000
): Promise<[any, InputReturns]>
{
	_usersInQuery.set(user.id, user);
	let answer = await _queryInput(channel, user, query, type, queryID, timeout);
	_usersInQuery.delete(user.id);

	return answer;
}

async function _queryInput(
	channel: Discord.TextChannel,
	user: Discord.User,
	query: string,
	type: InputType,
	queryID: boolean,
	timeout: number
): Promise<[any, InputReturns]>
{
	channel.send(query);

	// this infinite loop is non blocking, becasue it is interrupted by await
	while (true)
	{
		let msgArr = await channel.awaitMessages(
			(m: Discord.Message) => m.author == user,
			{ max: 1, time: timeout }
		);

		// no message was posted before timeout
		if (msgArr.size === 0)
		{
			channel.send( lang.timeOut() );

			return [ "", InputReturns.TimedOut ];
		}

		// the response message
		let msg = msgArr.first() as Discord.Message;

		// user canceled input
		if (msg.content.toLowerCase().trimEnd() === `${command_prefix}cancel`)
		{
			channel.send( lang.canceled() );

			return [ "", InputReturns.Canceled ];
		}

		// the server the response was posted on
		let guild = channel.guild;

		switch (type)
		{

			// the query asked for a user
			case InputType.User:
			{
				// search for mentions
				let usr = msg.mentions.users?.first();

				if (usr)
				{
					return [ (queryID) ? usr.id : usr, InputReturns.Answered ];
				}

				// search for ids
				try
				{
					let memb = await guild.members.fetch( msg.content.trim() );

					return [ (queryID) ? memb.id : memb, InputReturns.Answered ];
				}
				catch {}
				
				// no user found
				channel.send( lang.wrongInputUser( msg.content.trim() ) );
			}
			break;

			// the query asked for an emoji 
			case InputType.Emoji:
			{
				// Catch custom emojis
				let emojis = msg.content.match( /(?<=:)[0-9]+(?=>)/ );

				if (emojis)
				{
					// Find the custom emoji, and return its id
					let emoji = guild.emojis.cache.get(emojis[0]);

					if (emoji) return [ emoji.id, InputReturns.Answered ];
				}
				else
				{
					// If no custom emoji was found, catch unicode emojis
					let emojisTxt = msg.content.match(emojiRegex)?.pop();

					if (emojisTxt) return [ emojisTxt, InputReturns.Answered ];
				}

				// no emoji found
				channel.send( lang.wrongInputEmoji() );
			}
			break;

			// the query asked for a role
			case InputType.Role:
			{
				// search for role mentions
				let role: Discord.Role | undefined | null = msg.mentions.roles?.first();

				if (role)
				{
					return [ (queryID) ? role.id : role, InputReturns.Answered ];
				}

				// search for role id
				try
				{
					role = await guild.roles.fetch( msg.content.trim() );
				}
				catch {}

				if (role)
				{
					return [ (queryID) ? role.id : role, InputReturns.Answered ];
				}

				// no role found
				channel.send( lang.wrongInputRole( msg.content.trim() ) );
			}
			break;

			// the query asked for a channel
			case InputType.Channel:
			{
				// search for channel mentions
				let chnl: Discord.TextChannel | Discord.GuildChannel | undefined = msg.mentions.channels?.first();

				if (chnl)
				{
					return [ (queryID) ? chnl.id : chnl, InputReturns.Answered ];
				}

				// search for channel ids
				chnl = guild.channels.cache.get( msg.content.trim() );

				if (chnl)
				{
					return [ (queryID) ? chnl.id : chnl, InputReturns.Answered ];
				}

				// no channel found
				channel.send( lang.wrongInputChannel( msg.content.trim() ) );
			}
			break;
		
			// the query asked for a response message
			case InputType.Message:
			{
				return [ (queryID) ? msg.id : msg, InputReturns.Answered ];
			}
			break;

			// the query asked for text
			case InputType.Text:
			{
				return [ msg.content, InputReturns.Answered ];
			}
			break;

			// the query asked for a number
			case InputType.Number:
			{
				return [ parseInt( msg.content, 10), InputReturns.Answered ];
			}
			break;

			// the query asked for a list of text items
			case InputType.TextList:
			{
				return [ msg.content.split('\n'), InputReturns.Answered ];
			}
			break;

			// the query asked for a list of channel mentions or ids
			case InputType.ChannelList:
			{	
				let cContent = msg.content.replace( /<#|>|[^\S\r\n]/gm, '');
				let channels: Array<string> = cContent.split('\n');

				return [ channels, InputReturns.Answered ];
			}
			break;

			// the query asked for a list of role mentions or ids
			case InputType.RoleList:
			{
				let rContent = msg.content.replace( /<@&|>|[^\S\r\n]/gm, '');
				let roles: Array<string> = rContent.split('\n');

				return [ roles, InputReturns.Answered ];
			}
			break;

		}

	}
	
}

/**
 * check if a user is currently being queried
 * @param user the user to check
 */
export function isUserInQuery(user: Discord.User): boolean
{
	return _usersInQuery.has(user.id);
}
