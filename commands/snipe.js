const Discord = require("discord.js");

module.exports = {
	name: "snipe",
	description: "Adds course snipe to database for checking.",
	usage: `${process.env.PREFIX} snipe index_number`,
	argsCount: 1,
	async execute(message, mongodb, args) {
		if (isNaN(args[0]) === true) {
			await this.failure(message);
			return;
		} 

		let disc_embed = new Discord.MessageEmbed()
			.setAuthor("Add Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png");

		let sections = mongodb.db.collection("sections");
		let section = await sections.findOne({ "_id": args[0] });

		if (!section) {
			disc_embed.setTitle("Invalid index!")
				.setDescription(`Index ${args[0]} does not exist.`)
				.setColor("#f5a856");

			if (message.channel.type === "text") {
				await message.delete();
				disc_embed.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({
					format: "png",
					dynamic: true,
					size: 64
				}));
				await message.channel.send(`<@${message.author.id}>`, disc_embed);
			} else {
				await message.channel.send(disc_embed);
			}
			return;
		}

		let snipes = mongodb.db.collection("snipes");
		let search = await snipes.findOne({ "index": args[0] });

		try {
			if (search) {
				if (search.users.includes(message.author.id)) {
					disc_embed.setTitle("Index already exists!")
						.setDescription(`Index ${args[0]} is actively being checked.`)
						.setColor("#f5a856");

					if (message.channel.type === "text") {
						await message.delete();
						disc_embed.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({
							format: "png",
							dynamic: true,
							size: 64
						}));
						await message.channel.send(`<@${message.author.id}>`, disc_embed);
					} else {
						await message.channel.send(disc_embed);
					}
					return;
				}

				await snipes.updateOne({ "index": args[0] }, {
					"$push": {
						"users": message.author.id
					}
				});

			} else {
				await snipes.insertOne({
					index: args[0],
					status: "closed",
					users: [message.author.id]
				});
			}

		} catch (error) {
			console.error(error);
			await message.reply("An error occurred while updating the database.");
			return;
		}

		disc_embed.setTitle("Snipe added!")
			.addFields(
				{ name: "Course", value: section.courseString, inline: true },
				{ name: "Section", value: section.section_number, inline: true },
				{ name: "Index", value: args[0], inline: true },
				{ name: "Instructor", value: section.instructorsText }
			)
			.setColor("#27db84");

		try {
			await message.author.send(disc_embed);
		} catch (error) {
			if (error.code === 50007) {
				disc_embed.setTitle("DMs disabled!")
					.setDescription("Your snipe request has been added but you will not receive course open notifications until you enable direct messages for this server.")
					.setColor("#f5a856");

				await message.channel.send(`<@${message.author.id}>`, disc_embed);
				return;

			}
		}

		if (message.channel.type === "text") {
			await message.delete();
			let disc_embed2 = new Discord.MessageEmbed()
				.setTitle("Check DMs")
				.setDescription("Notifications for course openings will be sent via direct message.")
				.setAuthor("Add Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
				.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({
					format: "png",
					dynamic: true,
					size: 64
				}));

			await message.channel.send(`<@${message.author.id}>`, disc_embed2);
		}
	},
	async failure(message) {
		let disc_embed = new Discord.MessageEmbed();
		disc_embed
			.setAuthor("Add Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
			.setTitle("Invalid arguments!")
			.addFields(
				{name: "Description", value: this.description},
				{name: "Usage", value: "`" + this.usage + "`"}
			)
			.setColor("#f5a856");

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
	}
};