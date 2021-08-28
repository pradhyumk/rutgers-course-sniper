const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: "unsnipe",
	description: "Remove a snipe request.",
	command: new SlashCommandBuilder().setName("unsnipe")
									  .setDescription("Disable notifications for section opening.")
									  .addIntegerOption((option) => 
										  option
										  		.setName("index_number")
												.setDescription("Enter the course index number.")
												.setRequired(true)
									  ),
	async execute(interaction, mongodb, mutex) {
		let disc_embed = new MessageEmbed()
			.setAuthor("Remove Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png");

		try {
			let sections = mongodb.db.collection("sections");
			let section = await sections.findOne({ "_id": `${interaction.options.getInteger("index_number")}` });

			if (!section) {
				disc_embed
					.setTitle("Invalid Index")
					.setDescription(`Index ${interaction.options.getInteger("index_number")} is not valid.`)
					.setColor("#FF5733");

				await interaction.reply({ embeds: [disc_embed], ephemeral: true })
				return
			}

			if (await this.remove_snipe(interaction.options.getInteger("index_number").toString(), interaction.user.id, mongodb, mutex)) {
				disc_embed
					.setTitle("Snipe removed!")
					.addFields(
						{ name: "Course", value: section.courseString, inline: true },
						{ name: "Section", value: section.section_number, inline: true },
						{ name: "Index", value: `${interaction.options.getInteger("index_number")}`, inline: true },
						{ name: "Instructor", value: (section.instructorsText || "Unavailable") },
					)
					.setColor("#27db84");
				await interaction.reply({embeds: [disc_embed]});
			} else {
				disc_embed
					.setTitle("Unknown Index")
					.setDescription(`You have no active snipe for index ${interaction.options.getInteger("index_number")}`)
					.setColor("#f5a856");

				await interaction.reply({ embeds: [disc_embed], ephemeral: true })
			}

		} catch (error) {
			console.error(error)
			const embed = new MessageEmbed().setTitle("An error occurred!")
				.setDescription(`Your request was not processed.`)
				.setColor("#FF5733");
			await interaction.reply({ embeds: [embed] })
		}
	},
	async unsnipe_button(interaction, mongodb, mutex) {
		const button_vals = interaction.customId.split("-");

		let sections = mongodb.db.collection("sections");
		let section = await sections.findOne({ "_id": button_vals[1] });

		let disc_embed = new MessageEmbed()
			.setAuthor("Remove Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png");
		
		if (await this.remove_snipe(button_vals[1], button_vals[2], mongodb, mutex)) {
			disc_embed
				.setTitle("Snipe removed!")
				.addFields(
					{ name: "Course", value: section.courseString, inline: true },
					{ name: "Section", value: section.section_number, inline: true },
					{ name: "Index", value: button_vals[1], inline: true },
					{ name: "Instructor", value: (section.instructorsText || "Unavailable") },
				)
			.setColor("#27db84");
			await interaction.reply({embeds: [disc_embed]});

		} else {
			disc_embed
				.setTitle("Unknown Index")
				.setDescription(`It seems like you have already unsniped index \`${button_vals[1]}\`.`)
				.setColor("#f5a856");

			await interaction.reply({ embeds: [disc_embed], ephemeral: true })
		}
	},
	async remove_snipe(index_number, user_id, mongodb, mutex) {
		const release = await mutex.acquire();

		let snipes = mongodb.db.collection("snipes");
		let search = await snipes.findOne({ "index": index_number });

		if (search && search.users.includes(user_id)) {
			try {
				if (search.users.length == 1) {
					await snipes.deleteOne({ index: index_number });
				}
				else if (search.users.includes(user_id)) {
					await snipes.updateOne({ index: index_number }, {
						$pull: {
							users: user_id
						}
					});
				}
			} catch(error) {
				console.error(error);
				release();
				return false;
			}
		} else {
			release()
			return false;
		}
		release();
		return true;
	}
};