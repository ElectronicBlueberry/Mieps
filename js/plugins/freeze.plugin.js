import * as Plugin from "../modules/plugin.js";
import * as lang from "../lang/plugins/freeze.js";
import { uncaughtError } from '../modules/errorHandling.js';
export default class FreezePlugin extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "freeze";
        this.description = lang.description;
        this.commands = [
            new FreezeTaw(this, true),
            new FreezeTaw(this, false)
        ];
    }
    getMemberRole(guild) {
        return this.pluginManager.getPermissionRole(Plugin.Permission.User, guild);
    }
    getModRole(guild) {
        return this.pluginManager.getPermissionRole(Plugin.Permission.Mod, guild);
    }
}
class FreezeTaw extends Plugin.ChatCommand {
    constructor(plugin, freeze) {
        super(freeze ? "freeze" : "unfreeze");
        this.permission = Plugin.Permission.Mod;
        this.plugin = plugin;
        this.freeze = freeze;
    }
    getHelpText() {
        return lang.help;
    }
    async run(message) {
        let channel = message.channel;
        if (!message.guild) {
            return;
        }
        let memberRole = this.plugin.getMemberRole(message.guild);
        let modRole = this.plugin.getModRole(message.guild);
        if (!channel.manageable || !memberRole || !modRole) {
            if (this.freeze)
                channel.send(lang.error);
            return;
        }
        try {
            if (this.freeze) {
                // Block members from writing, and allow mods to write
                await channel.createOverwrite(memberRole, { 'SEND_MESSAGES': false }, "channel freeze");
                await channel.createOverwrite(modRole, { 'SEND_MESSAGES': true });
                channel.send(lang.freeze);
            }
            else {
                // Reset member perm to neutral on unfreeze
                await channel.createOverwrite(memberRole, { 'SEND_MESSAGES': null });
                channel.send(lang.unfreeze);
            }
        }
        catch (e) {
            uncaughtError(this.plugin.pluginManager.controlChannel, (this.freeze) ? "freeze" : "unfreeze", e, message.content);
        }
    }
}
//# sourceMappingURL=freeze.plugin.js.map