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
    console.log('🔄 Registrando comandos en el servidor...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,      // ID de la aplicación
        process.env.GUILD_ID        // ID de tu servidor (guild)
      ),
      { body: commands }
    );
    console.log('✅ Comando /ticketsmenu registrado en tu servidor.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
  }
})();
