'use strict';

const loginMethod = require("./login");

const createErrorResponse = (statusCode, message) => {
	return {
		statusCode: statusCode || 501,
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			error: message
		})
	}
};

module.exports.login = (event, context, callback) => {
	let data = {};

	// Parse the JSON request body
	try {
		data = JSON.parse(event.body);
	} catch (err) {
		callback(null, createErrorResponse(err.statusCode, err.message));
		return;
	}

	loginMethod(data.email, data.password)
	.then((token) => {
		callback(null, { statusCode: 201, body: JSON.stringify({ token: token.toString("base64") }) });
	})
	.catch((err) => {
		callback(null, createErrorResponse(400, err.message));
	});
};
