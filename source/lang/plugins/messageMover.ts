import * as Discord from "discord.js";

export const pluginDescription = `Erlaubt das verschieben und löschen von Nachrichten`;

export const auditLogChannel = `Der Kanal wo der Audit-Log gespeichert werden soll`;
export const startCutEmoji = `Das Emoji um den Anfang einer Nachrichten Selektion zu makieren`;
export const endCutEmoji = `Das Emoji um das Ende einer Nachrichten Selektion zu makieren`;
export const deleteEmoji = `Das Emoji um eine Nachricht zu löschen`;
export const copyEmoji = `Das Emoji um eine Nachricht zu kopieren`;

export const deleteSingleHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie zu löschen`;
export const copySingleHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie zu dokumentieren`;

export function failMessage(): string {
	return `Ich konnte leider keine Nachrichten verschieben`;
}

export function moveMessage(count: number, target: string): string {
	return `${count} Nachrichten wurden nach ${target} verschoben`;
}

export function moveSingle(target: string): string {
	return `Eine Nachricht wurde nach Target verschoben`;
}

export function logMessage(user: Discord.GuildMember): string {
	return `Gelöscht von: ${user.toString()}`;
}

export function deleteFailed(): string {
	return `Löschung Fehlgeschlagen!`;
}

export function copyLog(user: Discord.GuildMember): string {
	return `Kopiert von ${user.toString()}`;
}

export function copyFailed(): string {
	return `Kopieren Fehlgeschlagen!`;
}