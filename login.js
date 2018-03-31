const crypto = require("crypto");
const randomBytes = (bytes) => {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(bytes, (err, buffer) => {
			if (err) {
				return reject(err);
			}

			return resolve(buffer);
		});
	});
};
const pbkdf2 = (password, salt, iterations, hashBytes, digest) => {
	return new Promise((resolve, reject) => {
		crypto.pbkdf2(password, salt, iterations, hashBytes, digest, (err, buffer) => {
			if (err) {
				return reject(err);
			}

			return resolve(buffer);
		});
	});
};

const cryptoConfig = {
	hashBytes: 32,
	saltBytes: 16,
	iterations: 10000 // not very secure, but not important
};

// Faking a database
const db = {
	_users: [{
		email: "test@example.com",
		password: "AAAAEAAAJxDyvDI9rmsEM4P4yheI9sXaoLH7DE40a2ZjWg+p1RGhAShGqJtCPPNUbX5vhrbW3YA="
	}],
	findUser: (email) => {
		// Fake getting an user from the database. Database contains only one user, and can be found synchronous
		// so a timeout of 30 milliseconds simulates database interaction
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(db._users.find((element) => {
					return element.email.toLowerCase() === email.toLowerCase();
				}));
			}, 30);
		});
	},
	generateAuthToken: () => {
		// Fake storing the token in the database by using 30ms delay
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				randomBytes(64).then(resolve);
			}, 30);
		});
	}
};

// Attempt to login an user based on it's email address, verify password and return a 64 byte authToken
module.exports = function login(email, password) {
	return db.findUser(email)
	.then((user) => {
		if (user === undefined || user === null) {
			return Promise.reject(new Error("user not found"));
		}

		let passwordBuffer = Buffer.from(user.password, "base64");
		let saltBytes = passwordBuffer.readUInt32BE(0);
		let hashBytes = passwordBuffer.length - saltBytes - 8;
		let iterations = passwordBuffer.readUInt32BE(4);
		let salt = passwordBuffer.slice(8, saltBytes + 8);
		let hash = passwordBuffer.slice(saltBytes + 8);

		return pbkdf2(password, salt, iterations, hashBytes, "sha256")
		.then((compareHash) => {
			if (!compareHash.equals(hash)) {
				return Promise.reject(new Error("invalid password"));
			}

			return db.generateAuthToken();
		});
	});
}
