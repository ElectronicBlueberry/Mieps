export const optInDescription = `Erlbaut es Optionale Channel einzurichten, welche User selbst joinen können`;

export const optInChannelList = `Eine Liste vom Namen aller opt-In Kanälen, ein Eintrag pro Zeile. Nicht die Kanäle selbst velinken! "-" um leer zu lassen`;
export const optInRole = `Eine Liste der Rollen für die opt-In Kanäle, in gleicher Reihenfolge wie die Namen. Verlinke die Rollen direkt, mit einem "@". Schreibe "-" um die Eingabe leer zu lassen`;

export const optOutChannelList = `Eine Liste vom Namen aller opt-Out Kanälen, ein Eintrag pro Zeile. Nicht die Kanäle selbst velinken! "-" um leer zu lassen`;
export const optOutRole = `Eine Liste der Rollen für die opt-Out Kanäle, in gleicher Reihenfolge wie die Namen. Verlinke die Rollen direkt, mit einem "@". Schreibe "-" um die Eingabe leer zu lassen`;

export function help(channelList: Array<string>, join: boolean): string {
	let channelString = "";
	channelList.forEach(c => {
		channelString += `\n${c}`;
	});
	return `Nenne einen der folgenen Channel direkt hinter dem Befehl, um ihn zu ${(join) ? 'betreten': 'verlassen'}:
${channelString}`;
}

export function channelNotFound(channelList: Array<string>, join: boolean): string {
	return `Channel nicht gefunden.
${help(channelList, join)}`;
}

export const joined = `Channel beigetreten`;
export const left = `Channel verlassen`;

export const joinedAll = `Alle optionalen Channel betreten!`;
export const leftAll = `Alle optionalen Channel verlassen!`;
