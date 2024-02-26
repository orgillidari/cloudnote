const { BrowserWindow } = require("electron")

class AppWindow extends BrowserWindow {
    constructor(config, url) {
        const defaultConfig = {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true, // 在 Render Process 中不使用 Node.js 的 API
                contextIsolation: false // 在 Render Process 中使用隔离上下文
                // preload: path.join(__dirname, "preload.js")
            },
            backgroundColor: "#efefef",
            show: false
        }
        const finialConfig = Object.assign(defaultConfig, config)
        super(finialConfig)

        // this.removeMenu()
        this.loadURL(url)

        this.once("ready-to-show", () => {
            this.show()
        })
    }
}

module.exports = AppWindow
