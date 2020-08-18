import * as lang from "../lang/plugins/joinGreeting.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
export default class Greetings extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "greetings";
        this.description = lang.description;
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "join_channel", description: lang.joinChannelInfo, type: Plugin.InputType.Channel },
            { name: "intro_channel", description: lang.introChannelInfo, type: Plugin.InputType.Channel },
            { name: "rule_channel", description: lang.ruleChannelInfo, type: Plugin.InputType.Channel },
            { name: "timeout", description: lang.timeoutInfo, type: Plugin.InputType.Number }
        ];
        this.joinStream = new JoinGreeting(this);
    }
}
class JoinGreeting {
    constructor(plugin) {
        this.name = "join_greeting";
        this.plugin = plugin;
    }
    async run(member) {
        let joinChannel = await this.plugin.getSetting("join_channel", Plugin.InputType.Channel);
        let introChannel = await this.plugin.getSetting("intro_channel", Plugin.InputType.Channel);
        let ruleChannel = await this.plugin.getSetting("rule_channel", Plugin.InputType.Channel);
        let timeout = await this.plugin.getSetting("timeout", Plugin.InputType.Number) * 1000;
        setTimeout(() => {
            joinChannel.send(lang.greeting(member.id, ruleChannel.id, introChannel.id));
        }, timeout);
    }
}
//# sourceMappingURL=joinGreeting.plugin.js.map