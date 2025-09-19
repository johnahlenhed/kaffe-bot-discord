import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

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
});

client.login(process.env.DISCORD_TOKEN);