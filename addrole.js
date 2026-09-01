const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { canManageRoles, isRoleSafeToManage } = require('../utils/roleGuard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Give a role to a member')
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to give the role to').setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to give').setRequired(true),
    )
    // Hide the command entirely from members without base Manage Roles perm.
    // Our own canManageRoles() check below is what actually lets the
    // ADMIN_ROLE_ID role use it despite Discord hiding it by default;
    // setDefaultMemberPermissions only controls default visibility, not
    // enforcement, so we still gate execution with our own check.
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

    if (targetMember.roles.cache.has(targetRole.id)) {
      return interaction.reply({
        content: `${targetUser} already has ${targetRole}.`,
        ephemeral: true,
      });
    }

    try {
      await targetMember.roles.add(
        targetRole,
        `Added by ${interaction.user.tag} via /addrole`,
      );
    } catch (err) {
      console.error('Failed to add role:', err);
      return interaction.reply({
        content: '❌ Something went wrong adding that role. Check my role position and permissions.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(`✅ Gave ${targetRole} to ${targetUser}.`)
      .setFooter({ text: `Action by ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] });
  },
};
