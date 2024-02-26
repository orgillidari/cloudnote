// NodeJS模块
const path = require("node:path")
const fs = require("node:fs")
const { electron } = require("node:process")

const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: "./main.js",
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "main.js"
    },
    target: "electron28.1-main",
    mode: "production",
    node: {
        __dirname: false
    },
    plugins: [new CopyPlugin({ patterns: [{ from: path.join(__dirname, "./src/settings"), to: "settings" }] })]
}
