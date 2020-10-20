import * as Discord from "discord.js";

export const pluginDescription = `Nutzer können mit diesem Eomji Nachrichten in einen Pin Kanal kopieren.`;

export const pinHelp = `Reagiere mit diesem Emoji auf eine Nachricht, um sie im Pin Kanal anzuheften. Die Nachricht wird erst angeheftet, wenn genug Leute und die Person welche die Nachricht verfasst hat, das emoji verwendet haben.`;

export function pinHeadingMessage(author: Discord.User, channel: Discord.Channel): string {
	return `Von: ${author}
In: ${channel}`;
}

export const pinChannel = `Der Kanal in welchen die gepinnten Nachrichten kopiert werden sollen`;
export const pinCount = `Wie viele Mitglieder insgesamt pinnen müssen, bevor eine Nachricht gepinnt wird`;
export const pinEmoji = `Das Emoji, mit welchem Mitglieder Nachrichten anpinnen können`;
