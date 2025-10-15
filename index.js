import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

// 🧩 Skapa anslutning till Heroku PostgreSQL
// Heroku sätter automatisk DATABASE_URL i env vars.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🧠 Initiera Discord-klienten
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🚀 Startmeddelande
client.once("ready", async () => {
  console.log(`☕ Botten är online som ${client.user.tag}`);
  await initDatabase();
});

// 📦 Initiera tabeller om de inte finns
async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coffee_queue (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coffee_history (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS milk_queue (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS milk_history (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Databas initierad!");
}

// ⚙️ Hjälpfunktioner för databas
async function getQueue(type) {
  const result = await pool.query(`SELECT name FROM ${type}_queue ORDER BY id ASC`);
  return result.rows.map((r) => r.name);
}

async function addToQueue(type, name) {
  try {
    await pool.query(`INSERT INTO ${type}_queue (name) VALUES ($1)`, [name]);
  } catch {
    // ignorerar om användaren redan finns
  }
}

async function removeFromQueue(type, name) {
  await pool.query(`DELETE FROM ${type}_queue WHERE LOWER(name) = LOWER($1)`, [name]);
}

async function addToHistory(type, name) {
  await pool.query(`INSERT INTO ${type}_history (name) VALUES ($1)`, [name]);
}

// 🎯 Discord-kommandon
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const who = interaction.member?.displayName || interaction.user.username;

  try {
    // ☕ KAFFE-KÖN
    if (commandName === "join") {
      await addToQueue("coffee", who);
      await interaction.reply(`${who} har lagts till i kaffekön!`);
    }

    if (commandName === "turn") {
      const queue = await getQueue("coffee");
      if (queue.length === 0) return interaction.reply("Kön är tom!");
      await interaction.reply(`Det är **${queue[0]}**s tur att köpa kaffe!`);
    }

    if (commandName === "done") {
      await removeFromQueue("coffee", who);
      await addToQueue("coffee", who);
      await addToHistory("coffee", who);

      const queue = await getQueue("coffee");
      await interaction.reply(`${who} har köpt kaffe. Nästa är **${queue[0]}**!`);
    }

    if (commandName === "history") {
      const result = await pool.query(`SELECT name FROM coffee_history ORDER BY id DESC LIMIT 20`);
      const list = result.rows.map((r) => r.name).join(", ") || "Ingen har köpt kaffe än!";
      await interaction.reply(`☕ Kaffehistorik: ${list}`);
    }

    // 🥛 MJÖLKKÖN
    if (commandName === "milkjoin") {
      await addToQueue("milk", who);
      await interaction.reply(`${who} har lagts till i mjölkkön!`);
    }

    if (commandName === "milkturn") {
      const queue = await getQueue("milk");
      if (queue.length === 0) return interaction.reply("Kön är tom!");
      await interaction.reply(`Det är **${queue[0]}**s tur att köpa mjölk!`);
    }

    if (commandName === "milkdone") {
      await removeFromQueue("milk", who);
      await addToQueue("milk", who);
      await addToHistory("milk", who);

      const queue = await getQueue("milk");
      await interaction.reply(`${who} har köpt mjölk. Nästa är **${queue[0]}**!`);
    }

    if (commandName === "milkhistory") {
      const result = await pool.query(`SELECT name FROM milk_history ORDER BY id DESC LIMIT 20`);
      const list = result.rows.map((r) => r.name).join(", ") || "Ingen har köpt mjölk än!";
      await interaction.reply(`🥛 Mjölkhistorik: ${list}`);
    }

    if (commandName === "warning") {
      const queue = await getQueue("coffee");
      await interaction.reply(
        `⚠️ Kaffet är nästan slut! Nästa är **${queue[0]}**!\nhttps://media3.giphy.com/media/BbJdwrOsM7nTa/giphy.gif`,
      );
    }

    if (commandName === "milkwarning") {
      const queue = await getQueue("milk");
      await interaction.reply(
        `🥛 Mjölken är nästan slut! Nästa är **${queue[0]}**!`,
      );
    }

  } catch (err) {
    console.error("❌ Fel vid kommando:", err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Något gick fel! 🚨", ephemeral: true });
    } else {
      await interaction.reply({ content: "Något gick fel! 🚨", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);