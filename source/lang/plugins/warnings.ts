import {command_prefix} from "../../config/server.json";
import * as Discord from "discord.js";

const openCommands = `"${command_prefix}mahnung vorschau" um eine Kopie der Mahnung zugesendet zu bekommen
"${command_prefix}mahnung genehmigen" um sie zu genehmigen
"${command_prefix}mahnung veto" um die Mahnung zu blockieren

"${command_prefix}mahnung abbrechen" um sie abzubrechen
"${command_prefix}mahnung senden" um sie zu senden`;

export const warningsDescription = `Erlaubt es Mahnungen zu verfassen und zu versenden`;
export const archiveChannelDescription = `Der Kanal in welchem die Mahnungen archiviert werden`;
export const approveCountDescription = `Wie viele Mods die Mahnung genehmigen müssen, bevor sie versendet werden kann`;

export const warningCommand = `mahnung`;
export const previewCommand = `vorschau`;
export const approveCommand = `genehmigen`;
export const vetoCommand = `veto`;
export const cancelCommand = `abbrechen`;
export const sendCommand = `senden`;
export const newCommand = `neu`;

export function warningHelp(activeWaning: boolean): string {
	if (activeWaning) {
		return `Es ist zurzeit eine Mahnung offen.
${openCommands}`;
	} else {
		return `Es ist zurzeit keine Mahnung offen.
"${command_prefix}mahnung neu" um eine neue Mahnung zu öffnen.`;
	}
}

export const creationTimeout = `Zeitüberschreitung. Mahnung wurde abgebrochen.`;
export const creationCancel = `Vorgang abgebrochen. Mahnung ist zurückgesetzt.`;

export const canceled = `Mahnung abgebrochen!`;

export function warningOpen(): string {
	return `Es ist bereits eine Mahnung offen!
${openCommands}`;
}

export const queryUser = `An wen soll die Mahnung gesendet werden?`;
export function queryUserReturn(member: Discord.User): string {
	return `Die folgende Mahnung wird an ${member.toString()} versendet`;
}

export const queryMessage = `Schreibe nun deine Mahnung. Du kannst diese Nachricht später bearbeiten.`;

export function creationComplete(count: number): string {
	return `Mahnung erstellt! Die Mahnung benötigt ${count} Genehmigungen, bevor sie abgesendet werden kann.

Folgende Befehle stehen zur Verfügung:
${openCommands}`
}

export function veto(member: Discord.User): string {
	return `${member.toString()} hat ein Veto eingelegt! Die Mahnung kann nicht versendet werden, bis ${member.toString()} sie genehmigt.`;
}

export function approved(member: Discord.User, count: number, veto: boolean): string {
	let msgStart = `${member.toString()} hat die Mahnung genehmigt.`;

	if (veto) {
		return `${msgStart} Aber sie kann nicht gesendet werden, weil ein Veto vorliegt!`;
	}

	if (count <= 0) {
		return `${msgStart} Die Mahnung hat genug Genehmigungen, um abgesendet zu werden.`
	} else if (count === 1) {
		return `${msgStart} Es wird noch eine Genehmigung benötigt, bevor die Mahnung gesendet werden kann.`
	} else {
		return `${msgStart} Es werden noch ${count} Genehmigungen benötigt, bevor die Mahnung gesendet werden kann.`
	}
}

export const warningPretext = `Du wurdest vom Modteam gemahnt!
Inhalt der Mahnung:
-------------------------------`;

export const warningPosttext = `-------------------------------
Bitte antworte nicht direkt auf diese Nachricht, da ich keine Antworten an das Modteam weiterleiten kann.`;

export function archiveWarning(authorId: string, targetId: string, approveIds: Array<string>): string {
	let now = new Date();
	
	let approvesString = "";
	approveIds.forEach(id => {
		approvesString += `<@${id}>\n`;
	});

	return `Mahnung an <@${targetId}>

Am: ${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}
Verfasst von: <@${authorId}>
Genehmigt von:
${approvesString}

------ Inhalt ------`;
}

export const errorWarningNotFound = `Kein Inhalt für diese Mahnung gefunden.
Stelle sicher dass die Mahnung im selben Channel wie diesen verfasst wurde, und es sie noch gibt.`;

export const errorCouldNotSend = `Mahnung konnte nicht gesendet werden!
Möglicherweise sind DMs von Servermitgliedern deaktiviert, oder ich wurde blockiert.`;

export function blockedByVeto(vetoIds: Array<string>): string {
	let vetosString = "";
	vetoIds.forEach(id => {
		vetosString += `<@${id}>\n`;
	});

	return `Folgende Mods haben gegen diese Mahnung ein Veto eingelegt, weshalb sie nicht gesendet werden kann:
${vetosString}
Um diese Mahnung senden zu können, müssen diese Mods die Mahnung erst genehmigen.`;
}

export function notEnoughVotes(count: number): string {
	return `Die Mahnung hat noch nicht genug Genehmigunen um gesendet werden zu können! Benötigte Genehmigungen: ${count}`;
}

export const targetNotFound = `Mitglied nicht gefunden! Ist die Person noch auf dem Server?`;
