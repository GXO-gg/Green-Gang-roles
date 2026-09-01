const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isHeadAdmin } = require('../utils/roleGuard');
const { removePermittedRole } = require('../utils/permissionStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('revokerole')
    .setDescription('Take away a role\'s access to /addrole and /removerole (head admins only)')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role to revoke role-management access from')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    if (!isHeadAdmin(interaction.member)) {
      return interaction.reply({
        content: 'Only server admins (real Administrator permission) can revoke this.',
        ephemeral: true,
      });
    }

    const targetRole = interaction.options.getRole('role', true);
    const removed = removePermittedRole(targetRole.id);

    if (!removed) {
      return interaction.reply({
        content: `${targetRole} wasn't granted access via /permitrole (it may only have access through the ADMIN_ROLE_IDS variable or real Manage Roles permission, which this command can't change).`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(`✅ ${targetRole} can no longer use /addrole and /removerole.`)
      .setFooter({ text: `Revoked by ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] });
  },
};
