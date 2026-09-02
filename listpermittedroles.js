const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isHeadAdmin, getAdminRoleIds } = require('./roleGuard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listpermittedroles')
    .setDescription('Show which roles can use /addrole and /removerole (head admins only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    if (!isHeadAdmin(interaction.member)) {
      return interaction.reply({
        content: 'Only server admins (real Administrator permission) can view this.',
        ephemeral: true,
      });
    }

    const roleIds = getAdminRoleIds();
    const lines = roleIds
      .map((id) => interaction.guild.roles.cache.get(id))
      .filter(Boolean)
      .map((role) => `• ${role}`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Roles permitted to use /addrole and /removerole')
      .setDescription(
        lines.length
          ? lines.join('\n')
          : 'No roles are currently permitted (besides real server admins).',
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
