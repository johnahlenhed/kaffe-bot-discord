import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';
import './keep_alive.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const file = 'kaffe.json';

function loadData() {
    return JSON.parse(fs.readFileSync(file));
}
function saveData(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

client.once('ready', () => {
    console.log(`Botten är online som ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const data = loadData();

    if (interaction.commandName === 'turn') {
        await interaction.reply(`Det är **${data.queue[0]}**s tur att köpa kaffe!`);
    }

    if (interaction.commandName === 'done') {
        const who = interaction.member?.displayName || interaction.user.username;

        // Ta bort personen ur kön (oavsett position)
        data.queue = data.queue.filter(name => name.toLowerCase() !== who.toLowerCase());

        // Lägg till personen sist i kön
        data.queue.push(who);

        // Rensa dubbletter, behåll första förekomsten
        data.queue = data.queue.filter((name, idx) =>
            data.queue.findIndex(n => n.toLowerCase() === name.toLowerCase()) === idx
        );

        // Lägg till i historik
        data.history.push(who);

        saveData(data);
        await interaction.reply(`${who} har köpt kaffe. Nästa i tur är **${data.queue[0]}**!`);
    }

    if (interaction.commandName === 'history') {
        const list = data.history.length ? data.history.join(', ') : 'Ingen har köpt kaffe än!';
        await interaction.reply(`Kaffehistorik: ${list}`);
    }

    if (interaction.commandName === 'join') {
        const who = interaction.user.displayName || interaction.user.displayName

        if (data.queue.includes(who)) {
            await interaction.reply({ content: `${who} är redan med i kön!`, ephemeral: true });
        } else {
            data.queue.push(who);
            saveData(data);
            await interaction.reply(`${who} har lagts till i kaffekön!`);
        }
        return;
    }

    if (interaction.commandName === 'warning') {
        await interaction.reply(`Kaffet är nästan slut! Nästa i tur är **${data.queue[0]}**!\nhttps://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnNsanRyMHVqOXg3NGZqYXJtajNqNWk1cWpvZ3Rxa3R0a21kYXdzciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BbJdwrOsM7nTa/giphy.gif`);
    }

    if (interaction.commandName === 'milkturn') {
        await interaction.reply(`Det är **${data.milkQueue[0] || 'ingen'}**s tur att köpa mjölk!`);
    }

    if (interaction.commandName === 'milkdone') {
        const who = interaction.member?.displayName || interaction.user.username;

        // Ta bort personen ur mjölkkön (oavsett position)
        data.milkQueue = data.milkQueue.filter(name => name.toLowerCase() !== who.toLowerCase());

        // Lägg till personen sist i mjölkkön
        data.milkQueue.push(who);

        // Rensa dubbletter
        data.milkQueue = data.milkQueue.filter((name, idx) =>
            data.milkQueue.findIndex(n => n.toLowerCase() === name.toLowerCase()) === idx
        );

        // Lägg till i mjölkhistorik
        data.milkHistory.push(who);

        saveData(data);
        await interaction.reply(`${who} har köpt mjölk. Nästa i tur är **${data.milkQueue[0]}**!`);
    }

    if (interaction.commandName === 'milkhistory') {
        const list = data.milkHistory.length ? data.milkHistory.join(', ') : 'Ingen har köpt mjölk än!';
        await interaction.reply(`Mjölkhistorik: ${list}`);
    }

    if (interaction.commandName === 'milkjoin') {
        const who = interaction.member?.displayName || interaction.user.username;

        if (data.milkQueue.includes(who)) {
            await interaction.reply({ content: `${who} är redan med i mjölkkön!`, ephemeral: true });
        } else {
            data.milkQueue.push(who);
            saveData(data);
            await interaction.reply(`${who} har lagts till i mjölkkön!`);
        }
        return;
    }

    if (interaction.commandName === 'milkwarning') {
        await interaction.reply(`Mjölken är nästan slut! Nästa i tur är **${data.milkQueue[0]}**!`);
    }
});

client.login(process.env.DISCORD_TOKEN);