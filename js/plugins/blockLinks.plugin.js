import * as lang from "../lang/plugins/blockLinks.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
import { embedFromMessage } from "../modules/embedMaker.js";
export default class BlockLinks extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "block_links";
        this.description = lang.description;
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "log_channel", description: lang.logDescription, type: Plugin.InputType.Channel },
            { name: "linger", description: lang.lingerDescription, type: Plugin.InputType.Number }
        ];
        this.linger = 1000;
        this.messageStream = new LinkFilter(this);
    }
    async init() {
        this.logChannel = await this.getSetting("log_channel", Plugin.InputType.Channel);
        this.linger = await this.getSetting("linger", Plugin.InputType.Number) * 1000;
    }
}
const linkRegex = /https?:\/\/[^\s]+/gm;
class LinkFilter {
    constructor(plugin) {
        this.name = "link_filter";
        this.plugin = plugin;
    }
    async run(message) {
        var _a, _b;
        let member = message.member;
        if (!member || this.plugin.pluginManager.getHighestMemberPermission(member) !== Plugin.Permission.Any) {
            return true;
        }
        if (message.content.match(linkRegex)) {
            let embed = embedFromMessage(message);
            message.delete();
            (_a = this.plugin.logChannel) === null || _a === void 0 ? void 0 : _a.send(lang.logMessage(message.channel.id));
            (_b = this.plugin.logChannel) === null || _b === void 0 ? void 0 : _b.send(embed);
            let feedbackMsg = await message.channel.send(lang.feedbackMessage);
            feedbackMsg.delete({ timeout: this.plugin.linger });
            return false;
        }
        else {
            return true;
        }
    }
}
//# sourceMappingURL=blockLinks.plugin.js.map