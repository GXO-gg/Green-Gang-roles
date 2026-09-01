// Persists the list of role IDs that head admins have granted access to,
// on top of whatever is set in the ADMIN_ROLE_IDS environment variable.
// Stored as a small JSON file so it survives bot restarts.
//
// IMPORTANT: on Railway (and most hosts), a plain file like this resets
// when the service is *redeployed* (a new build), even though it survives
// ordinary restarts/crashes in between. For it to survive redeploys too,
// mount a Railway Volume at the path this points to (see README).
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'permitted-roles.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]), 'utf8');
}

function readPermittedRoleIds() {
  try {
    ensureFile();
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch (err) {
    console.error('Failed to read permitted-roles.json:', err);
    return [];
  }
}

function writePermittedRoleIds(ids) {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(ids, null, 2), 'utf8');
}

/** Adds a role ID. Returns true if it was newly added, false if already present. */
function addPermittedRole(roleId) {
  const ids = readPermittedRoleIds();
  if (ids.includes(roleId)) return false;
  ids.push(roleId);
  writePermittedRoleIds(ids);
  return true;
}

/** Removes a role ID. Returns true if it was removed, false if it wasn't there. */
function removePermittedRole(roleId) {
  const ids = readPermittedRoleIds();
  const next = ids.filter((id) => id !== roleId);
  if (next.length === ids.length) return false;
  writePermittedRoleIds(next);
  return true;
}

module.exports = { readPermittedRoleIds, addPermittedRole, removePermittedRole };
