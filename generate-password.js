const crypto = require("crypto");
const promisify = require("util").promisify;
const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

const cryptoConfig = {
	hashBytes: 32,
	saltBytes: 16,
	iterations: 10000 // not very secure, but not important
};

let salt = await randomBytes(cryptoConfig.saltBytes);

let hash = await pbkdf2("testpassword123", salt, cryptoConfig.iterations, cryptoConfig.hashBytes, "sha256");

let combinedBuffer = Buffer.alloc(hash.length + salt.length + 8);

combinedBuffer.writeUInt32BE(salt.length, 0, true);
combinedBuffer.writeUInt32BE(cryptoConfig.iterations, 4, true);

salt.copy(combinedBuffer, 8);
hash.copy(combinedBuffer, salt.length + 8);

console.log(combinedBuffer.toString("base64"));