const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require("axios").default;
const semester_text = require("../index.js").semester_text;

module.exports = {
	name: "snipe",
	description: "Monitor index for openings.",
	command: new SlashCommandBuilder().setName("snipe")
		.setDescription("Get notified for a section opening.")
		.addStringOption((option) =>
			option
				.setName("index_number")
				.setDescription("Enter the section index number.")
				.setRequired(true)
		),
	async execute(interaction, mongodb, mutex) {
		let disc_embed = new MessageEmbed()
			.setAuthor(`Add Snipe ● ${semester_text}`, "https://scarletknights.com/images/2020/9/30/BlackR.png");

		if (isNaN(interaction.options.getString("index_number"))) {
			disc_embed
				.setTitle("Invalid entry")
				.setDescription(`\`${interaction.options.getString("index_number")}\` is not a valid number.`)
				.setColor("#FF5733");

			await interaction.reply({ embeds: [disc_embed], ephemeral: true })
			return;
		}
		
		try {
			open_sections = (await axios.get(`https://sis.rutgers.edu/soc/api/openSections.json?year=${process.env.ACADEMIC_YEAR}&term=${process.env.ACADEMIC_TERM}&campus=NB`)).data;
			if (open_sections.includes(interaction.options.getString("index_number"))) {
				disc_embed
					.setTitle("Course Open!")
					.setDescription("This section is already open! You can request notifications when this section is closed.")
					.setColor("#27db84")
					.setFields({ name: "Index", value: `${interaction.options.getString("index_number")}`, inline: true });

				await interaction.reply({ embeds: [disc_embed]})
				return;
			}
		} catch (error) {
			if (error.code !== "ECONNRESET") {	
				console.error(error);
				const embed = new MessageEmbed().setTitle("An error occurred!")
					.setDescription(`Your request was not processed.`)
					.setColor("#FF5733");
				await interaction.reply({ embeds: [embed]});
				return;

			}
		}

		const release = await mutex.acquire();
		let sections = mongodb.db.collection("sections");
		let section = await sections.findOne({ "_id": `${interaction.options.getString("index_number")}` });

		if (!section) {
			disc_embed.setTitle("Invalid index!")
				.setDescription(`Index \`${interaction.options.getString("index_number")}\` does not exist.`)
				.setColor("#f5a856");

			await interaction.reply({ embeds: [disc_embed], ephemeral: true})
			release();
			return;
		}

		let snipes = mongodb.db.collection("snipes");
		let search = await snipes.findOne({ "index": interaction.options.getString("index_number") });

		try {
			if (search) {
				if (search.users.includes(interaction.user.id)) {
					disc_embed.setTitle("Index already exists!")
						.setDescription(`Index \`${interaction.options.getString("index_number")}\` is actively being checked.`)
						.setColor("#f5a856");

					await interaction.reply({ embeds: [disc_embed], ephemeral: true })
					release();
					return;
				}

				await snipes.updateOne({ "index": `${interaction.options.getString("index_number")}` }, {
					"$push": {
						"users": interaction.user.id
					}
				});

			} else {
				await snipes.insertOne({
					index: `${interaction.options.getString("index_number")}`,
					status: "closed",
					users: [interaction.user.id]
				});
			}

		} catch (error) {
			console.error(error);
			const embed = new MessageEmbed().setTitle("An error occurred!")
				.setDescription(`The database did not update your request.`)
				.setColor("#FF5733");
			await interaction.reply({ embeds: [embed]});
			release();
			return;
		}

		const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId(`unsnipe-${interaction.options.getString("index_number")}-${interaction.user.id}`)
				.setStyle("DANGER")
				.setLabel("UNSNIPE")
		);

		disc_embed.setTitle("Snipe added!")
			.addFields(
				{ name: "Course", value: section.courseString, inline: true },
				{ name: "Section", value: section.section_number, inline: true },
				{ name: "Index", value: interaction.options.getString("index_number"), inline: true },
				{ name: "Instructor", value: (section.instructorsText || "Unavailable") }
			)
			.setColor("#27db84");

		try {
			await interaction.user.send({embeds: [disc_embed], components: [row]});
		} catch (error) {
			if (error.code === 50007) {
				disc_embed.setTitle("Request added, but DMs are disabled!")
					.setDescription("The bot will not be able to message you until you allow DMs for this server.")
					.setColor("#f5a856");

				await interaction.reply({ embeds: [disc_embed]});
				release();
				return;

			}
		}

		let disc_embed2 = new MessageEmbed()
			.setTitle("Check DMs")
			.setDescription("Notifications for course openings will be sent via direct message.")
			.setAuthor(`Add Snipe ● ${semester_text}`, "https://scarletknights.com/images/2020/9/30/BlackR.png");

			await interaction.reply({ embeds: [disc_embed2]});
			release();

	}
};