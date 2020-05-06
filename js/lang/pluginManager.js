import { command_prefix } from "../config/server.json";
export function roleNotSet() {
    return `Die Rollen für die Berechtigungen wurden noch nicht gesetzt, oder sind veraltet.
Bitte konfiguriere die Rollen mit "${command_prefix}config permissions"`;
}
export function userRoleDesc() {
    return `Rolle für normale Nutzer`;
}
export function userChannelDesc() {
    return `Channel in welchem Nutzer Befehle senden können`;
}
export function modRoleDesc() {
    return `Rolle für Moderatoren`;
}
//# sourceMappingURL=pluginManager.js.map