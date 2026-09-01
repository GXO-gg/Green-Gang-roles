require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const { DISCORD_TOKEN, ADMIN_ROLE_ID } = process.env;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in your .env file. See .env.example.');
  process.exit(1);
}
if (!ADMIN_ROLE_ID) {
  console.warn(
    'Warning: ADMIN_ROLE_ID is not set. Only members with real "Manage Roles" ' +
      'permission will be able to use /addrole and /removerole.',
  );
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name && typeof command.execute === 'function') {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`Skipping ${file}: missing "data" or "execute" export.`);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}. Loaded ${client.commands.size} command(s).`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing /${interaction.commandName}:`, err);
    const errorReply = {
      content: 'There was an error while running this command.',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply).catch(() => {});
    } else {
      await interaction.reply(errorReply).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);
