import * as lang from "../lang/inputCollector.js"
import * as Discord from 'discord.js';

import {command_prefix} from "../config/server.json";
import EmojiRegex from "emoji-regex";

const emojiRegex = EmojiRegex();

export enum InputType {
	User,
	Emoji,
	Role,
	Channel,
	Message,
	Text,
	Number
}

export enum InputReturns {
	Canceled,
	TimedOut,
	Answered
}

export interface Respone {
	answer: string,
	returnType: InputReturns,
	queryMessage: Discord.Message,
	responseMessage: Discord.Message
}

var _usersInQuery: Map<string, Discord.User> = new Map();

/**
 * Queries the user for an Input
 * @param channel Channel the query is taking place in
 * @param user The User to Query
 * @param query The Query to ask
 * @param type The expected type of the queries answer
 * @param timeout Time in Milliseconds to wait for a response. 5 min by default
 */
export async function queryInput(channel: Discord.TextChannel, user: Discord.User, query: string, type: InputType, timeout?: number): Promise<[string | number, InputReturns]> {
	_usersInQuery.set(user.id, user);
	let answer = await _queryInput(channel, user, query, type, timeout);
	_usersInQuery.delete(user.id);
	return answer;
}

async function _queryInput(channel: Discord.TextChannel, user: Discord.User, query: string, type: InputType, timeout?: number): Promise<[string | number, InputReturns]> {
	channel.send(query);

	while (true) {
		let msgArr = await channel.awaitMessages((m: Discord.Message) => m.author == user, {max: 1, time: timeout || 300000});

		if (msgArr.size === 0) {
			channel.send(lang.timeOut());
			return ["", InputReturns.TimedOut];
		}

		let msg = msgArr.first() as Discord.Message;

		if (msg.content.toLowerCase().trimEnd() === `${command_prefix}cancel`) {
			channel.send(lang.canceled());
			return ["", InputReturns.Canceled];
		}

		let guild = channel.guild;

		switch (type) {
			case InputType.User: {

				let usr = msg.mentions.users?.first();
				if (usr) {
					return [usr.id, InputReturns.Answered];
				}

				try {
					return [(await guild.members.fetch(msg.content.trim())).id, InputReturns.Answered];
				} catch {}
				
				channel.send(lang.wrongInputUser(msg.content.trim()));
			} break;

			case InputType.Emoji: {

				// Catch custom emojis
				let emojis = msg.content.match( /(?<=:)[0-9]+(?=>)/ );
				if (emojis) {
					// Find the custom emoji, and return its id
					let emojiId = guild.emojis.cache.get(emojis[0])?.id;
					if (emojiId) return [emojiId, InputReturns.Answered];
				} else {
					// If no custom emoji was counf, catch unicode emojis
					let emojisTxt = msg.content.match(emojiRegex);
					if (emojisTxt) return [emojisTxt[0], InputReturns.Answered];
				}

				channel.send(lang.wrongInputEmoji());
			} break;

			case InputType.Role: {

				let role: Discord.Role | undefined | null = msg.mentions.roles?.first();
				if (role) {
					return [role.id, InputReturns.Answered];
				}

				role = await guild.roles.fetch(msg.content.trim());
				if (role) {
					return [role.id, InputReturns.Answered];
				}

				channel.send(lang.wrongInputRole(msg.content.trim()));
			} break;

			case InputType.Channel: {

				let chnl: Discord.TextChannel | Discord.GuildChannel | undefined = msg.mentions.channels?.first();
				if (chnl) {
					return [chnl.id, InputReturns.Answered];
				}

				chnl = guild.channels.cache.get(msg.content.trim());
				if (chnl) {
					return [chnl.id, InputReturns.Answered];
				}

				channel.send(lang.wrongInputChannel(msg.content.trim()));
			} break;
		
			case InputType.Message: {
				return [msg.id, InputReturns.Answered];
			} break;

			case InputType.Text: {
				return [msg.content, InputReturns.Answered];
			} break;

			case InputType.Number: {
				return [parseInt(msg.content, 10), InputReturns.Answered];
			} break;
		}
	}
	
}

/**
 * Check if a User is currently in a Query
 * @param user the User to check
 */
export function isUserInQuery(user: Discord.User): boolean {
	return _usersInQuery.has(user.id);
}
