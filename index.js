const axios = require("axios").default;
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");
const database = require("./database.js");
const { Mutex } = require("async-mutex");

const mutex = {
	snipe: new Mutex(),
	unsnipe: new Mutex()
}

dotenv.config();
const client = new Client({
	intents:
		[
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_PRESENCES,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_MEMBERS,
			Intents.FLAGS.GUILD_INTEGRATIONS,
			Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.DIRECT_MESSAGE_TYPING
		],
	 partials: ['USER', 'GUILD_MEMBER', 'MESSAGE', 'CHANNEL', 'REACTION'] });

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const prefix = process.env.PREFIX;

client.on("interactionCreate", async interaction => {
	if (interaction.isCommand()) {
		let m = null;
		if (mutex.hasOwnProperty(interaction.commandName))
			m = mutex[interaction.commandName];

		try {
			if (!commandFiles.includes(interaction.commandName + ".js")) {
				const command = require(`./commands/help.js`)
				await command.execute(interaction);
				return;
			} else {
				const command = require(`./commands/${interaction.commandName}.js`)
				await command.execute(interaction, mongodb, m);
			}
		} catch (error) {
			console.error(error)
			const embed = new MessageEmbed().setTitle("An error occurred!")
				.setDescription(`Your request was not processed.`)
				.setColor("#FF5733");
			await interaction.reply({ embeds: [embed]});
		}
	} else if (interaction.isButton()) {
		const button_vals = interaction.customId.split("-"); // command-index-userid
		let m = null;
		if (mutex.hasOwnProperty(button_vals[0])) {
			m = mutex[button_vals[0]];
		}

		if (button_vals[0] === "unsnipe") {
			const command = require(`./commands/unsnipe.js`)
			await command.unsnipe_button(interaction, mongodb, mutex.unsnipe);
		}
	}
})

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;

	if (message.content.startsWith(prefix)) {
		// Legacy commands are no longer supported. 
		const disc_embed = new MessageEmbed()
								.setColor("#f5a856")
								.setTitle("Use Slash `/` Commands.")
								.setDescription(`Legacy commands with the \`${prefix}\` prefix are no longer supported.`);
		
		if (message.guild !== null) {
			disc_embed
				.addFields({ name: "Server Owners", value: `If you cannot see the slash commands, [reinvite](${process.env.BOT_INVITE_URL}) the bot to add the appropiate permissions.`} );
		}
		await message.reply({ embeds: [disc_embed] });
		return;
	}
});

client.once("ready", async () => {
	console.log("The Discord bot is ready!");
	client.user.setActivity("Schedule of Classes", { type: "WATCHING" });
	client.user.setStatus("online");

	const commands = await client.application.commands.fetch();
	
	if (commands.size > 0) {
		console.log("Registered Global Commands: ")
		commands.forEach((value, key) => {
			console.log(`Command: ${value.name} (ID: ${key})`);
		})
	}	

	let open_sections;

	await check_open_courses();
	async function check_open_courses() {
		// console.log("Interval started!");
		try {
			open_sections = (await axios.get("https://sis.rutgers.edu/soc/api/openSections.json?year=2021&term=9&campus=NB")).data;
		} catch (err) {
			if (err.code === "ECONNRESET") console.error("Open courses endpoint connection reset!");
			// console.log("Interval finished!");
			setTimeout(check_open_courses, 6000);
			return;
		}

		let snipes = mongodb.db.collection("snipes");
		let cursor = snipes.find();

		let item;
		while ((item = await cursor.next())) {
			if (!open_sections.includes(item.index) && item.status === "open") {
				console.log(`Index ${item.index} has been closed :(`);
				await snipes.updateOne({ "index": item.index }, {
					"$set": {
						"status": "closed"
					}
				});
				continue;
			}
			else if (!open_sections.includes(item.index) && item.status === "closed") {
				// console.log(`Index ${item.index} is currently closed.`);
				continue;
			}
			else if (open_sections.includes(item.index) && item.status === "open") {
				// console.log(`Notified users already that index ${item.index} is open.`);
				continue;
			}
			else {
				console.log(`Index ${item.index} has opened!`);
				await snipes.updateOne({ "index": item.index },
					{
						"$set": {
							"status": "open"
						}
					});

				const sections = mongodb.db.collection("sections");
				let section = await sections.findOne({ "_id": item.index });
				const courses = mongodb.db.collection("courses");
				let course = await courses.findOne({ "_id": section.courseString });

				let notify_embed = new MessageEmbed()
					.setTitle("Section open!")
					.addFields(
						{ name: "Course", value: section.courseString, inline: true },
						{ name: "Section", value: section.section_number, inline: true },
						{ name: "Index", value: item.index, inline: true },
						{ name: "Course Name", value: course.title, inline: true },
						{ name: "Instructor", value: (section.instructorsText || "Unavailable"), inline: true }
						)
					.setTimestamp()
					.setAuthor("Rutgers University", "https://scarletknights.com/images/2020/9/30/BlackR.png", "https://rutgers.edu/")
					.setFooter("Fall 2021")
					.setColor("#27db84");

				let notify = [];
				for (const user of item.users) {
					let u;
					try {
						u = await client.users.fetch(user);
					} catch {
						console.error(`User ${user} does share a server with the Discord bot.`);
						continue;
					}

					const row = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setURL(`https://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92021&indexList=${item.index})`)
								.setLabel("REGISTER")
								.setStyle("LINK")
						)
						.addComponents(
							new MessageButton()
								.setCustomId(`unsnipe-${item.index}-${user}`)
								.setStyle("DANGER")
								.setLabel("UNSNIPE")
						);

					notify.push(u.send({ embeds: [notify_embed], components: [row] })
						.then(() => {
							console.log(`Successfully notified user ${user} about opening for this index ${item.index}`);
						})
						.catch(() => {
							console.error(`User ${user} does not allow direct messages with bot or bot's guild.`);
							return;
						}));
				}
				try {
					await Promise.allSettled(notify);
				} catch (error) {
					console.error(error);
				}
			}
		}
		// console.log("Interval finished!");
		setTimeout(check_open_courses, 6000);
	}
});

async function exit_process(signal) {
	console.log(`Received signal: ${signal}. Destroying Discord client.`);
	client.destroy();
	await mongodb.disconnectDB();
	process.exit(0);
}
process.on("SIGINT", exit_process);
process.on("SIGTERM", exit_process);

let mongodb = new database();
mongodb.connectDB()
	.then(() => client.login(process.env.TOKEN))
	.catch(console.error);