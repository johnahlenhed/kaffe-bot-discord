import { Client, GatewayIntentBits } from "discord.js";
import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const queries = `
  CREATE TABLE IF NOT EXISTS coffee_queue (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS coffee_history (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    bought_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS milk_queue (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS milk_history (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    bought_at TIMESTAMP DEFAULT NOW()
  );
  `;
  try {
    await pool.query(queries);
    console.log("✅ Databastabeller redo!");
  } catch (err) {
    console.error("❌ Fel vid tabellskapande:", err);
  }
}

// Kör initiering direkt
initDB();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ✅ Hjälpfunktioner
async function getQueue(table) {
  const res = await pool.query(`SELECT username FROM ${table} ORDER BY joined_at ASC`);
  return res.rows.map(r => r.username);
}

async function addToQueue(table, username) {
  await pool.query(
    `INSERT INTO ${table}(username) VALUES ($1)
     ON CONFLICT (username) DO NOTHING`,
    [username]
  );
}

async function moveToBack(table, username, historyTable) {
  await pool.query(`DELETE FROM ${table} WHERE username=$1`, [username]);
  await pool.query(`INSERT INTO ${table}(username) VALUES ($1)`, [username]);
  await pool.query(`INSERT INTO ${historyTable}(username) VALUES ($1)`, [username]);
}

async function getHistory(table) {
  const res = await pool.query(`SELECT username FROM ${table} ORDER BY bought_at ASC`);
  return res.rows.map(r => r.username);
}

// ✅ När boten startar
client.once("ready", () => {
  console.log(`☕️ Botten är online som ${client.user.tag}`);
});

// ✅ Hantera kommandon
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const who = interaction.member?.displayName || interaction.user.username;

  try {
    switch (interaction.commandName) {
      case "turn": {
        const queue = await getQueue("coffee_queue");
        await interaction.reply(
          queue.length
            ? `Det är **${queue[0]}**s tur att köpa kaffe!`
            : "Ingen är i kaffekön ☕"
        );
        break;
      }

      case "done": {
        await moveToBack("coffee_queue", who, "coffee_history");
        const queue = await getQueue("coffee_queue");
        await interaction.reply(
          `${who} har köpt kaffe! Nästa i tur är **${queue[0] || "ingen"}** ☕`
        );
        break;
      }

      case "join": {
        await addToQueue("coffee_queue", who);
        const queue = await getQueue("coffee_queue");
        await interaction.reply(`${who} är nu med i kaffekön! Du är plats ${queue.length}.`);
        break;
      }

      case "history": {
        const history = await getHistory("coffee_history");
        await interaction.reply(
          history.length
            ? `☕ Kaffehistorik: ${history.join(", ")}`
            : "Ingen har köpt kaffe än!"
        );
        break;
      }

      case "warning": {
        const queue = await getQueue("coffee_queue");
        await interaction.reply(
          `Kaffet är nästan slut! Nästa i tur är **${queue[0] || "ingen"}**! ☕`
        );
        break;
      }

      // 🥛 Mjölk-kommandon
      case "milkturn": {
        const queue = await getQueue("milk_queue");
        await interaction.reply(
          queue.length
            ? `Det är **${queue[0]}**s tur att köpa mjölk! 🥛`
            : "Ingen är i mjölkkön!"
        );
        break;
      }

      case "milkdone": {
        await moveToBack("milk_queue", who, "milk_history");
        const queue = await getQueue("milk_queue");
        await interaction.reply(
          `${who} har köpt mjölk! Nästa i tur är **${queue[0] || "ingen"}** 🥛`
        );
        break;
      }

      case "milkjoin": {
        await addToQueue("milk_queue", who);
        const queue = await getQueue("milk_queue");
        await interaction.reply(`${who} är nu med i mjölkkön! Du är plats ${queue.length}.`);
        break;
      }

      case "milkhistory": {
        const history = await getHistory("milk_history");
        await interaction.reply(
          history.length
            ? `🥛 Mjölkhistorik: ${history.join(", ")}`
            : "Ingen har köpt mjölk än!"
        );
        break;
      }

      case "milkwarning": {
        const queue = await getQueue("milk_queue");
        await interaction.reply(
          `Mjölken är nästan slut! Nästa i tur är **${queue[0] || "ingen"}**! 🥛`
        );
        break;
      }

      default:
        await interaction.reply("Okänt kommando.");
    }
  } catch (err) {
    console.error("❌ Fel vid kommando:", err);
    await interaction.reply({
      content: "Något gick fel! 🚨",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("☕️ Kaffe-boten är vaken och brygger!");
});

app.listen(PORT, () => {
  console.log(`🌐 Webserver igång på port ${PORT}`);
});