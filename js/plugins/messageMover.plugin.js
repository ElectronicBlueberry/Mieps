import * as lang from "../lang/plugins/messageMover.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
import { embedFromMessage } from "../modules/embedMaker.js";
export default class MessageMover extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "message_mover";
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "audit_log_channel", description: lang.auditLogChannel, type: Plugin.InputType.Channel },
            { name: "start_cut_emoji", description: lang.startCutEmoji, type: Plugin.InputType.Emoji },
            { name: "end_cut_emoji", description: lang.endCutEmoji, type: Plugin.InputType.Emoji },
            { name: "delete_emoji", description: lang.deleteEmoji, type: Plugin.InputType.Emoji },
            { name: "copy_emoji", description: lang.copyEmoji, type: Plugin.InputType.Emoji }
        ];
        this.deleteSingle = new DeleteSingle(this);
        this.commands = [
            this.deleteSingle
        ];
    }
    async init() {
        this.deleteSingle.emoji = await this.getSetting("delete_emoji", Plugin.InputType.Emoji);
    }
}
class DeleteSingle extends Plugin.EmojiCommand {
    constructor(plugin) {
        super("deleteSingle");
        this.plugin = plugin;
    }
    async run(reaction) {
        let logChannel = await this.plugin.getSetting("audit_log_channel", Plugin.InputType.Channel);
        try {
            let message = reaction.message;
            let embed = embedFromMessage(message);
            await (logChannel === null || logChannel === void 0 ? void 0 : logChannel.send(lang.logMessage(reaction.users.cache.first()), embed));
            message.delete();
        }
        catch {
            logChannel === null || logChannel === void 0 ? void 0 : logChannel.send(lang.deleteFailed());
        }
    }
}
//# sourceMappingURL=messageMover.plugin.js.map