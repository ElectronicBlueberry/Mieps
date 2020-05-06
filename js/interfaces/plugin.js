export var CommandType;
(function (CommandType) {
    CommandType[CommandType["chat"] = 0] = "chat";
    CommandType[CommandType["emoji"] = 1] = "emoji";
})(CommandType || (CommandType = {}));
export class TextCommand {
    constructor(name) {
        this.type = CommandType.chat;
        this.allowNoArgs = false;
        this.helpText = "";
        this.init = () => { };
        this.run = (message, args) => { };
        this.name = name;
        this.alias = [name];
    }
    addAlias(alias) {
        this.alias.push(alias);
    }
    getAliases() {
        return this.alias;
    }
    checkAlias(alias) {
        return this.alias.includes(alias);
    }
}
export class EmojiCommand {
    constructor(name, emoji) {
        this.type = CommandType.emoji;
        this.helpText = "";
        this.init = () => { };
        this.run = (message, reaction) => { };
        this.name = name;
        this.emoji = emoji;
    }
}
export var settingType;
(function (settingType) {
    settingType[settingType["User"] = 0] = "User";
    settingType[settingType["Emoji"] = 1] = "Emoji";
    settingType[settingType["Role"] = 2] = "Role";
    settingType[settingType["Channel"] = 3] = "Channel";
})(settingType || (settingType = {}));
//# sourceMappingURL=plugin.js.map