export const description = `Löscht Links von nicht-Mitgliedern`;
export const logDescription = `Kanal, in welchem gelöschte Nachrichten landen sollen.`;
export const lingerDescription = `Wie lange die Nachricht, dass ein Link gelöscht wurde, bleiben soll bis sie sich selbst löscht. In Sekunden`;
export const feedbackMessage = `Dir fehlen die Berechtigungen um Links zu posten.`;
export function logMessage(channelId) {
    return `Folgende Nachricht wurde aus <#${channelId}> gelöscht, weil sie einen Link enthält.`;
}
//# sourceMappingURL=blockLinks.js.map