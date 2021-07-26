const axios = require("axios").default;
const Discord = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");
const database = require("./database.js");

dotenv.config();
const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const prefix = process.env.PREFIX;

process.on("SIGINT", async signal => {
	console.log(`Received signal: ${signal}. Destroying Discord client.`);
	client.destroy();
	await mongodb.disconnectDB();
	process.exit(0);
});

client.on("message", async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	if (!client.commands.has(command)) {
		await client.commands.get("help").execute(message);
		return;
	}

	try {
		if (args.length === client.commands.get(command).argsCount) {
			await client.commands.get(command).execute(message, mongodb, args);
		} else {
			await client.commands.get(command).failure(message);
		}
	} catch (error) {
		console.error(error);
		message.reply("An error occurred when executing the command!");
	}
});

client.once("ready", async () => {
	console.log("The Discord bot is ready!");
	await client.user.setActivity("Jonathan Holloway", { type: "LISTENING" });
	await client.user.setStatus("idle");

	let open_sections;

	await check_open_courses();
	async function check_open_courses() {
		console.log("Interval started!");
		try {
			open_sections = (await axios.get("https://sis.rutgers.edu/soc/api/openSections.json?year=2021&term=9&campus=NB")).data;
		} catch (err) {
			if (err.code === "ECONNRESET") console.error("Open courses endpoint connection reset!");
			console.log("Interval finished!");
			setTimeout(await check_open_courses, 6000);
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
				console.log(`Index ${item.index} is currently closed.`);
				continue;
			}
			else if (open_sections.includes(item.index) && item.status === "open") {
				console.log(`Notified users already that index ${item.index} is open.`);
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

				let notify_embed = new Discord.MessageEmbed()
					.setTitle("Section open!")
					.addFields(
						{ name: "Course", value: section.courseString, inline: true },
						{ name: "Section", value: section.section_number, inline: true },
						{ name: "Index", value: item.index, inline: true },
						{ name: "Course Name", value: course.title, inline: true },
						{ name: "Instructor", value: (section.instructorsText || "Unavailable"), inline: true },
						{ name: "Register", value: `[WebReg](https://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92021&indexList=${item.index})` }
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

					notify.push(u.send(notify_embed)
						.then(() => {
							console.log(`Successfully notified user ${user} about opening for this index ${item.index}`);
						})
						.catch(() => {
							console.error(`User ${user} does not allow direct messages with bot or bot's guild.`);

						}));

					try {
						await u.send(notify_embed);
						console.log(`Successfully notified user ${user} about opening for this index ${item.index}`);
					} catch {
						console.error(`User ${user} does not allow direct messages with bot or bot's guild.`);
						continue;
					}
				}
				try {
					await Promise.allSettled(notify);
				} catch (error) {
					console.error(error);
				}
			}
		}

		console.log("Interval finished!");
		setTimeout(await check_open_courses, 6000);
	}
});

let mongodb = new database();
mongodb.connectDB()
	.then(client.login(process.env.TOKEN))
	.catch(console.error);