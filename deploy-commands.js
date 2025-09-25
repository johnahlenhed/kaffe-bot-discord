import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

console.log(
    "DISCORD_TOKEN:",
    process.env.DISCORD_TOKEN ? "✅ loaded" : "❌ missing",
);
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("GUILD_ID:", process.env.GUILD_ID);

const commands = [
    new SlashCommandBuilder()
        .setName("turn")
        .setDescription("Vems tur det är att köpa kaffe."),
    new SlashCommandBuilder()
        .setName("done")
        .setDescription("Markerar att kaffet är köpt"),
    new SlashCommandBuilder()
        .setName("history")
        .setDescription("Visa vilka som redan köpt kaffe"),
    new SlashCommandBuilder()
        .setName("join")
        .setDescription("Gå med i kaffelistan"),
    new SlashCommandBuilder()
        .setName("warning")
        .setDescription("Varnar för att kaffet nästan är slut"),
    new SlashCommandBuilder()
        .setName("milkturn")
        .setDescription("Vems tur det är att köpa mjölk."),
    new SlashCommandBuilder()
        .setName("milkdone")
        .setDescription("Markerar att mjölken är köpt"),
    new SlashCommandBuilder()
        .setName("milkhistory")
        .setDescription("Visa vilka som redan köpt mjölk"),
    new SlashCommandBuilder()
        .setName("milkjoin")
        .setDescription("Gå med i mjölkkön"),
    new SlashCommandBuilder()
        .setName("milkwarning")
        .setDescription("Varnar för att mjölken nästan är slut"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log("Registrerar kommandon...");
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID,
        ),
        { body: commands },
    );
    console.log("Klart!");
} catch (err) {
    console.error(err);
}
