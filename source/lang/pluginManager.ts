import { command_prefix } from "../config/server.json"


export function roleNotSet(): string
{
	return `Die Rollen für die Berechtigungen wurden noch nicht gesetzt, oder sind veraltet.
Bitte konfiguriere die Rollen mit "${command_prefix}config permissions"`;
}

export function userRoleDesc(): string
{
	return `Rolle für normale Nutzer`;
}

export function userChannelDesc(): string
{
	return `Channel, in welchem Nutzer Befehle senden können`;
}

export function modRoleDesc(): string
{
	return `Rolle für Super Moderatoren (können alle Mod-Befehle nutzen)`;
}

export function chatModRoleDesc(): string
{
	return `Rolle für Chat Moderatoren (können chat-spezifische Befehle nutzen)`;
}
