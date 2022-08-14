import * as Discord from "discord.js"
import { uncaughtError } from "../../modules/errorHandling";


export const pluginDescription = `Nutzer können mit diesem Eomji Nachrichten in einen Pin Kanal kopieren.`;

export const pinHelp = `Reagiere mit diesem Emoji auf eine Nachricht, um sie im Pin Kanal anzuheften. Die Nachricht wird erst angeheftet, wenn genug Leute und die Person welche die Nachricht verfasst hat, das Emoji verwendet haben.`;

export const pinChannel = `Der Kanal in welchen die gepinnten Nachrichten kopiert werden sollen`;
export const pinCount = `Wie viele Mitglieder insgesamt pinnen müssen, bevor eine Nachricht gepinnt wird`;
export const pinEmoji = `Das Emoji, mit welchem Mitglieder Nachrichten anpinnen können`;

export function pinHeadingMessage(author: Discord.User | null, channel: Discord.Channel): string
{
	if(author === null) {
		uncaughtError(
			channel as Discord.TextChannel,
			"pin",
			new Error("pin command, author not fetched or unavailable"),
			"pin"
		);
	}
	return `Von: ${author}
Aus: ${channel}`;
}

export function authorMissingFeedback(pinChannel: Discord.Channel, emoji?: Discord.Emoji): string
{
	return `die Community findet deinen Beitrag toll und möchte ihn in ${pinChannel} festhalten!
Wenn du damit einverstanden bist, reagiere mit "${emoji}" auf deinen Beitrag.
Falls du deinen Beitrag vorher anpassen willst, bearbeite deine Nachricht bevor du mit "${emoji}" reagierst.`;
}
