import { Client, Emoji, Snowflake } from "discord.js";


export class UnicodeEmoji  extends Emoji{
    public constructor(client: Client, emoji: {id: Snowflake|null, name: string|null}){
        super(client, emoji)
    }
}