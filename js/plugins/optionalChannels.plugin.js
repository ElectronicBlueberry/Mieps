import * as lang from "../lang/plugins/optionalChannels.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
import { uncaughtError } from "../modules/errorHandling.js";
// ========== Plugin ==========
export default class OptionalChannels extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "optional_channels";
        this.description = lang.optInDescription;
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "optin_channel_names", description: lang.optInChannelList, type: Plugin.InputType.TextList },
            { name: "optin_roles", description: lang.optInRole, type: Plugin.InputType.RoleList },
            { name: "optout_channel_names", description: lang.optOutChannelList, type: Plugin.InputType.TextList },
            { name: "optout_roles", description: lang.optOutRole, type: Plugin.InputType.RoleList }
        ];
        this.commands = [];
    }
    // Get settings and constructs usable Arrays
    async init() {
        var _a, _b;
        let optInChannelNames = await this.getSetting("optin_channel_names", Plugin.InputType.TextList) || [];
        let optInRoles = await this.getSetting("optin_roles", Plugin.InputType.RoleList) || [];
        let optOutChannelNames = await this.getSetting("optout_channel_names", Plugin.InputType.TextList) || [];
        let optOutRoles = await this.getSetting("optout_roles", Plugin.InputType.RoleList) || [];
        let optInCount = Math.min(optInChannelNames.length, optInRoles.length);
        let optOutCount = Math.min(optOutChannelNames.length, optOutRoles.length);
        if (optInCount > 0 || optOutCount > 0) {
            this.channels = [];
        }
        for (let i = 0; i < optInCount; i++) {
            (_a = this.channels) === null || _a === void 0 ? void 0 : _a.push({
                name: optInChannelNames[i].trim(),
                role: optInRoles[i],
                optin: true
            });
        }
        for (let i = 0; i < optOutCount; i++) {
            (_b = this.channels) === null || _b === void 0 ? void 0 : _b.push({
                name: optOutChannelNames[i].trim(),
                role: optOutRoles[i],
                optin: false
            });
        }
        this.commands.push(new JoinLeave(true, this));
        this.commands.push(new JoinLeave(false, this));
    }
}
// ========== Chat Commands ==========
class JoinLeave extends Plugin.ChatCommand {
    constructor(join, plugin) {
        var _a;
        super((join) ? "join" : "leave");
        this.permission = Plugin.Permission.User;
        this.join = join;
        this.plugin = plugin;
        this.channelNameList = [];
        (_a = this.plugin.channels) === null || _a === void 0 ? void 0 : _a.forEach(channel => {
            this.channelNameList.push(channel.name);
        });
    }
    getHelpText() {
        return lang.help(this.channelNameList, this.join);
    }
    async run(message, args) {
        var _a, _b;
        let channel = message.channel;
        if (args.length === 0) {
            channel.send(this.getHelpText());
            return;
        }
        // join / leave all channels
        if (args[0] === "all") {
            (_a = this.plugin.channels) === null || _a === void 0 ? void 0 : _a.forEach(channel => {
                (this.join) ? joinChannel(message.member, channel) : leaveChannel(message.member, channel);
            });
            channel.send((this.join) ? lang.joinedAll : lang.leftAll);
            return;
        }
        let channelName = args[0];
        let channelObj = (_b = this.plugin.channels) === null || _b === void 0 ? void 0 : _b.find(channel => channel.name.toLowerCase() === channelName);
        // feedback for no channel with that name found
        if (!channelObj) {
            channel.send(lang.channelNotFound(this.channelNameList, this.join));
            return;
        }
        let r;
        // join / leave channel
        if (this.join) {
            r = joinChannel(message.member, channelObj);
        }
        else {
            r = leaveChannel(message.member, channelObj);
        }
        if (r !== Returns.Failed) {
            channel.send((this.join) ? lang.joined : lang.left);
        }
        else {
            uncaughtError(this.plugin.pluginManager.controlChannel, (this.join) ? "join" : "leave", undefined, message.content);
        }
    }
}
// ========== Functions ==========
var Returns;
(function (Returns) {
    Returns[Returns["Joined"] = 0] = "Joined";
    Returns[Returns["Left"] = 1] = "Left";
    Returns[Returns["Failed"] = 2] = "Failed";
})(Returns || (Returns = {}));
function joinChannel(member, channel) {
    try {
        if (channel.optin) {
            member === null || member === void 0 ? void 0 : member.roles.add(channel.role, "optional join");
        }
        else {
            member === null || member === void 0 ? void 0 : member.roles.remove(channel.role, "optional join");
        }
    }
    catch (e) {
        return Returns.Failed;
    }
    return Returns.Joined;
}
function leaveChannel(member, channel) {
    try {
        if (channel.optin) {
            member === null || member === void 0 ? void 0 : member.roles.remove(channel.role, "optional leave");
        }
        else {
            member === null || member === void 0 ? void 0 : member.roles.add(channel.role, "optional leave");
        }
    }
    catch (e) {
        return Returns.Failed;
    }
    return Returns.Left;
}
//# sourceMappingURL=optionalChannels.plugin.js.map