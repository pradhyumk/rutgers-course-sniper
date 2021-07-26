const { MongoClient } = require("mongodb");

class database {

	constructor() {
		this.url = process.env.MONGODB_URI;
		this.client = null;
		this.db = null;
	}

	connectDB() {
		if (this.client == null) {
			return new Promise((resolve, reject) => {
				MongoClient.connect(this.url, { "useNewUrlParser": true })
					.then((client) => {
						this.client = client;
						this.db = client.db(process.env.DB_NAME);
						console.log("A connection to the database was established!");
						resolve();
					})
					.catch(err => {
						console.error("An error occurred: " + err);
						reject();
					});
			});
		}
		else {
			console.error("Already connected to MongoDB database!");
			return Promise.reject;
		}
	}

	disconnectDB() {
		if (this.client == null) {
			return Promise.reject("There is no active MongoDB connection!");
		} else {
			return new Promise((resole, reject) => {
				this.client.close()
					.then(() => {
						this.client = null;
						this.db = null;
						console.log("The database connection was closed!");
						resole();
					})
					.catch(err => {
						console.error(err);
						reject("An error occurred when closing the database connection.");
					});
			});

		}
	}
}

module.exports = database;