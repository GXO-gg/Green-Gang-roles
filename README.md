# Role Bot

A small Discord bot with two slash commands, `/addrole` and `/removerole`,
built for one specific situation: you have a trusted "Admin" role that
does **not** carry real Discord permissions (so people with it can't grant
themselves or others anything dangerous), but you still want people with
that role to be able to hand out and remove your *regular* roles.

Guardrails built in:

- Only usable by people with real **Manage Roles** permission, or with the
  role ID you set as `ADMIN_ROLE_ID`.
- Refuses to touch **any role that has Administrator permission** — the
  bot will never add or remove an admin-level role, no matter who asks.
- Refuses to touch `@everyone`, bot/integration-managed roles, or any role
  positioned above the bot's own role (Discord won't allow that last one
  anyway).

## 1. Create the bot application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   and log in.
2. Click **New Application**, give it a name (e.g. "Role Bot"), accept the
   terms, and click **Create**.
3. In the left sidebar, open **Bot**.
   - Click **Reset Token** (or **Copy** if it's already generated) to get
     your bot token. Save it somewhere safe — you'll paste it into `.env`
     as `DISCORD_TOKEN`. Anyone with this token can control your bot, so
     never share it or commit it to a public repo.
   - Turn ON the **Server Members Intent** toggle under "Privileged Gateway
     Intents" — the bot needs this to look up members and their roles.
4. In the left sidebar, open **General Information** and copy the
   **Application ID** — this is your `CLIENT_ID`.

## 2. Invite the bot to your server

Build an invite URL using the OAuth2 URL Generator:

1. In the sidebar, open **OAuth2** → **URL Generator**.
2. Under **Scopes**, check `bot` and `applications.commands`.
3. Under **Bot Permissions**, check **Manage Roles** (that's the only
   permission it needs).
4. Copy the generated URL at the bottom, open it in your browser, pick
   your server, and authorize it.
5. In your server, go to **Server Settings → Roles** and drag the new
   bot's role **above** every role you want it to be able to manage (a
   bot can never manage a role positioned at or above its own role — this
   is a Discord-wide rule, not something this code can work around).
   Keep it below any role you never want it touching.

## 3. Get your Admin role's ID and your server ID

1. In Discord, go to **User Settings → Advanced** and turn on
   **Developer Mode**.
2. Right-click your server's icon → **Copy Server ID** → this is
   `GUILD_ID`.
3. Right-click your "Admin" role in **Server Settings → Roles** →
   **Copy Role ID** → this is `ADMIN_ROLE_ID`.

## 4. Configure the project

You'll need [Node.js 18+](https://nodejs.org) installed.

```bash
cd role-bot
npm install
cp .env.example .env
```

Open `.env` and fill in the four values you collected above:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
ADMIN_ROLE_ID=your-admin-role-id
```

(`GUILD_ID` is optional but recommended during setup — it makes slash
commands appear instantly instead of taking up to an hour to roll out
globally. You can remove it later if you want the bot in multiple
servers.)

## 5. Register the slash commands and start the bot

```bash
npm run deploy   # registers /addrole and /removerole with Discord
npm start        # logs the bot in
```

You should see `Logged in as <YourBot>#0000. Loaded 2 command(s).` in the
terminal. Back in Discord, type `/addrole` or `/removerole` in your
server.

## Usage

- `/addrole user:@Someone role:@SomeRole` — gives the role.
- `/removerole user:@Someone role:@SomeRole` — removes the role.

Both commands can be run by real server admins (Manage Roles permission)
or anyone holding the role you set as `ADMIN_ROLE_ID`. If someone without
either tries, or tries to add/remove an Administrator-permission role,
the bot replies with an explanation instead of doing anything.

## Keeping it running

`npm start` runs the bot in your current terminal — closing it stops the
bot. For a real deployment you have a few options:

- **A small VPS/server**: use [pm2](https://pm2.keymetrics.io/)
  (`npm install -g pm2 && pm2 start index.js --name role-bot`) so it
  restarts automatically and survives reboots.
- **A hosting platform** like Railway, Render, or Fly.io: push this
  folder as a repo, set the same `.env` values as environment variables
  in their dashboard, and set the start command to `npm start`.

## Adding more commands later

Drop a new file in `commands/` following the same shape as
`commands/addrole.js` (a `data` SlashCommandBuilder and an `execute`
function), then run `npm run deploy` again to register it.
