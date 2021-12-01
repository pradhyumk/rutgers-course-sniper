const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const semester_text = require("../index.js").semester_text;

module.exports = {
	name: "help",
	description: "Displays available commands.",
	argsCount: 0,
	command: new SlashCommandBuilder().setName("help")
									  .setDescription("Displays available commands."),
	async execute(interaction) {
		let disc_embed = new MessageEmbed();
		disc_embed
			.setAuthor(`Help ● ${semester_text}`, "https://scarletknights.com/images/2020/9/30/BlackR.png")
			.setTitle("Available Commands")
			.setColor("#89CFF0")
			.addFields(
				{ name: "Add Snipe", value: "Monitor section for openings.\n**Usage**: `/snipe index_number`" },
				{ name: "Remove Snipe", value: "Disables monitoring for section openings.\n**Usage**: `/unsnipe index_number`" },
				{ name: "Current Snipes", value: "Lists all monitoring sections.\n**Usage**: `/snipes`" },
				{ name: "Help", value: "Displays this message.\n**Usage**: `/help`", inline: true},
				{ name: "Source Code", value: "[GitHub](https://github.com/pradhyumk/rutgers-course-sniper)", inline: true}
			)
			.setFooter("Made with ❤️ by Pradhyum Krishnan", "https://avatars.githubusercontent.com/u/11365510");

			const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setURL(`${process.env.BOT_INVITE_URL}`)
					.setLabel("INVITE BOT")
					.setStyle("LINK")
			);

		await interaction.reply({embeds: [disc_embed], components: [row]});
		return;
	},
	async failure(interaction) {
		await this.execute(interaction);
		return;
	}
};