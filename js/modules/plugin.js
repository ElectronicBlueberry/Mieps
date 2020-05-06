export var CommandType;
(function (CommandType) {
    CommandType[CommandType["Chat"] = 0] = "Chat";
    CommandType[CommandType["Emoji"] = 1] = "Emoji";
})(CommandType || (CommandType = {}));
export class ChatCommand {
    constructor(name, plugin) {
        this.plugin = plugin;
        this.type = CommandType.Chat;
        this.allowNoArgs = false;
        this.permission = Permission.Any;
        this.name = name;
    }
    getHelpText() { return ""; }
    ;
    async run(message, args) { }
    ;
}
export class EmojiCommand {
    constructor(name, emoji, plugin) {
        this.plugin = plugin;
        this.type = CommandType.Emoji;
        this.permission = Permission.Any;
        // Whether to remove uses of this Emoji for Users without the right permissions
        this.removeInvalid = true;
        this.name = name;
        this.emoji = emoji;
    }
    getHelpText() { return ""; }
    ;
    async run(reaction) { }
    ;
}
export var Permission;
(function (Permission) {
    Permission[Permission["Any"] = 0] = "Any";
    Permission[Permission["User"] = 2] = "User";
    Permission[Permission["Mod"] = 5] = "Mod";
    Permission[Permission["Admin"] = 10] = "Admin";
})(Permission || (Permission = {}));
//# sourceMappingURL=plugin.js.map