const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// Definimos el comando /ticketsmenu
const commands = [
  new SlashCommandBuilder()
    .setName('ticketsmenu')
    .setDescription('📋 Envía el panel de tickets (solo administradores)')
    .toJSON()
];

// Usamos el token desde Railway (process.env.TOKEN)
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // CLIENT_ID también viene de Railway
      { body: commands }
    );
    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error(error);
  }
})();
