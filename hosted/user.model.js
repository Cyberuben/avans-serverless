const mongoose = require("mongoose");

const user = mongoose.model("user", {
	email: String,
	password: String
});

module.exports = user;