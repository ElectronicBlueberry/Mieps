import * as Discord from "discord.js";
export function embedFromMessage(message) {
    // If the Message is another Bot Embed, copy it
    if (message.author.bot && message.embeds.length === 1 && message.content.trim() === "") {
        return message.embeds[0];
    }
    let embed = new Discord.MessageEmbed();
    // Set Embeds Author
    let av = message.author.avatarURL();
    if (message.member !== null) {
        embed = embed.setAuthor(message.member.displayName, av || undefined)
            .setColor(message.member.displayColor);
    }
    else {
        embed = embed.setAuthor(message.author.username, av || undefined)
            .setColor('#ffffff');
    }
    embed = embed.setDescription(message.content)
        .setTimestamp(message.createdTimestamp);
    // Reattach Images, as they wont show up otherwise
    let attachment = message.attachments.first();
    if (attachment && (attachment.width || attachment.height)) {
        embed = embed.attachFiles([attachment.url])
            .setImage(`attachment://${attachment.name}`);
    }
    return embed;
}
//# sourceMappingURL=embedMaker.js.map