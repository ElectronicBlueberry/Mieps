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
})(InputType || (InputType = {}));
export var InputReturns;
(function (InputReturns) {
    InputReturns[InputReturns["Canceled"] = 0] = "Canceled";
    InputReturns[InputReturns["TimedOut"] = 1] = "TimedOut";
    InputReturns[InputReturns["Answered"] = 2] = "Answered";
})(InputReturns || (InputReturns = {}));
var _usersInQuery = new Map();
/**
 * Queries the user for an Input, and waits up to 5 Minuets for a response
 * @param channel Channel the query is taking place in
 * @param user The User to Query
 * @param query The Query to ask
 * @param type The expected type of the queries answer
 */
export async function queryInput(channel, user, query, type) {
    _usersInQuery.set(user.id, user);
    let answer = await _queryInput(channel, user, query, type);
    _usersInQuery.delete(user.id);
    return answer;
}
async function _queryInput(channel, user, query, type) {
    var _a, _b, _c, _d;
    channel.send(query);
    while (true) {
        let msgArr = await channel.awaitMessages((m) => m.author == user, { max: 1, time: 300000 });
        if (msgArr.size === 0) {
            channel.send(lang.timeOut());
            return InputReturns.TimedOut;
        }
        let msg = msgArr.first();
        if (msg.content.toLowerCase().trimEnd() === `${command_prefix}cancel`) {
            channel.send(lang.canceled());
            return InputReturns.Canceled;
        }
        let guild = channel.guild;
        switch (type) {
            case InputType.User:
                {
                    let usr = (_a = msg.mentions.users) === null || _a === void 0 ? void 0 : _a.first();
                    if (usr) {
                        return usr.id;
                    }
                    try {
                        return (await guild.members.fetch(msg.content.trim())).id;
                    }
                    catch { }
                    channel.send(lang.wrongInputUser(msg.content.trim()));
                }
                break;
            case InputType.Emoji:
                {
                    // Catch custom emojis
                    let emojis = msg.content.match(/(?<=:)[0-9]+(?=>)/);
                    if (emojis) {
                        // Find the custom emoji, and return its id
                        let emojiId = (_b = guild.emojis.cache.get(emojis[0])) === null || _b === void 0 ? void 0 : _b.id;
                        if (emojiId)
                            return emojiId;
                    }
                    else {
                        // If no custom emoji was counf, catch unicode emojis
                        let emojisTxt = msg.content.match(emojiRegex);
                        if (emojisTxt)
                            return emojisTxt[0];
                    }
                    channel.send(lang.wrongInputEmoji());
                }
                break;
            case InputType.Role:
                {
                    let role = (_c = msg.mentions.roles) === null || _c === void 0 ? void 0 : _c.first();
                    if (role) {
                        return role.id;
                    }
                    role = await guild.roles.fetch(msg.content.trim());
                    if (role) {
                        return role.id;
                    }
                    channel.send(lang.wrongInputRole(msg.content.trim()));
                }
                break;
            case InputType.Channel:
                {
                    let chnl = (_d = msg.mentions.channels) === null || _d === void 0 ? void 0 : _d.first();
                    if (chnl) {
                        return chnl.id;
                    }
                    chnl = guild.channels.cache.get(msg.content.trim());
                    if (chnl) {
                        return chnl.id;
                    }
                    channel.send(lang.wrongInputChannel(msg.content.trim()));
                }
                break;
            case InputType.Message:
                {
                    return msg.id;
                }
                break;
            case InputType.Text:
                {
                    return msg.content;
                }
                break;
            case InputType.Number:
                {
                    return parseInt(msg.content, 10);
                }
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