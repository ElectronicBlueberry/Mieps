import * as lang from "../lang/plugins/messageMover.js";
import * as Plugin from "../modules/plugin.js";
import { State } from "../modules/state.js";
import * as Discord from "discord.js";
import { embedFromMessage } from "../modules/embedMaker.js";
// ========== Plugin ==========
export default class MessageMover extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "message_mover";
        this.description = lang.pluginDescription;
        this.state = new State(this.name);
        this.setupTemplate = [
            { name: "audit_log_channel", description: lang.auditLogChannel, type: Plugin.InputType.Channel },
            { name: "start_cut_emoji", description: lang.startCutEmoji, type: Plugin.InputType.Emoji },
            { name: "end_cut_emoji", description: lang.endCutEmoji, type: Plugin.InputType.Emoji },
            { name: "delete_emoji", description: lang.deleteEmoji, type: Plugin.InputType.Emoji },
            { name: "copy_emoji", description: lang.copyEmoji, type: Plugin.InputType.Emoji }
        ];
        this.deleteSingle = new DeleteSingle(this);
        this.copySingle = new CopySingle(this);
        this.startSelection = new Selection(this, "start");
        this.endSelection = new Selection(this, "end");
        this.commands = [
            this.deleteSingle,
            this.copySingle,
            this.startSelection,
            this.endSelection,
            new MoveMessages(this),
            new DeleteMessages(this),
            new CopyMessages(this)
        ];
    }
    async init() {
        this.deleteSingle.emoji = await this.getSetting("delete_emoji", Plugin.InputType.Emoji);
        this.copySingle.emoji = await this.getSetting("copy_emoji", Plugin.InputType.Emoji);
        this.startSelection.emoji = await this.getSetting("start_cut_emoji", Plugin.InputType.Emoji);
        this.endSelection.emoji = await this.getSetting("end_cut_emoji", Plugin.InputType.Emoji);
    }
    async getLogChannel() {
        return await this.getSetting("audit_log_channel", Plugin.InputType.Channel);
    }
}
// ========== Functions ==========
async function fetchSelected(member, state) {
    let startIds = state.read(member.id, "start");
    let endIds = state.read(member.id, "end");
    // If no Ids were set, return now
    if (!startIds || !endIds || startIds.channel !== endIds.channel)
        return;
    let guild = member.guild;
    let channel = guild.channels.cache.get(startIds.channel);
    // If channel no longer exists, return now
    if (!channel)
        return;
    let messages = new Discord.Collection();
    // This is wrapped in a try catch block, as the messages may be deleted
    try {
        // Get the first and the last message
        let start = await channel.messages.fetch(startIds.message);
        let end = await channel.messages.fetch(endIds.message);
        // Start populating the Message Collection
        messages.set(start.id, start);
        // Keep fetching messages, until we have arrived at the last message
        let current = start;
        while (current.createdTimestamp < end.createdTimestamp) {
            let newMessages = await channel.messages.fetch({ after: current.id });
            newMessages = newMessages.sort((a, b) => { return a.createdTimestamp - b.createdTimestamp; });
            messages = messages.concat(newMessages);
            current = newMessages.last();
            // Edge-Case that occurs when a crucial message was deleted
            if (!current)
                break;
        }
        // Filter all messages, which were psoted after the last message
        messages = messages.filter(m => m.createdTimestamp <= end.createdTimestamp);
    }
    catch {
        return;
    }
    return messages;
}
// ========== Emoji Commands ==========
class DeleteSingle extends Plugin.EmojiCommand {
    constructor(plugin) {
        super("deleteSingle");
        this.plugin = plugin;
        this.permission = Plugin.Permission.Mod;
    }
    getHelpText() {
        return lang.deleteSingleHelp;
    }
    async run(reaction, member) {
        let logChannel = await this.plugin.getLogChannel();
        try {
            let message = reaction.message;
            let embed = embedFromMessage(message);
            await logChannel.send(lang.logMessage(member), embed);
            await message.delete();
        }
        catch {
            logChannel === null || logChannel === void 0 ? void 0 : logChannel.send(lang.deleteFailed());
        }
    }
}
class CopySingle extends Plugin.EmojiCommand {
    constructor(plugin) {
        super("copySingle");
        this.plugin = plugin;
        this.permission = Plugin.Permission.Mod;
    }
    getHelpText() {
        return lang.copySingleHelp;
    }
    async run(reaction, member) {
        let logChannel = await this.plugin.getLogChannel();
        try {
            let message = reaction.message;
            let embed = embedFromMessage(message);
            await (logChannel === null || logChannel === void 0 ? void 0 : logChannel.send(lang.copyLog(member), embed));
        }
        catch {
            logChannel === null || logChannel === void 0 ? void 0 : logChannel.send(lang.copyFailed());
        }
    }
}
class Selection extends Plugin.EmojiCommand {
    constructor(plugin, position) {
        super("startSelection");
        this.plugin = plugin;
        this.position = position;
        this.permission = Plugin.Permission.Mod;
    }
    getHelpText() {
        return lang.startCutHelp;
    }
    async run(reaction, member) {
        var _a, _b;
        // Delete the old mark, if one is present
        let oldR = this.plugin.state.read(member.id, this.position);
        if (oldR) {
            try {
                let guild = member.guild;
                let channel = guild.channels.cache.get(oldR.channel);
                let oldRMessage = await (channel === null || channel === void 0 ? void 0 : channel.messages.fetch(oldR.message));
                if (!(oldRMessage.id === reaction.message.id && oldRMessage.channel.id === reaction.message.channel.id))
                    await ((_b = (await ((_a = oldRMessage.reactions.cache.get(oldR.id || oldR.name)) === null || _a === void 0 ? void 0 : _a.fetch()))) === null || _b === void 0 ? void 0 : _b.users.remove(member.id));
            }
            catch { }
        }
        this.plugin.state.write(member.id, this.position, {
            channel: reaction.message.channel.id,
            message: reaction.message.id,
            id: reaction.emoji.id,
            name: reaction.emoji.name
        });
    }
}
// ========== Chat Commands ==========
class MoveMessages extends Plugin.ChatCommand {
    constructor(plugin) {
        super("move");
        this.plugin = plugin;
        this.permission = Plugin.Permission.Mod;
    }
    getHelpText() {
        return lang.moveHelp;
    }
    async run(message, args) {
        let member = message.member;
        try {
            let messages = await fetchSelected(member, this.plugin.state);
            if (!messages) {
                message.channel.send(lang.failMessage());
                return;
            }
            let embeds = messages.map(m => {
                return embedFromMessage(m);
            });
            // Send Messages to new Channel
            for (const embed of embeds) {
                await message.channel.send("", embed);
            }
            // Delete old Messages
            messages.forEach(m => {
                m.delete();
            });
            // Post Response
            let attachment = new Discord.MessageAttachment("./img/banner.gif");
            let sourceChannelId = this.plugin.state.read(member.id, "start").channel;
            let sourceChannel = member.guild.channels.cache.get(sourceChannelId);
            sourceChannel.send(lang.moved(embeds.length, message.channel), attachment);
            // Delete Command
            message.delete();
        }
        catch {
            message.channel.send(lang.failMessage());
        }
    }
}
class CopyMessages extends Plugin.ChatCommand {
    constructor(plugin) {
        super("copy");
        this.plugin = plugin;
        this.permission = Plugin.Permission.Mod;
    }
    async run(message, args) {
        let member = message.member;
        try {
            let messages = await fetchSelected(member, this.plugin.state);
            if (!messages) {
                message.channel.send(lang.copyFailed());
                return;
            }
            let embeds = messages.map(m => {
                return embedFromMessage(m);
            });
            // Send Messages to new Channel
            for (const embed of embeds) {
                await message.channel.send("", embed);
            }
            // Delete Command
            await message.delete();
        }
        catch {
            message.channel.send(lang.copyFailed());
        }
    }
}
class DeleteMessages extends Plugin.ChatCommand {
    constructor(plugin) {
        super("delete");
        this.plugin = plugin;
        this.permission = Plugin.Permission.Mod;
    }
    async run(message, args) {
        let member = message.member;
        let logChannel = await this.plugin.getLogChannel();
        try {
            let messages = await fetchSelected(member, this.plugin.state);
            if (!messages) {
                message.channel.send(lang.deleteFailed());
                return;
            }
            let embeds = messages.map(m => {
                return embedFromMessage(m);
            });
            // Log Message
            await logChannel.send(lang.logMessage(member));
            // Send Messages to log-Channel
            for (const embed of embeds) {
                await logChannel.send("", embed);
            }
            // Delete old Messages
            messages.forEach(m => {
                m.delete();
            });
            // Delete Command
            await message.delete();
        }
        catch {
            message.channel.send(lang.deleteFailed());
        }
    }
}
//# sourceMappingURL=messageMover.plugin.js.map