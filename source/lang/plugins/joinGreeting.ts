export function greeting(userId: string, ruleChannelId: string, introChannelId: string) {
	return `Willkommen <@${userId}>! Lese dir doch bitte die <#${ruleChannelId}> durch und stelle dich anschließend auf unserem Server vor (<#${introChannelId}>). Nachdem du das getan hast, wird dich ein Mod schnellstmöglich für die anderen Channel freischalten.`;
}

export const description = `Begrüßt neue User`;
export const joinChannelInfo = `Der Channel, in welchem die Begrüßungs-Nachricht versendet werden soll`;
export const ruleChannelInfo = `Der Regelchannel, welcher neuen Mitgliedern verlinkt werden soll`;
export const introChannelInfo = `Der Vorstellungschannel, welcher neuen Mitgliedern verlinkt werden soll`;
export const timeoutInfo = `Wie viele Sekunden Mieps warten soll, bevor sie neue Mitglieder begrüßt`;
