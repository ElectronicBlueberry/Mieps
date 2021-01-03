# Mieps

A single-server Typescript Discord bot with a simple plugin system.

## Plugins

* Block Links: deletes messages from non-members containing links
* Freeze: temporarily revokes write privileges for members in a channel
* Join Greetings: greets new users
* Message Mover: moves, copies, or deletes single or many Messages, with a reaction based interface
* Optional Channels: allows members to join, or leave, optional channels
* Self Assign Role: allows members to give themselves roles, based on aliases
* Warnings: used for moderators to write warnings, in case of member misconduct
* Pin: allows community members to pin messages to a special channel

Except for "Self Assign Roles" all plugins can be fully configured through the server. Use the command "!plugin" to get started.

Do not invite Mieps to more than one server! (For now), Mieps only works on one server at a time.

## Requirements

* Typescript 4.1+
* Node 14.5.1+

## Dependencies

* __[discord.js](https://discord.js.org/)__ - bot framework
* __[emoji-regex](https://www.npmjs.com/package/emoji-regex)__ - regularly updated regex matching all unicode emoji
* __[esm](https://www.npmjs.com/package/esm)__ - fixes some node module shortcomings

## Installing and running

To use Mieps, clone the respetroy to a local folder and use:

```shell
npm i
tsc
npm start
```

Then fill out the newly created "instance.json" file.

`"api_key"` refers to your bots api key. Get one in discords developer portal.
`"control_channel"` is the id of the channel you intend to use to control the bot.
Acitvate discords developer options, under "Appeatance" in settings. Then right click the channel you intend to use, and copy the id.

Next invite your bot to the server, and make sure it has read/write permissions in the control channel. Then start Mieps with `npm start` again.

Now you need to configure Mieps. Type `!plugins` in the command channel, to get started.

## Images

Please note that while the bot itself is licensed under MIT, the images it uses are not. While I do not generally mind the use of these images, do not claim ownership over them, or modify them. You are always free to replace the Images with your own.
