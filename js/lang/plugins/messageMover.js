export const pluginDescription = `Erlaubt das verschieben und löschen von Nachrichten`;
export const auditLogChannel = `Der Kanal wo der Audit-Log gespeichert werden soll`;
export const startCutEmoji = `Das Emoji um den Anfang einer Nachrichten Selektion zu makieren`;
export const endCutEmoji = `Das Emoji um das Ende einer Nachrichten Selektion zu makieren`;
export const deleteEmoji = `Das Emoji um eine Nachricht zu löschen`;
export const copyEmoji = `Das Emoji um eine Nachricht zu kopieren`;
export const deleteSingleHelp = `Reagiere mit diesem Emoji auf eine Nachricht um sie zu löschen`;
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
    return `Gelöscht von: ${user === null || user === void 0 ? void 0 : user.toString()}`;
}
export function deleteFailed() {
    return `Löschung Fehlgeschlagen!`;
}
export function copyLog(user) {
    return `Kopiert von ${user === null || user === void 0 ? void 0 : user.toString()}`;
}
export function copyFailed() {
    return `Kopieren Fehlgeschlagen!`;
}
//# sourceMappingURL=messageMover.js.map