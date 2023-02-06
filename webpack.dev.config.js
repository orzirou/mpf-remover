const base = require("./webpack.config");

module.exports = {
  ...base,
  mode: "development",
  target: "electron-main",
};
