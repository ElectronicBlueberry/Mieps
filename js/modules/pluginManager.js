import * as fs from 'fs';
import { CommandType, Permission } from "./plugin.js";
import { criticalError } from "./errorHandling.js";
import { State } from "./state.js";
import * as lang from "../lang/pluginManager.js";
import * as Discord from 'discord.js';
import * as Query from "./inputCollector.js";
export class PluginManager {
    constructor(client, instanceConfig) {
        this.client = client;
        this.instanceConfig = instanceConfig;
        this.plugins = new Discord.Collection();
        this.chatCommands = new Discord.Collection();
        this.emojiCommands = new Discord.Collection();
        this.messageStreams = new Discord.Collection();
        this.pluginState = new State("plugin_manager");
        // used to setup permissions in the configurator
        this.permissionPlugin = {
            name: "permissions",
            pluginManager: this,
            client: this.client,
            setupTemplate: [
                { name: "User", type: Query.InputType.Role, description: lang.userRoleDesc() },
                { name: "UserCommandChannel", type: Query.InputType.Channel, description: lang.userChannelDesc() },
                { name: "Mod", type: Query.InputType.Role, description: lang.modRoleDesc() }
            ]
        };
        this.loadPlugin(this.permissionPlugin);
    }
    get guild() {
        return this.client.guilds.cache.first();
    }
    get controlChannel() {
        let c = this.guild.channels.cache.get(this.instanceConfig.control_channel);
        if (!c || c.type !== "text") {
            criticalError("Control Channel not found!");
            return {};
        }
        return c;
    }
    getState() {
        return this.pluginState;
    }
    getChatCommands() {
        return this.chatCommands;
    }
    getEmojiCommands() {
        return this.emojiCommands;
    }
    addChatCommand(command) {
        this.chatCommands.set(command.name, command);
    }
    addEmojiCommand(command) {
        if (command.emoji) {
            this.emojiCommands.set(command.emoji.toString(), command);
        }
    }
    /**
     * Searches for Plugins on Disk, and loads all found plugins.
     * This does not activate the Plugins
     */
    async scanForPlugins(path, suffix) {
        try {
            const files = fs.readdirSync(path);
            files.filter(file => file.endsWith(suffix));
            for (const file of files) {
                try {
                    let _Plugin = await import(file);
                    let pluginInstance = new _Plugin(this, this.client);
                    this.loadPlugin(pluginInstance);
                }
                catch (e) {
                    console.error(`Failed to load Plugin ${file}`);
                }
            }
        }
        catch (e) {
            criticalError("Failed to Load Plugins", e);
        }
    }
    /**
     * Loads a single Plugin from Memory
     * @param plugin Plugin to load
     */
    loadPlugin(plugin) {
        this.plugins.set(plugin.name, plugin);
        if (!plugin.setupTemplate) {
            this.pluginState.write(plugin.name, "configured", true);
        }
        else {
            // If the Plugin has a SetupTemplate, it will also need a state, to make use of it
            plugin.state = new State(plugin.name);
        }
    }
    /** Run a message as a command */
    async runChatCommand(message) {
        var _a;
        // Get the member
        let member = message.member;
        if (!member)
            return;
        // Check if member is in a Query. Members in Query should not be able to issue new commands
        if (Query.isUserInQuery(member.user))
            return;
        // Get the arguments
        let args = message.content.toLowerCase().match(/(?<=!|\s)\S+/gm);
        if (!args || args.length === 0)
            return;
        // Find the command
        let cmd = args.shift();
        let commannd = this.chatCommands.get(cmd);
        if (!commannd)
            return;
        // Check for permissons
        let memberPerm = this.getHighestMemberPermission(member);
        let perm = memberPerm >= commannd.permission;
        // If Member is a User, and Command is for Users, check they are posting in the right channel
        if (memberPerm === Permission.User && commannd.permission === Permission.User) {
            if (message.channel.id !== ((_a = this.permissionPlugin.state) === null || _a === void 0 ? void 0 : _a.read("config", "UserCommandChannel"))) {
                perm = false;
            }
        }
        // Run the command
        if (perm)
            commannd.run(message, args);
    }
    /** Run a reaction as a emoji command */
    async runEmojiCommand(reaction, member) {
        // Find command
        let command = this.emojiCommands.get(reaction.emoji.toString());
        if (!command)
            return;
        // Check for permissons
        let memberPerm = this.getHighestMemberPermission(member);
        let perm = memberPerm >= command.permission;
        if (perm) {
            command.run(reaction);
        }
        else if (command.removeInvalid) {
            reaction.users.remove(member);
        }
    }
    /** Run all message Streams. Return whether message should be processed further */
    async runChatStreams(message) {
        let proceed = true;
        for (const [key, stream] of this.messageStreams) {
            // If channel is not whitelisted, skip it
            if (stream.channels && !stream.channels.includes(message.channel))
                continue;
            let p = await stream.run(message);
            proceed = p && proceed;
        }
        return proceed;
    }
    /**
     * Sets the client for Plugins to use,
     * calls all Plugins init function,
     * then loads their commands
     */
    initiateAll() {
        this.plugins.forEach(p => {
            this._initiatePlugin(p);
        });
    }
    /** Attempts to activate all Plugins */
    activateAll() {
        this.plugins.forEach(plugin => {
            this.activatePlugin(plugin.name);
        });
    }
    /** Load a Plugins commands, and set it to active. Returns false, if the Plugin was not found */
    activatePlugin(name) {
        let plugin = this.plugins.get(name);
        if (plugin && this.pluginState.read(plugin.name, "configured")) {
            this.pluginState.write(plugin.name, "active", true);
            this._initiatePlugin(plugin);
            return true;
        }
        else {
            return false;
        }
    }
    /** Deactive a Plugin, bypassing all its commands and processors. Returns false, if the Plugin was not found */
    deactivatePlugin(name) {
        let plugin = this.plugins.get(name);
        if (plugin) {
            this._unloadCommands(plugin);
            this.pluginState.write(plugin.name, "active", false);
            return true;
        }
        else {
            return false;
        }
    }
    /** Sets whether or not a plugin is configured */
    setConfigured(name, configured) {
        this.pluginState.write(name, "configured", configured);
    }
    /** Load a Plugin as a Built-In, which is required for other plugins/the bots operation, and cannot be deactivated, or configured */
    async addBuiltin(plugin) {
        var _a;
        await ((_a = plugin.init) === null || _a === void 0 ? void 0 : _a.call(plugin));
        this._loadCommands(plugin);
    }
    checkPermission(member, permission) {
        var _a, _b;
        let channel = member.guild.channels.resolve(this.instanceConfig.control_channel);
        if (!channel) {
            criticalError("Control channel not found! Please set a valid channel id, in instance.json");
            return false;
        }
        switch (permission) {
            case Permission.Any:
                {
                    return true;
                }
                break;
            case Permission.User:
                {
                    let role = (_a = this.permissionPlugin.state) === null || _a === void 0 ? void 0 : _a.read("config", "User");
                    if (!role) {
                        channel.send(lang.roleNotSet());
                        return false;
                    }
                    return (member.roles.cache.get(role)) ? true : false;
                }
                break;
            case Permission.Mod:
                {
                    let role = (_b = this.permissionPlugin.state) === null || _b === void 0 ? void 0 : _b.read("config", "Mod");
                    if (!role) {
                        channel.send(lang.roleNotSet());
                        return false;
                    }
                    return (member.roles.cache.get(role)) ? true : false;
                }
                break;
            case Permission.Admin:
                {
                    return member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);
                }
                break;
        }
        return false;
    }
    getHighestMemberPermission(member) {
        if (this.checkPermission(member, Permission.Admin))
            return Permission.Admin;
        if (this.checkPermission(member, Permission.Mod))
            return Permission.Mod;
        if (this.checkPermission(member, Permission.User))
            return Permission.User;
        return Permission.Any;
    }
    // ========== Private Functions ==========
    async _initiatePlugin(p) {
        var _a;
        if (this.pluginState.read(p.name, "active")) {
            await ((_a = p.init) === null || _a === void 0 ? void 0 : _a.call(p));
            this._loadCommands(p);
        }
    }
    /** Loads a Plugins commands */
    _loadCommands(plugin) {
        var _a;
        (_a = plugin.commands) === null || _a === void 0 ? void 0 : _a.forEach(command => {
            if (command.type === CommandType.Chat)
                this.chatCommands.set(command.name, command);
            if (command.type === CommandType.Emoji) {
                let _command = command;
                if (_command.emoji) {
                    this.emojiCommands.set(_command.emoji.toString(), _command);
                }
            }
        });
        if (plugin.messageStream)
            this.messageStreams.set(plugin.name, plugin.messageStream);
    }
    // Remove a Plugins Commands from the Command Collections, so they wont be called again
    _unloadCommands(plugin) {
        var _a;
        (_a = plugin.commands) === null || _a === void 0 ? void 0 : _a.forEach(command => {
            if (command.type === CommandType.Chat)
                this.chatCommands.delete(command.name);
            if (command.type === CommandType.Emoji) {
                let commandKey = this.emojiCommands.findKey(c => c.name === command.name);
                if (commandKey)
                    this.emojiCommands.delete(commandKey);
            }
        });
        if (plugin.messageStream)
            this.messageStreams.delete(plugin.name);
    }
}
//# sourceMappingURL=pluginManager.js.map