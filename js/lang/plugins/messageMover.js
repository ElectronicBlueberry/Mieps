import { command_prefix } from "../../config/server.json";
export const pluginDescription = `Erlaubt das verschieben und löschen von Nachrichten`;
export const auditLogChannel = `Der Kanal wo der Audit-Log gespeichert werden soll`;
export const startCutEmoji = `Das Emoji um den Anfang einer Nachrichten Selektion zu makieren`;
export const endCutEmoji = `Das Emoji um das Ende einer Nachrichten Selektion zu makieren`;
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
export const deleHelp = `Nutze diesen Befehl, um die selektierten Nachrichten zu löschen`;
export function moved(count, channel) {
    if (count === 1)
        return `Eine Nachricht wurde nach ${channel} verschoben`;
    return `${count} Nachrichten wurden nach ${channel} verschoben`;
}
export function noneSelected() {
    return `Keine selektierten Nachrichten gefunden!`;
}
export function failMessage() {
    return `Ich konnte leider keine Nachrichten verschieben`;
}
export function moveMessage(count, target) {
    return `${count} Nachrichten wurden nach ${target} verschoben`;
}
export function moveSingle(target) {
    return `Eine Nachricht wurde nach Target verschoben`;
}
export function logMessage(user) {
    return `Gelöscht von: ${user.toString()}`;
}
export function deleteFailed() {
    return `Löschung Fehlgeschlagen!`;
}
export function copyLog(user) {
    return `Kopiert von ${user.toString()}`;
}
export function copyFailed() {
    return `Kopieren Fehlgeschlagen!`;
}
//# sourceMappingURL=messageMover.js.map