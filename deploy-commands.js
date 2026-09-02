// Registers (or updates) this bot's slash commands with Discord.
// Run this once initially, and again any time you add/change a command.
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in your .env file. See .env.example.');
  process.exit(1);
}

// Same list as index.js - every command file lives at the project root.
const commandModules = [
  require('./addrole'),
  require('./removerole'),
  require('./permitrole'),
  require('./revokerole'),
  require('./listpermittedroles'),
];

const commands = commandModules.filter((c) => c?.data).map((c) => c.data.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash command(s)...`);

    if (GUILD_ID) {
      // Guild-scoped commands show up instantly - best while developing.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`Registered commands for guild ${GUILD_ID}.`);
    } else {
      // Global commands can take up to an hour to propagate.
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('Registered global commands (may take up to an hour to appear everywhere).');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
