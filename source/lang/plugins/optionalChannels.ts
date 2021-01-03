export const optInDescription = `Erlaubt es optionale Channel einzurichten, welche User selbst joinen können`;

export const optInChannelList = `Eine Liste aller *Wörter*, die hinter dem join-Befehl für die **opt-in** Kanäle angehangen werden können. Ein Eintrag pro Zeile. Nicht die Kanäle selbst verlinken! "-" um leer zu lassen`;
export const optInRole = `Eine Liste der *Rollen* für die **opt-in** Kanäle. Nutze die gleiche Reihenfolge, wie im vorherigen Befehl, damit über die join-Commands die richtigen Rollen vergeben werden können. Verlinke die Rollen direkt mit einem "@". Schreibe "-" um die Eingabe leer zu lassen`;

export const optOutChannelList = `Eine Liste aller *Wörter*, die hinter dem join- Befehl für die **opt-out** Kanäle angehangen werden können. Ein Eintrag pro Zeile. Nicht die Kanäle selbst velinken! "-" um leer zu lassen`;
export const optOutRole = `Eine Liste der *Rollen* für die **opt-out** Kanäle. Nutze die gleiche Reihenfolge, wie im vorherigen Befehl, damit über die join-Commands die richtigen Rollen vergeben werden können. Verlinke die Rollen direkt mit einem "@". Schreibe "-" um die Eingabe leer zu lassen`;

export const joined = `Channel beigetreten`;
export const left = `Channel verlassen`;

export const joinedAll = `Alle optionalen Channel betreten!`;
export const leftAll = `Alle optionalen Channel verlassen!`;

export function help(channelList: Array<string>, join: boolean): string
{
	let channelString = "";

	channelList.forEach( c => {

		channelString += `\n${c}`;

	});

	return `Nenne einen der folgenen Channel direkt hinter dem Befehl, um ihn zu ${(join) ? 'betreten': 'verlassen'}:
${channelString}`;
}

export function channelNotFound(channelList: Array<string>, join: boolean): string
{
	return `Channel nicht gefunden.
${ help(channelList, join) }`;
}
