const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu() && !interaction.isButton()) return;

  // Panel de tickets
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticketsmenu') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Panel de Tickets')
      .setDescription('Selecciona el tipo de ticket que deseas abrir:')
      .setColor('#5865F2')
      .setFooter({ text: 'CypherHub Tickets' });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('Selecciona una opción...')
        .addOptions([
          { label: 'Soporte', value: 'soporte', emoji: '🛠️' },
          { label: 'Reporte', value: 'reporte', emoji: '⚠️' },
          { label: 'Ayuda', value: 'ayuda', emoji: '❓' }
        ])
    );

    await interaction.reply({ embeds: [embed], components: [menu] });
  }

  // Crear ticket según selección
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
    const tipo = interaction.values[0];
    const guild = interaction.guild;
    const nombre = `${tipo}-ticket-${interaction.user.username}`;

    // Buscar categoría
    const categoria = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase().includes(tipo));
    if (!categoria) return interaction.reply({ content: `❌ No encontré la categoría "${tipo}"`, ephemeral: true });

    const canal = await guild.channels.create({
      name: nombre,
      type: 0,
      parent: categoria.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
      ]
    });

    const embedTicket = new EmbedBuilder()
      .setTitle(`🎫 Ticket de ${tipo}`)
      .setDescription(
        `Gracias por abrir un ticket de **${tipo}**.\n\n` +
        `Por favor, espera pacientemente a que el equipo de soporte atienda tu solicitud.\n\n` +
        `🔔 Mientras tanto, describe tu problema o consulta con el mayor detalle posible.\n\n` +
        `⚡ Nuestro equipo hará lo posible por responderte lo antes posible.`
      )
      .setColor('#2ECC71')
      .setFooter({ text: 'CypherHub Tickets' });

    const botones = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Cerrar Ticket')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Reclamar Ticket')
        .setStyle(ButtonStyle.Success)
    );

    await canal.send({ content: `${interaction.user}`, embeds: [embedTicket], components: [botones] });
    await interaction.reply({ content: `✅ Ticket creado: ${canal}`, ephemeral: true });
  }

  // Botón cerrar ticket
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.channel.delete();
  }

  // Botón reclamar ticket
  if (interaction.isButton() && interaction.customId === 'claim_ticket') {
    await interaction.reply({ content: `🎯 Ticket reclamado por ${interaction.user}`, ephemeral: false });
  }
});

client.login(process.env.TOKEN);
