const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { canManageRoles, isRoleSafeToManage } = require('./roleGuard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a member')
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to remove the role from').setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to remove').setRequired(true),
    )
    .setDefaultMemberPermissions(null)
    .setDMPermission(false),

  async execute(interaction) {
    const member = interaction.member;

    if (!canManageRoles(member)) {
      return interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const targetRole = interaction.options.getRole('role', true);
    const targetUser = interaction.options.getUser('user', true);

    const botMember = await interaction.guild.members.fetchMe();
    const safety = isRoleSafeToManage(interaction.guild, targetRole, botMember);
    if (!safety.ok) {
      return interaction.reply({ content: `❌ ${safety.reason}`, ephemeral: true });
    }

    let targetMember;
    try {
      targetMember = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      return interaction.reply({
        content: "That user doesn't seem to be in this server.",
        ephemeral: true,
      });
    }

    if (!targetMember.roles.cache.has(targetRole.id)) {
      return interaction.reply({
        content: `${targetUser} doesn't have ${targetRole}.`,
        ephemeral: true,
      });
    }

    try {
      await targetMember.roles.remove(
        targetRole,
        `Removed by ${interaction.user.tag} via /removerole`,
      );
    } catch (err) {
      console.error('Failed to remove role:', err);
      return interaction.reply({
        content: '❌ Something went wrong removing that role. Check my role position and permissions.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(`✅ Removed ${targetRole} from ${targetUser}.`)
      .setFooter({ text: `Action by ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] });
  },
};
