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
const loginMethod = require("./login");

app.use(require("body-parser").json());

// Test login endpoint that generates a token (token does nothing)
app.post("/login", (req, res) => {
	loginMethod(req.body.email, req.body.password)
	.then((token) => {
		res.status(201).json({
			token: token.toString("base64")
		});
	})
	.catch((err) => {
		res.status(400).json({
			error: err.message
		});
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