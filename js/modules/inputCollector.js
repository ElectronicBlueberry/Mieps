import * as lang from "../lang/inputCollector.js";
import { command_prefix } from "../config/server.json";
import EmojiRegex from "emoji-regex";
const emojiRegex = EmojiRegex();
export var InputType;
(function (InputType) {
    InputType[InputType["User"] = 0] = "User";
    InputType[InputType["Emoji"] = 1] = "Emoji";
    InputType[InputType["Role"] = 2] = "Role";
    InputType[InputType["Channel"] = 3] = "Channel";
    InputType[InputType["Message"] = 4] = "Message";
    InputType[InputType["Text"] = 5] = "Text";
    InputType[InputType["Number"] = 6] = "Number";
    InputType[InputType["TextList"] = 7] = "TextList";
    InputType[InputType["ChannelList"] = 8] = "ChannelList";
    InputType[InputType["RoleList"] = 9] = "RoleList";
})(InputType || (InputType = {}));
export var InputReturns;
(function (InputReturns) {
    InputReturns[InputReturns["Canceled"] = 0] = "Canceled";
    InputReturns[InputReturns["TimedOut"] = 1] = "TimedOut";
    InputReturns[InputReturns["Answered"] = 2] = "Answered";
})(InputReturns || (InputReturns = {}));
var _usersInQuery = new Map();
/**
 * Queries the user for an Input
 * @param channel Channel the query is taking place in
 * @param user The User to Query
 * @param query The Query to ask
 * @param type The expected type of the queries answer
 * @param queryID If the Query should return only the ID, instead of the entire object. Does nothing for "Emoji"
 * @param timeout Time in Milliseconds to wait for a response. 5 min by default
 */
export async function queryInput(channel, user, query, type, queryID = true, timeout = 300000) {
    _usersInQuery.set(user.id, user);
    let answer = await _queryInput(channel, user, query, type, queryID, timeout);
    _usersInQuery.delete(user.id);
    return answer;
}
async function _queryInput(channel, user, query, type, queryID, timeout) {
    var _a, _b, _c;
    channel.send(query);
    while (true) {
        let msgArr = await channel.awaitMessages((m) => m.author == user, { max: 1, time: timeout });
        if (msgArr.size === 0) {
            channel.send(lang.timeOut());
            return ["", InputReturns.TimedOut];
        }
        let msg = msgArr.first();
        if (msg.content.toLowerCase().trimEnd() === `${command_prefix}cancel`) {
            channel.send(lang.canceled());
            return ["", InputReturns.Canceled];
        }
        let guild = channel.guild;
        switch (type) {
            case InputType.User:
                let usr = (_a = msg.mentions.users) === null || _a === void 0 ? void 0 : _a.first();
                if (usr) {
                    return [(queryID) ? usr.id : usr, InputReturns.Answered];
                }
                try {
                    let memb = await guild.members.fetch(msg.content.trim());
                    return [(queryID) ? memb.id : memb, InputReturns.Answered];
                }
                catch { }
                channel.send(lang.wrongInputUser(msg.content.trim()));
                break;
            case InputType.Emoji:
                // Catch custom emojis
                let emojis = msg.content.match(/(?<=:)[0-9]+(?=>)/);
                if (emojis) {
                    // Find the custom emoji, and return its id
                    let emoji = guild.emojis.cache.get(emojis[0]);
                    if (emoji)
                        return [emoji.id, InputReturns.Answered];
                }
                else {
                    // If no custom emoji was counf, catch unicode emojis
                    let emojisTxt = msg.content.match(emojiRegex);
                    if (emojisTxt)
                        return [emojisTxt, InputReturns.Answered];
                }
                channel.send(lang.wrongInputEmoji());
                break;
            case InputType.Role:
                let role = (_b = msg.mentions.roles) === null || _b === void 0 ? void 0 : _b.first();
                if (role) {
                    return [(queryID) ? role.id : role, InputReturns.Answered];
                }
                role = await guild.roles.fetch(msg.content.trim());
                if (role) {
                    return [(queryID) ? role.id : role, InputReturns.Answered];
                }
                channel.send(lang.wrongInputRole(msg.content.trim()));
                break;
            case InputType.Channel:
                let chnl = (_c = msg.mentions.channels) === null || _c === void 0 ? void 0 : _c.first();
                if (chnl) {
                    return [(queryID) ? chnl.id : chnl, InputReturns.Answered];
                }
                chnl = guild.channels.cache.get(msg.content.trim());
                if (chnl) {
                    return [(queryID) ? chnl.id : chnl, InputReturns.Answered];
                }
                channel.send(lang.wrongInputChannel(msg.content.trim()));
                break;
            case InputType.Message:
                return [(queryID) ? msg.id : msg, InputReturns.Answered];
                break;
            case InputType.Text:
                return [msg.content, InputReturns.Answered];
                break;
            case InputType.Number:
                return [parseInt(msg.content, 10), InputReturns.Answered];
                break;
            case InputType.TextList:
                return [msg.content.split('\n'), InputReturns.Answered];
                break;
            case InputType.ChannelList:
                let cContent = msg.content.replace(/<@#|>|[^\S\r\n]/gm, '');
                let channels = cContent.split('\n');
                return [channels, InputReturns.Answered];
                break;
            case InputType.RoleList:
                let rContent = msg.content.replace(/<@&|>|[^\S\r\n]/gm, '');
                let roles = rContent.split('\n');
                return [roles, InputReturns.Answered];
                break;
        }
    }
}
/**
 * Check if a User is currently in a Query
 * @param user the User to check
 */
export function isUserInQuery(user) {
    return _usersInQuery.has(user.id);
}
//# sourceMappingURL=inputCollector.js.map