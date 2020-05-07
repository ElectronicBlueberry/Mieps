import { InputType } from "./inputCollector.js";
import { criticalPluginError } from "./errorHandling.js";
export { InputType } from "./inputCollector.js";
export var CommandType;
(function (CommandType) {
    CommandType[CommandType["Chat"] = 0] = "Chat";
    CommandType[CommandType["Emoji"] = 1] = "Emoji";
})(CommandType || (CommandType = {}));
export class ChatCommand {
    constructor(name) {
        this.type = CommandType.Chat;
        this.allowNoArgs = false;
        this.permission = Permission.Admin;
        this.name = name;
    }
    getHelpText() { return ""; }
    ;
    async run(message, args) { }
    ;
}
export class EmojiCommand {
    constructor(name) {
        this.type = CommandType.Emoji;
        this.permission = Permission.Admin;
        // Whether to remove uses of this Emoji for Users without the right permissions
        this.removeInvalid = true;
        this.name = name;
    }
    getHelpText() { return ""; }
    ;
    async run(reaction, member) { }
    ;
}
export class Plugin {
    constructor(pluginManager, client) {
        this.pluginManager = pluginManager;
        this.client = client;
        this.name = "base_plugin";
    }
    ;
    async getSetting(setting, type) {
        var _a, _b;
        if (!this.state) {
            criticalPluginError(this.pluginManager.controlChannel, `Tried to acess setting ${setting} while no state was set`, this);
            return undefined;
        }
        let s = this.state.read("config", setting);
        if (!s) {
            criticalPluginError(this.pluginManager.controlChannel, `Could not acess Setting ${setting}`, this);
            return undefined;
        }
        let guild = this.pluginManager.guild;
        let response;
        switch (type) {
            case InputType.Channel:
                {
                    response = guild.channels.cache.get(s);
                }
                break;
            case InputType.Emoji:
                {
                    response = guild.emojis.cache.get(s);
                }
                break;
            case InputType.Role:
                {
                    response = await guild.roles.fetch(s);
                }
                break;
            case InputType.User:
                {
                    response = await guild.members.fetch(s);
                }
                break;
            case InputType.Message: {
                try {
                    response = await ((_b = (_a = (await guild.channels.cache.get(s[0]))) === null || _a === void 0 ? void 0 : _a.messages) === null || _b === void 0 ? void 0 : _b.fetch(s[1]));
                }
                catch { }
            }
            case InputType.Text:
                {
                    response = s;
                }
                break;
        }
        if (!response) {
            criticalPluginError(this.pluginManager.controlChannel, `Could not find any ${type} with the id ${s} on the server. Maybee it no longer exists? Reconfigure the plugin to fix this Error`, this);
            return undefined;
        }
        return response;
    }
}
export var Permission;
(function (Permission) {
    Permission[Permission["Any"] = 0] = "Any";
    Permission[Permission["User"] = 2] = "User";
    Permission[Permission["Mod"] = 5] = "Mod";
    Permission[Permission["Admin"] = 10] = "Admin";
})(Permission || (Permission = {}));
//# sourceMappingURL=plugin.js.map