import { ChatCommand, Permission } from "./plugin.js";
import * as lang from "../lang/builtinCommands.js";
import * as Discord from 'discord.js';
import * as Query from "./inputCollector.js";
export class BuiltIn {
    constructor(client, pluginManager) {
        this.client = client;
        this.pluginManager = pluginManager;
        this.name = "builtin-commands";
        this.commands = [
            new HelpCommand(this),
            new PluginCommand(this),
            new ConfigCommand(this)
        ];
    }
}
class PluginCommand extends ChatCommand {
    constructor(plugin) {
        super("plugin");
        this.plugin = plugin;
        this.permission = Permission.Admin;
        this.pM = plugin.pluginManager;
    }
    getHelpText() {
        return lang.pluginCommandHelp();
    }
    async run(message, args) {
        let channel = message.channel;
        if (args.length === 0) {
            channel.send(this.getHelpText());
            return;
        }
        switch (args[0]) {
            case "activate":
                {
                    if (args.length < 2) {
                        channel.send(this.getHelpText());
                        return;
                    }
                    if (args[1] === "all") {
                        channel.send(lang.activateAll());
                        this.pM.activateAll();
                        return;
                    }
                    let found = this.pM.activatePlugin(args[1]);
                    if (!found) {
                        channel.send(lang.pluginNotFound(args[1]));
                    }
                }
                break;
            case "deactivate":
                {
                    if (args.length < 2) {
                        channel.send(this.getHelpText());
                        return;
                    }
                    let found = this.pM.deactivatePlugin(args[1]);
                    if (!found) {
                        channel.send(lang.pluginNotFound(args[1]));
                    }
                }
                break;
            case "list":
                {
                    channel.send(lang.pluginList(this.pM.plugins, this.pM.getState()));
                }
                break;
            default:
                channel.send(this.getHelpText());
        }
    }
}
class HelpCommand extends ChatCommand {
    constructor(plugin) {
        super("help");
        this.plugin = plugin;
        this.permission = Permission.Any;
        this.pM = plugin.pluginManager;
    }
    getHelpText() {
        return "I heard you like help, so I got you some help for your help";
    }
    async run(message, args) {
        let channel = message.channel;
        let member = message.member;
        let perm = this.pM.getHighestMemberPermission(member);
        let cCommands = new Discord.Collection();
        let eCommands = new Discord.Collection();
        this.pM.getChatCommands().forEach(c => {
            if (c.permission <= perm)
                cCommands.set(c.name, c);
        });
        this.pM.getEmojiCommands().forEach(c => {
            if (c.permission <= perm && c.emoji)
                eCommands.set(c.emoji.toString(), c);
        });
        if (args.length > 0) {
            let command = cCommands.get(args[0]);
            if (command) {
                channel.send(command.getHelpText());
                return;
            }
            let reaction = eCommands.get(args[0]);
            if (reaction) {
                channel.send(reaction.getHelpText());
                return;
            }
        }
        channel.send(lang.commandList(cCommands, eCommands));
    }
}
class ConfigCommand extends ChatCommand {
    constructor(plugin) {
        super("config");
        this.plugin = plugin;
        this.permission = Permission.Admin;
        this.pM = plugin.pluginManager;
    }
    getHelpText() {
        return lang.configHelp();
    }
    async run(message, args) {
        let channel = message.channel;
        if (args.length === 0) {
            channel.send(this.getHelpText());
            return;
        }
        if (args[0] === "all") {
            let pluginState = this.pM.getState();
            let count = 0;
            for (const [name, plugin] of this.pM.plugins) {
                // Only configure configurable Plugins, which are not yet configured
                if (!plugin.setupTemplate || pluginState.read(name, "configured"))
                    continue;
                channel.send(lang.nowConfiguring(name));
                await this.configurePlugin(message, plugin);
                count++;
            }
            if (count === 0) {
                channel.send(lang.noUnconfigured());
            }
            else {
                channel.send(lang.allComplete());
            }
        }
        else {
            let plugin = this.pM.plugins.get(args[0]);
            if (!plugin) {
                channel.send(lang.pluginNotFound(args[0]));
                return;
            }
            await this.configurePlugin(message, plugin);
            channel.send(lang.configDone(plugin.name));
        }
    }
    async configurePlugin(message, plugin) {
        var _a;
        let channel = message.channel;
        if (!plugin.setupTemplate) {
            channel.send(lang.noConfig(plugin.name));
            return;
        }
        // Loop through all Settings, and save their values in the Plugins State
        for (const setting of plugin.setupTemplate) {
            let input = "";
            input = await Query.queryInput(channel, message.author, setting.description || setting.name, setting.type);
            if (input === Query.InputReturns.Canceled || input === Query.InputReturns.TimedOut)
                return;
            (_a = plugin.state) === null || _a === void 0 ? void 0 : _a.write("config", setting.name, input);
        }
        this.pM.setConfigured(plugin.name, true);
    }
}
//# sourceMappingURL=builtinCommands.js.map