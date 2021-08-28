const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: "snipes",
	description: "Displays active snipes for user.",
	command: new SlashCommandBuilder().setName("snipes")
									  .setDescription("Displays active snipes."),
	async execute(interaction, mongodb) {
		let snipes = mongodb.db.collection("snipes");
		let sections = mongodb.db.collection("sections");
		let courses = mongodb.db.collection("courses");

		let user_snipes = await snipes.find(
			{
				"users": {
					$all: [interaction.user.id]
				}
			}).toArray();

		let result = "";

		for (const s of user_snipes) {
			let snipe = await sections.findOne({ "_id": s.index });
			let course = await courses.findOne({ "_id": snipe.courseString });
			result += `\`${s.index}\` - ${course.title} (Section ${snipe.section_number})\n`;
		}

		let disc_embed = new MessageEmbed();

		if (user_snipes.length !== 0) {
			disc_embed
				.setAuthor("Snipes ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
				.setTitle("Sections Monitoring")
				.setColor("#89CFF0")
				.setDescription(result);
		} else {
			disc_embed
				.setAuthor("Snipes ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
				.setTitle("No sections are monitored!")
				.setColor("#f5a856")
				.setDescription("Add an index to start monitoring for openings.");
		}
		await interaction.reply({ embeds: [disc_embed]})
	},
	async failure(message, mongodb) {
		await this.execute(message, mongodb);
		return;
	}
};