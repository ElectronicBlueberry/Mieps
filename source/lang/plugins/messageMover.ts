import * as Discord from "discord.js"

import config from "../../config/server.json" assert { type: 'json' };


const command_prefix = config.command_prefix;


export const pluginDescription = `Erlaubt das Verschieben und Löschen von Nachrichten`;

export const auditLogChannel = `Der Kanal wo der Audit-Log gespeichert werden soll`;
export const startCutEmoji = `Das Emoji um den Anfang einer Nachrichten Selektion zu markieren`;
export const endCutEmoji = `Das Emoji um das Ende einer Nachrichten Selektion zu markieren`;
export const deleteEmoji = `Das Emoji um eine Nachricht zu löschen`;
export const copyEmoji = `Das Emoji um eine Nachricht zu kopieren`;

export const deleteSingleHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie zu löschen`;
export const copySingleHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie zu dokumentieren`;

export const startCutHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie als den Start einer Selektion auszuwählen.
Dann kannst du folgende Befehle nutzen um etwas mit dieser Selektion zu machen:
"${command_prefix}move" schneidet die Selektion aus um sie zu verschieben
"${command_prefix}copy" kopiert die Selektion in einen anderen Kanal
"${command_prefix}delete" löscht die Selektion`;

export const endCutHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie als das Ende einer Selektion auszuwählen.
Dann kannst du folgende Befehle nutzen um etwas mit dieser Selektion zu machen:
"${command_prefix}move" schneidet die Selektion aus um sie zu verschieben
"${command_prefix}copy" kopiert die Selektion in einen anderen Kanal
"${command_prefix}delete" löscht die Selektion`;

export const moveHelp = `Nutze diesen Befehl in einem Kanal, um die selektierten Nachrichten dort hin zu schieben`;
export const copyHelp = `Nutze diesen Befehl in einem Kanal, um die selektierten Nachrichten dort hin zu kopieren`;
export const deleteHelp = `Nutze diesen Befehl, um die selektierten Nachrichten zu löschen`;

export function moved(count: number, channel: Discord.TextChannel): string
{
	if (count === 1) {
		return `Eine Nachricht wurde nach ${channel} verschoben`;
	}

	return `${count} Nachrichten wurden nach ${channel} verschoben`;
}

export function noneSelected(): string
{
	return `Keine selektierten Nachrichten gefunden!`;
}

export function failMessage(): string
{
	return `Ich konnte leider keine Nachrichten verschieben`;
}

export function moveMessage(count: number, target: string): string
{
	return `${count} Nachrichten wurden nach ${target} verschoben`;
}

export function moveSingle(target: string): string
{
	return `Eine Nachricht wurde nach ${target} verschoben`;
}

export function logMessage(user: Discord.GuildMember): string
{
	return `Gelöscht von: ${ user.toString() }`;
}

export function deleteFailed(): string
{
	return `Löschung Fehlgeschlagen!`;
}

export function copyLog(user: Discord.GuildMember): string
{
	return `Kopiert von ${ user.toString() }`;
}

export function copyFailed(): string {
	return `Kopieren Fehlgeschlagen!`;
}