import {REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "✅ loaded" : "❌ missing");
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("GUILD_ID:", process.env.GUILD_ID);

const commands = [
    new SlashCommandBuilder()
    .setName('turn')
    .setDescription('Vems tur det är att köpa kaffe.'),
    new SlashCommandBuilder()
    .setName('done')
    .setDescription('Markerar att kaffet är köpt'),
    new SlashCommandBuilder()
    .setName('history')
    .setDescription('Visa vilka som redan köpt kaffe'),
    new SlashCommandBuilder()
    .setName('join')
    .setDescription('Gå med i kaffelistan')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log('Registrerar kommandon...');
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
    );
    console.log('Klart!');
} catch (err) {
    console.error(err);
}