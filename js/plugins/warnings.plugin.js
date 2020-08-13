import * as lang from "../lang/plugins/warnings.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
export default class Warnings extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "warnings";
        this.description = lang.warningsDescription;
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "archive_channel", description: lang.archiveChannelDescription, type: Plugin.InputType.Channel },
            { name: "approve_count", description: lang.warningsDescription, type: Plugin.InputType.Text }
        ];
    }
}
//# sourceMappingURL=warnings.plugin.js.map