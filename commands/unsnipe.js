const Discord = require("discord.js");

module.exports = {
	name: "unsnipe",
	description: "Remove a snipe request.",
	usage: `${process.env.PREFIX} unsnipe index_number`,
	argsCount: 1,
	async execute(message, mongodb, args) {
		if (isNaN(args[0]) === true) {
			await this.failure(message);
			return;
		}

		let disc_embed = new Discord.MessageEmbed()
			.setAuthor("Remove Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png");

		try {
			let sections = mongodb.db.collection("sections");
			let section = await sections.findOne({ "_id": args[0] });

			let snipes = mongodb.db.collection("snipes");
			let search = await snipes.findOne({ "index": args[0] });

			if (search && search.users.includes(message.author.id)) {
				if (search.users.length == 1) {
					await snipes.deleteOne({ index: args[0] });
				}
				else if (search.users.includes(message.author.id)) {
					await snipes.updateOne({ index: args[0] }, {
						$pull: {
							users: message.author.id
						}
					});
				}
				disc_embed
					.setTitle("Snipe removed!")
					.addFields(
						{ name: "Course", value: section.courseString, inline: true },
						{ name: "Section", value: section.section_number, inline: true },
						{ name: "Index", value: args[0], inline: true },
						{ name: "Instructor", value: (section.instructorsText || "Unavailable") },
					)
					.setColor("#27db84");
			} else {
				disc_embed
					.setTitle("Invalid index")
					.setDescription(`You have no active snipe for index ${args[0]}`)
					.setColor("#f5a856");
			}

			if (message.channel.type === "text") {
				disc_embed.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({
					format: "png",
					dynamic: true,
					size: 64
				}));

				await message.delete();
				await message.channel.send(`<@${message.author.id}>`, disc_embed);
			} else {
				await message.channel.send(disc_embed);
			}
		} catch (error) {
			console.error(error);
			message.reply("Your request was unsuccessful!");
		}
	},
	async failure(message) {
		let disc_embed = new Discord.MessageEmbed();
		disc_embed
			.setAuthor("Remove Snipe ● Fall 2021", "https://scarletknights.com/images/2020/9/30/BlackR.png")
			.setTitle("Invalid arguments!")
			.addFields(
				{ name: "Description", value: this.description },
				{ name: "Usage", value: "`" + this.usage + "`" }
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