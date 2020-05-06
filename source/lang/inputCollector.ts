import {command_prefix} from "../config/server.json";

export function wrongInputRole(input: string): string {
	return `Ich konnte keine Rolle mit der ID ${input} finden.
Bitte schreibe eine ID, oder @ die Rolle im Chat.

Du kannst den Vorgang auch mit "${command_prefix}cancel" abbrechen`;
}

export function wrongInputEmoji(): string {
	return `Ich konnte dieses Emoji nicht auf dem Server finden.
Bitte schreibe sende das Emoji direkt im Chat.

Du kannst den Vorgang auch mit "${command_prefix}cancel" abbrechen`;
}

export function wrongInputUser(input: string): string {
	return `Ich konnte keinen Nutzer mit der ID ${input} finden.
Bitte schreibe eine ID, oder @ den Nutzer im Chat.

Du kannst den Vorgang auch mit "${command_prefix}cancel" abbrechen`;
}

export function wrongInputChannel(input: string): string {
	return `Ich konnte keinen Channel mit der ID ${input} finden.
Bitte schreibe eine ID, oder verlinke den Channel mit # im Chat.

Du kannst den Vorgang auch mit "${command_prefix}cancel" abbrechen`;
}

export function timeOut(): string {
	return `Zeit für Eingabe abgelaufen. Bitte führe den Befehl erneut aus`;
}

export function canceled(): string {
	return `Eingabe abgebrochen`;
}
