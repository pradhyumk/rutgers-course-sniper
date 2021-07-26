const Discord = require("discord.js");

module.exports = {
	name: "snipes",
	description: "Displays active snipes for user.",
	usage: `${process.env.PREFIX} snipes`,
	argsCount: 0,
	async execute(message, mongodb) {
		let snipes = mongodb.db.collection("snipes");
		let sections = mongodb.db.collection("sections");
		let courses = mongodb.db.collection("courses");

		let user_snipes = await snipes.find(
			{
				"users": {
					$all: [message.author.id]
				}
			}).toArray();

		let result = "";

		for (const s of user_snipes) {
			let snipe = await sections.findOne({ "_id": s.index });
			let course = await courses.findOne({ "_id": snipe.courseString });
			result += `\`${s.index}\` - ${course.title} (Section ${snipe.section_number})\n`;
		}

		let disc_embed = new Discord.MessageEmbed();

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

	},
	async failure(message, mongodb) {
		await this.execute(message, mongodb);
		return;
	}
};