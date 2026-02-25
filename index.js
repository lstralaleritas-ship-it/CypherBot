const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');
const express = require('express');

// --- Manejo global de errores ---
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

// --- Servidor Express para Railway ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('✅ Bot CypherHub Tickets está corriendo'));
app.listen(PORT, () => console.log(`🌐 Página web activa en puerto ${PORT}`));

// --- Cliente de Discord ---
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
      .setTitle('🎫 Panel de Tickets - CypherHub')
      .setDescription(
        'Bienvenido al sistema de soporte de **CypherHub**.\n\n' +
        'Aquí puedes abrir un ticket según tu necesidad:\n\n' +
        '🛠️ **Soporte** → Para problemas técnicos, dudas sobre bots o asistencia en configuraciones.\n\n' +
        '⚠️ **Reporte** → Para informar errores, abusos o situaciones que requieran atención del staff.\n\n' +
        '❓ **Ayuda** → Para consultas generales, orientación o preguntas sobre la comunidad.\n\n' +
        'Selecciona la opción adecuada y se abrirá un canal privado para atender tu solicitud.'
      )
      .setColor('#9B59B6') // Morado
      .setFooter({ text: 'CypherHub Tickets - Tu soporte confiable' });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('Selecciona una categoría...')
        .addOptions([
          { label: 'Soporte', value: 'soporte', emoji: '🛠️', description: 'Asistencia técnica y dudas sobre bots' },
          { label: 'Reporte', value: 'reporte', emoji: '⚠️', description: 'Informar errores o abusos' },
          { label: 'Ayuda', value: 'ayuda', emoji: '❓', description: 'Consultas generales y orientación' }
        ])
    );

    await interaction.reply({ embeds: [embed], components: [menu] });
  }

  // Crear ticket según selección
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
    try {
      const tipo = interaction.values[0];
      const guild = interaction.guild;
      const nombre = `${tipo}-ticket-${interaction.user.username}`;

      await interaction.deferReply({ ephemeral: true }); // evita timeout

      const categoria = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase().includes(tipo));
      if (!categoria) return interaction.editReply({ content: `❌ No encontré la categoría "${tipo}"` });

      const canal = await guild.channels.create({
        name: nombre,
        type: 0,
        parent: categoria.id,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });

      await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });

      const embedTicket = new EmbedBuilder()
        .setTitle(`🎫 Ticket de ${tipo} - CypherHub`)
        .setDescription(
          `Has abierto un ticket de **${tipo}**.\n\n` +
          (tipo === 'soporte'
            ? '🛠️ Nuestro equipo técnico revisará tu problema y te dará asistencia personalizada.'
            : tipo === 'reporte'
            ? '⚠️ Gracias por tu reporte. El staff analizará la situación y tomará medidas.'
            : '❓ Aquí puedes plantear tus dudas o pedir orientación. El equipo de CypherHub te responderá pronto.') +
          '\n\n🔔 Describe tu caso con detalle para que podamos ayudarte mejor.'
        )
        .setColor('#9B59B6')
        .setFooter({ text: 'CypherHub Tickets - Tu soporte confiable' });

      const botones = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar Ticket').setStyle(ButtonStyle.Success)
      );

      await canal.send({ content: `${interaction.user}`, embeds: [embedTicket], components: [botones] });
    } catch (error) {
      console.error('❌ Error creando ticket:', error);
      await interaction.editReply({ content: '❌ Hubo un error al crear el ticket.' });
    }
  }

  // Botón cerrar ticket
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    try {
      await interaction.channel.delete();
    } catch (error) {
      console.error('❌ Error cerrando ticket:', error);
    }
  }

  // Botón reclamar ticket
  if (interaction.isButton() && interaction.customId === 'claim_ticket') {
    await interaction.reply({ content: `🎯 Ticket reclamado por ${interaction.user}`, ephemeral: false });
  }
});

client.login(process.env.TOKEN);
