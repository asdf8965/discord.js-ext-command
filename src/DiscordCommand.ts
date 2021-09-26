import {Client, ClientOptions, Message, PermissionString} from "discord.js";

export interface DiscordCommand {
    name: string;
    alias?: string[];
    description?: string;
    bot?: boolean;
    userPermissions?: PermissionString[];
    botPermissions?: PermissionString[];

    run(arg: DiscordCommandArgs): any | Promise<any>;
}

export interface DiscordCommandArgs {
    client: Client;
    message: Message;
    args: any[];
}

const commandList: {
    name: string,
    command: DiscordCommand
}[] = [];

export function Command(target: any) {
    const command: DiscordCommand = new target();

    if (command.name === undefined)
        throw "name is null!";

    if (command.run === undefined)
        throw "run is null!";

    commandList.push({
        name: command.name,
        command: command
    });
}

export default class DiscordCommands extends Client {
    constructor(prefix: string, options: ClientOptions) {
        super(options);

        super.on("messageCreate", async message => {
            if (!message.content.startsWith(prefix))
                return;

            if (message.content.slice(0, prefix.length) !== prefix)
                return;

            const args = message.content.substring(prefix.length).split(" ");
            const command = args.shift();

            if (!command)
                return;

            const target = commandList.find(a => a.name === command || a.command.alias?.includes(command));

            if (!target)
                return;

            if (target.command.bot === false && message.author.bot)
                return;

            if (target.command.userPermissions !== undefined && !message.member?.permissions.has(target.command.userPermissions))
                return;

            if (target.command.botPermissions !== undefined && !message.member?.permissions.has(target.command.botPermissions))
                return;

            await target.command.run({
                client: message.client,
                message: message,
                args: args
            });
        });
    }

    public get Commands() {
        return commandList;
    }
}