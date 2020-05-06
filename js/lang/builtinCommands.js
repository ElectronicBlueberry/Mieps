import { command_prefix } from "../config/server.json";
export function pluginNotConfigured(pluginName) {
    return `Kann das Plugin ${pluginName} nicht aktivieren, da es nicht kongifuriert ist.
	Nutze "${command_prefix}config ${pluginName} um das Plugin zu konfigurieren`;
}
export function pluginCommandHelp() {
    return `"${command_prefix}plugin list" Eine Liste aller installierten Plugins
"${command_prefix}plugin activate [name]" Aktiviere ein Plugin
"${command_prefix}plugin deactivate [name]" Deaktiviere ein Plugin
"${command_prefix}plugin activate all" Aktiviere alle Plugins
Plugins müssen konfiguriert sein, befor sie aktiviert werden können:
"${command_prefix}config [name]" Konfiguriere ein Plugin`;
}
export function pluginList(plugins, pluginState) {
    let msg = "Folgende Plugins sind installiert: \n";
    plugins.forEach(p => {
        let cfg = pluginState.read(p.name, "active") ? "aktiviert" : "deaktiviert";
        if (cfg === "deaktiviert" && !pluginState.read(p.name, "configured"))
            cfg = "unkonfiguriert";
        msg += `\n${p.name} | ${p.description || ""} | ${cfg}\n--------`;
    });
    return msg;
}
export function activateAll() {
    return `Aktiviere alle konfigurierten Plugins`;
}
export function pluginNotFound(name) {
    return `Kein Plugin namens ${name} gefunden`;
}
export function commandList(chatCommands, emojiCommands) {
    let list = `Folgende Befehle stehen dir zu verfügung:\n`;
    chatCommands.forEach(c => {
        list += `\n${command_prefix}${c.name}`;
    });
    emojiCommands.forEach(c => {
        list += `\n${c.emoji}`;
    });
    list += `\n\nNutze "${command_prefix}help [befehl]" um mehr über den Befehl zu erfahren`;
    return list;
}
export function configHelp() {
    return `Nutze diesen Befehl, um Plugins zu konfigurieren.
"${command_prefix}config [plugin]" konfiguriere ein Plugin,
"${command_prefix}config all" konfiguriere alle unkonfigurierten Plugins

oder "${command_prefix}plugin list" um eine Liste aller Plugins zu sehen`;
}
export function noConfig(plugin) {
    return `Dieses Plugin muss nicht konfiguriert werden.
Nutze "${command_prefix}plugin activate ${plugin}" um es zu aktivieren`;
}
export function configDone(plugin) {
    return `Konfiguration für ${plugin} abgeschlossen!
Nutze "${command_prefix}plugin activate ${plugin}" um das Plugin zu aktivieren`;
}
export function noUnconfigured() {
    return `Es gibt keine unkonfigurierten Plugins.
Nutze "${command_prefix}config [plugin]" um ein bestimmtes Plugin neu zu konfigurieren`;
}
export function nowConfiguring(plugin) {
    return `Konfiguriere nun Plugin: ${plugin}`;
}
export function allComplete() {
    return `Alle Plugins konfiguriert!
Nutze "${command_prefix}plugin activate all" um alle Plugins zu aktivieren`;
}
//# sourceMappingURL=builtinCommands.js.map