import * as Plugin from "../modules/plugin.js";
import Settings from "./selfAssignRoles/settings.json";
// ========== Plugin ==========
export default class selfAssignRoles extends Plugin.Plugin {
    constructor() {
        super(...arguments);
        this.name = "self_assign_roles";
        this.commands = [];
    }
    async init() {
        Settings.topics.forEach(topic => {
            this.commands.push(new SetRole(topic));
        });
    }
}
// ========== Commands ==========
class SetRole extends Plugin.ChatCommand {
    constructor(topic) {
        super(topic.command);
        this.permission = Plugin.Permission.User;
        this.topic = topic;
    }
    getHelpText() {
        return fillTemplate(this.topic.help, this.topic.roles);
    }
    async run(message, args) {
        let channel = message.channel;
        // Roles that were set with this command
        let setRoles = [];
        // Attempts to set all provided roles
        for (const roleName of args) {
            let roleObj = addRole(message, roleName, this.topic);
            if (roleObj !== null) {
                setRoles.push(roleObj);
            }
        }
        // If no roles were sucessfully set, respond with help text
        if (args.length !== 0 && setRoles.length === 0) {
            channel.send(this.getHelpText());
            return;
        }
        // How many roles were sucessfully removed
        let removeCount = 0;
        // Clear all other roles
        for (const roleObj of this.topic.roles) {
            if (!setRoles.find(v => v.role === roleObj.role)) {
                removeCount += removeRole(message, roleObj.role) ? 1 : 0;
            }
        }
        // No Roles were removed, or added
        if (removeCount === 0 && args.length === 0) {
            message.channel.send(this.getHelpText());
        }
        // Roles were sucessfully set
        else if (setRoles.length !== 0) {
            message.channel.send(fillTemplate(this.topic.set_message, setRoles));
        }
        // Roles were sucessfully cleared
        else {
            message.channel.send(fillTemplate(this.topic.cleared_message, this.topic.roles));
        }
    }
}
// ========== Functions ==========
/**
 * Constructs a string of avalible roles, excluding aliases
 * @param array Array of roles to construct string from
 */
function buildRoleString(array) {
    let message = "";
    let set = [];
    for (let i = 0; i < array.length; i++) {
        if (set.includes(array[i].role))
            continue;
        set.push(array[i].role);
        message += "\n";
        message += array[i].role;
    }
    return message;
}
/**
 * Checks if a role name appears in a topic, and returns role object
 * @param name Role name to match
 * @param topic Topic to search for
 */
function findRoleInTopic(name, topic) {
    let roleObj = topic.roles.find(role => {
        return role.name.toLowerCase() === name.replace(/[.,]/g, '');
    });
    return roleObj;
}
/**
 * Tries to add a role to the author of a message
 * @param message
 * @param roleName
 * @param topic Topic which has to contain role
 */
function addRole(message, roleName, topic) {
    var _a, _b;
    let roleObj = findRoleInTopic(roleName, topic);
    if (!roleObj) {
        return null;
    }
    let role = (_a = message.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.find(r => r.name === roleObj.role);
    if (!role) {
        return null;
    }
    (_b = message.member) === null || _b === void 0 ? void 0 : _b.roles.add(role);
    return roleObj;
}
/**
 * Tries to remove a role from the message author
 * @param message
 * @param roleName
 */
function removeRole(message, roleName) {
    var _a, _b;
    let role = (_a = message.member) === null || _a === void 0 ? void 0 : _a.roles.cache.find(r => r.name === roleName);
    if (role == undefined) {
        return false;
    }
    (_b = message.member) === null || _b === void 0 ? void 0 : _b.roles.remove(role);
    return true;
}
/**
 * Replaces all occurences of "$ROLES" in a string, with actual roles
 * @param messageTxt string to parse
 * @param roles roles to insert
 */
function fillTemplate(messageTxt, roles) {
    return messageTxt.replace(/\$ROLES/gm, `${buildRoleString(roles)}`);
}
//# sourceMappingURL=selfAssignRoles.plugin.js.map