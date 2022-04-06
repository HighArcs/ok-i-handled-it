import { Message } from "discord.js";
export declare namespace Parameters {
    function boolean(value: string, context: Message): boolean;
    function string(value: string, context: Message): string;
    function number(value: string, context: Message): number;
    function float(value: string, context: Message): number;
    function integer(value: string, context: Message): number;
    function bigint(value: string, context: Message): bigint;
    function channel(value: string, context: Message): import("discord.js").DMChannel | import("discord.js").PartialDMChannel | import("discord.js").GuildBasedChannel | undefined;
    function member(value: string, context: Message): import("discord.js").GuildMember | null | undefined;
    function role(value: string, context: Message): import("discord.js").Role | null | undefined;
    function emoji(value: string, context: Message): import("discord.js").GuildEmoji | null;
    function user(value: string, context: Message): import("discord.js").User | null;
    function date(value: string, context: Message): Date;
}
