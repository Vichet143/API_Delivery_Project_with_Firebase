const bcrypt = require("bcrypt");

exports.hashpassword = async (password) => {
  return await password.hash(password, 10)
};

exports.comparepassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}