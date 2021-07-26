const Discord = require("discord.js");

module.exports = {
	name: "help",
	description: "Displays available commands.",
	argsCount: 0,
	async execute(message) {
		let disc_embed = new Discord.MessageEmbed();
		disc_embed
			.setAuthor("Help ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
			.setTitle("Available Commands")
			.setColor("#89CFF0")
			.addFields(
				{ name: "Add Snipe", value: "Monitor section for openings.\n**Usage**: `" + process.env.PREFIX + " snipe index_number`" },
				{ name: "Remove Snipe", value: "Disables monitoring for section openings.\n**Usage**: `" + process.env.PREFIX + " unsnipe index_number`" },
				{ name: "Current Snipes", value: "Lists all monitoring sections.\n**Usage**: `" + process.env.PREFIX + " snipes`" },
				{ name: "Help", value: "Displays this message.\n**Usage**: `" + process.env.PREFIX + " help`" }
			);

		if (message.channel.type === "text") {
			disc_embed
				.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({
					format: "png",
					dynamic: true,
					size: 64
				}));
			await message.delete();
			await message.channel.send(`<@${message.author.id}>`, disc_embed);
		} else {
			await message.channel.send(disc_embed);
		}

		return;
	},
	async failure(message) {
		await this.execute(message);
		return;
	}
};