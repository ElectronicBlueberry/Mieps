import * as lang from "../lang/plugins/warnings.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";

import * as Discord from "discord.js";

export default class Warnings extends Plugin.Plugin {
	name = "warnings";
	description = lang.warningsDescription;

	state = new State(this.name);

	setupTemplate: Plugin.SetupTemplate = [
		{name: "archive_channel", description: lang.archiveChannelDescription, type: Plugin.InputType.Channel},
		{name: "approve_count", description: lang.warningsDescription, type: Plugin.InputType.Text}
	]
}

