const { PermissionFlagsBits } = require('discord.js');
const { readPermittedRoleIds } = require('./permissionStore');

/**
 * The full list of role IDs allowed to use /addrole and /removerole:
 * the ones set in ADMIN_ROLE_IDS (comma-separated env var, set once at
 * deploy time) PLUS any roles head admins have granted access to at
 * runtime with /permitrole (persisted in permissionStore).
 */
function getAdminRoleIds() {
  const fromEnv = (process.env.ADMIN_ROLE_IDS || process.env.ADMIN_ROLE_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const fromStore = readPermittedRoleIds();
  return Array.from(new Set([...fromEnv, ...fromStore]));
}

/**
 * Returns true if `member` is allowed to run the role commands.
 * Allowed if they have real Manage Roles permission (server admins/owners),
 * OR if they hold ANY of the role IDs from getAdminRoleIds() above.
 */
function canManageRoles(member) {
  if (member.permissions.has(PermissionFlagsBits.ManageRoles)) return true;

  const adminRoleIds = getAdminRoleIds();
  return adminRoleIds.some((id) => member.roles.cache.has(id));
}

/**
 * "Head admin" = has real Administrator permission (the server owner, or
 * anyone with a genuinely privileged role). Only head admins can grant or
 * revoke other roles' access to the role commands via /permitrole and
 * /revokerole - granting that access is more sensitive than using it.
 */
function isHeadAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Checks whether `targetRole` is safe for this bot to add/remove.
 * Returns { ok: true } or { ok: false, reason: string }.
 *
 * Blocks:
 *  - @everyone
 *  - Roles with the Administrator permission (the whole point of this bot
 *    is that the trusted role can never grant/revoke real admin power)
 *  - Managed roles (bot roles, boost roles, integration roles) - Discord
 *    doesn't allow manually assigning these anyway
 *  - Roles at or above the bot's own highest role (Discord's hierarchy
 *    rule - the bot physically cannot manage these)
 */
function isRoleSafeToManage(guild, targetRole, botMember) {
  if (targetRole.id === guild.id) {
    return { ok: false, reason: "You can't add or remove @everyone." };
  }

  if (targetRole.permissions.has(PermissionFlagsBits.Administrator)) {
    return {
      ok: false,
      reason: 'That role has Administrator permission, so this bot will never add or remove it.',
    };
  }

  if (targetRole.managed) {
    return {
      ok: false,
      reason: 'That role is managed by an integration or bot and cannot be manually assigned.',
    };
  }

  if (targetRole.position >= botMember.roles.highest.position) {
    return {
      ok: false,
      reason:
        "That role is positioned above (or equal to) my highest role, so Discord won't let me manage it. Move my bot role higher in Server Settings > Roles.",
    };
  }

  return { ok: true };
}

module.exports = { canManageRoles, isRoleSafeToManage, getAdminRoleIds, isHeadAdmin };
