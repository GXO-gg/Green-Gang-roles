const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isHeadAdmin } = require('./roleGuard');
const { addPermittedRole } = require('./permissionStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permitrole')
    .setDescription('Let a role use /addrole and /removerole (head admins only)')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role to grant role-management access to')
        .setRequired(true),
    )
    // Hidden from members without Administrator by default; we still
    // double-check with isHeadAdmin() below since default permissions are
    // just a UI hint, not real enforcement.
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    if (!isHeadAdmin(interaction.member)) {
      return interaction.reply({
        content: 'Only server admins (real Administrator permission) can grant this.',
        ephemeral: true,
      });
    }

    const targetRole = interaction.options.getRole('role', true);

    if (targetRole.id === interaction.guild.id) {
      return interaction.reply({
        content: "You can't grant this to @everyone.",
        ephemeral: true,
      });
    }

    if (targetRole.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'That role already has real Administrator permission, so it can already do this.',
        ephemeral: true,
      });
    }

    const added = addPermittedRole(targetRole.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setDescription(
        added
          ? `✅ ${targetRole} can now use /addrole and /removerole.`
          : `${targetRole} already had access.`,
      )
      .setFooter({ text: `Granted by ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] });
  },
};
