
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

const client_id = "YOUR_CLIENT_ID";
const bot_token = "YOUR_BOT_TOKEN";

async function registerCommands() {
	const commands = [];
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		commands.push(command.command.toJSON());
	}

	console.log('Attempting to register application commands.');
	const rest = new REST({ version: '9' }).setToken(bot_token);
	try {
		await rest.put(
			Routes.applicationCommands(client_id),
			{ body: commands },
		);
		console.log('Successfully registered application commands.');
		return Promise.resolve()
	} catch (error) {
		console.error(error);
		return Promise.reject(error)
	}
}

registerCommands()
    .catch(console.error);
