const cluster = require("cluster");

const numCores = parseInt(process.env.NUM_CORES) || 1;

if (cluster.isMaster) {
	console.log(`Starting cluster with ${numCores} workers`);

	for (let i = 0; i < numCores; i++) {
		cluster.fork();
	}

	cluster.on("exit", (worker, code, signal) => {
		console.log(`worker ${worker.process.pid} died`);
	});
	return;
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const crypto = require("crypto");
const promisify = require("util").promisify;
const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);
const User = require("./user.model");
require("dotenv").config();
const db = mongoose.connect(process.env.MONGODB_URI).connection;

mongoose.Promise = global.Promise;

const cryptoConfig = {
	hashBytes: 32,
	saltBytes: 16,
	iterations: 10000 // not very secure, but not important
};

app.use(require("body-parser").json());

// Generate a test password
app.get("/generate", async (req, res) => {
	let salt = await randomBytes(cryptoConfig.saltBytes);

	let hash = await pbkdf2("testpassword123", salt, cryptoConfig.iterations, cryptoConfig.hashBytes, "sha256");

	let combinedBuffer = Buffer.alloc(hash.length + salt.length + 8);

	combinedBuffer.writeUInt32BE(salt.length, 0, true);
	combinedBuffer.writeUInt32BE(cryptoConfig.iterations, 4, true);

	salt.copy(combinedBuffer, 8);
	hash.copy(combinedBuffer, salt.length + 8);

	res.status(200).send(combinedBuffer.toString("base64"));
});

// Test login endpoint that generates a token (token does nothing)
app.post("/login", async (req, res) => {
	let user = await User.findOne({
		email: req.body.email
	});

	if (!user) {
		return res.status(500).send("user not found");
	}

	let passwordBuffer = Buffer.from(user.password, "base64");
	let saltBytes = passwordBuffer.readUInt32BE(0);
	let hashBytes = passwordBuffer.length - saltBytes - 8;
	let iterations = passwordBuffer.readUInt32BE(4);
	let salt = passwordBuffer.slice(8, saltBytes + 8);
	let hash = passwordBuffer.slice(saltBytes + 8);

	let compareHash = await pbkdf2(req.body.password, salt, iterations, hashBytes, "sha256");

	if (!compareHash.equals(hash)) {
		return res.status(500).send("invalid password");
	}

	let tokenBuffer = await randomBytes(64);

	res.status(200).json({
		token: tokenBuffer.toString("base64")
	});
});

app.listen(8000 + numCores);

console.log(`Worker ${cluster.worker.id} started`);

process.on("unhandledRejection", (reason, p) => {
	console.error("unhandeledRejection", p, reason);
});

process.on("uncaughtException", (err) => {
	console.error("uncaughtException", err);
});