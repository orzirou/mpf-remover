const path = require("path");
const src = path.join(process.cwd(), "projects", "electron");

module.exports = {
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      path: "path-browserify",
    },
  },
  entry: {
    main: path.join(src, "main.ts"),
    preload: path.join(src, "preload.ts"),
  },
  output: {
    path: path.resolve(__dirname, "dist", "renderer", "electron"),
    publicPath: ".",
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: [/node_modules/],
      },
    ],
  },
};
