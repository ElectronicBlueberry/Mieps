import { ReadOnlyState } from "../modules/state.js"
import { iPlugin } from "../modules/plugin.js"
import { ChatCommand, EmojiCommand } from "../modules/plugin.js"
import config from "../config/server.json" assert { type: 'json' };

const command_prefix = config.command_prefix;

export function pluginActivated(pluginName: string): string
{
	return `Plugin ${pluginName} aktiviert!`;
}

export function pluginDeactivated(pluginName: string): string
{
	return `Plugin ${pluginName} deaktiviert!`;
}

export function pluginCommandList(
	pluginName: string,
	chatCommands?: ChatCommand[],
	emojiCommands?: EmojiCommand[]
): string
{
	let list = `Folgende Befehle sind Teil von dem Plugin "${pluginName}":\n`;

	chatCommands?.forEach( c => {

		list += `\n${command_prefix}${ c.name }`;

	});

	emojiCommands?.forEach( c => {
		
		list += `\n${ c.emoji }`;

	});

	list += `\n\nNutze "${command_prefix}help [befehl]" um mehr über den Befehl zu erfahren`;

	return list;
}

export function pluginNotConfigured(pluginName: string): string
{
	return `Kann das Plugin ${pluginName} nicht aktivieren, da es nicht kongifuriert ist.
Nutze "${command_prefix}config ${pluginName}" um das Plugin zu konfigurieren`;
}

export function pluginCommandHelp(): string
{
	return `"${command_prefix}plugin list" Eine Liste aller installierten Plugins
"${command_prefix}plugin activate [name]" Aktiviere ein Plugin
"${command_prefix}plugin deactivate [name]" Deaktiviere ein Plugin
"${command_prefix}plugin activate all" Aktiviere alle Plugins
"${command_prefix}plugin commands [name]" Zeige alle Befehle die zu diesem Plugin gehören 

Plugins müssen konfiguriert sein, bevor sie aktiviert werden können:
"${command_prefix}config [name]" Konfiguriere ein Plugin`;
}

export function pluginList(plugins: Map<string, iPlugin>, pluginState: ReadOnlyState): string
{
	let msg = "Folgende Plugins sind installiert: \n";

	plugins.forEach( p => {

		let cfg = pluginState.read( p.name, "active") ? "aktiviert" : "deaktiviert";

		if (cfg === "deaktiviert" && !pluginState.read( p.name, "configured"))
		{
			cfg = "unkonfiguriert";
		}

		msg += `\n${ p.name } | ${ p.description ?? ""} | ${cfg}\n--------`;

	});

	return msg;
}

export function activateAll(): string
{
	return `Aktiviere alle konfigurierten Plugins`;
}

export function pluginNotFound(name: string): string
{
	return `Kein Plugin namens ${name} gefunden`;
}

export function commandList(
	chatCommands: Map<string, ChatCommand>,
	emojiCommands: Map<string, EmojiCommand>
): string
{
	let list = `Folgende Befehle stehen dir zur Verfügung:\n`;

	chatCommands.forEach( c => {

		list += `\n${command_prefix}${ c.name }`;

	});

	emojiCommands.forEach( c => {

		list += `\n${ c.emoji }`;

	});

	list += `\n\nNutze "${command_prefix}help [befehl]" um mehr über den Befehl zu erfahren`;

	return list;
}

export function configHelp(): string
{
	return `Nutze diesen Befehl, um Plugins zu konfigurieren.
"${command_prefix}config [plugin]" konfiguriere ein Plugin,
"${command_prefix}config all" konfiguriere alle unkonfigurierten Plugins

oder "${command_prefix}plugin list" um eine Liste aller Plugins zu sehen`;
}

export function noConfig(plugin: string): string
{
	return `Dieses Plugin muss nicht konfiguriert werden.
Nutze "${command_prefix}plugin activate ${plugin}" um es zu aktivieren`;
}

export function configDone(plugin: string): string
{
	return `Konfiguration für ${plugin} abgeschlossen!
Nutze "${command_prefix}plugin activate ${plugin}" um das Plugin zu aktivieren`;
}

export function noUnconfigured(): string
{
	return `Es gibt keine unkonfigurierten Plugins.
Nutze "${command_prefix}config [plugin]" um ein bestimmtes Plugin neu zu konfigurieren`;
}

export function nowConfiguring(plugin: string): string
{
	return `Konfiguriere nun Plugin: ${plugin}`;
}

export function allComplete(): string
{
	return `Alle Plugins konfiguriert!
Nutze "${command_prefix}plugin activate all" um alle Plugins zu aktivieren`;
}
