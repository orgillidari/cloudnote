const { ipcMain, shell } = require("electron")

const Store = require("electron-store")
const settingsStore = new Store({ name: "Settings" })

let isAutoSave = settingsStore.get("autoSave")

const getQiniuyunConfigState = () => {
    return ["accessKey", "secretKey", "bucket"].every((key) => !!settingsStore.get(key))
}
const getAutoSyncState = () => {
    return ["accessKey", "secretKey", "bucket", "autoSave"].every((key) => !!settingsStore.get(key))
}

let isQiniuyunConfiged = getQiniuyunConfigState()

const menuTemplate = [
    {
        label: "Cloud",
        submenu: [
            {
                label: "Setting",
                accelerator: "CmdOrCtrl+,",
                click: (menuItem, browserWindow, event) => {
                    // 解构，主进程向主进程发送消息
                    ipcMain.emit("open-settings-window")
                }
            },
            {
                label: "Auto Sync",
                type: "checkbox",
                enabled: isQiniuyunConfiged,
                checked: isAutoSave,
                click: (menuItem, browserWindow, event) => {
                    // console.log("menuItem.checked : ", menuItem.checked)
                    isAutoSave = menuItem.checked
                    settingsStore.set("autoSave", isAutoSave)
                    // ipcMain.emit("update-config", { updateMenu: false })
                }
            },
            {
                label: "Upload All File",
                enabled: isQiniuyunConfiged,
                click: (menuItem, browserWindow, event) => {
                    ipcMain.emit("upload-all-file")
                }
            },
            {
                label: "Download All File",
                enabled: isQiniuyunConfiged,
                click: (menuItem, browserWindow, event) => {
                    ipcMain.emit("download-all-file")
                }
            }
        ]
    },
    {
        label: "File",
        submenu: [
            {
                label: "New",
                accelerator: "CmdOrCtrl+N",
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send("create-file")
                }
            },
            {
                label: "Import",
                accelerator: "CmdOrCtrl+O",
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send("import-files")
                }
            },
            {
                label: "Save",
                accelerator: "CmdOrCtrl+S",
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send("save-file")
                }
            },
            {
                label: "Search",
                accelerator: "CmdOrCtrl+F",
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send("search-file")
                }
            },
            { type: "separator" },
            { role: "quit" }
        ]
    },
    {
        label: "Edit",
        submenu: [
            // { role: "undo" },
            // { role: "redo" },
            // { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "delete" },
            { type: "separator" },
            { role: "selectAll" }
        ]
    },
    {
        label: "View",
        submenu: [
            { role: "togglefullscreen" },
            { type: "separator" },
            { role: "reload" },
            { role: "forceReload" },
            { type: "separator" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { role: "resetZoom" },
            { type: "separator" },
            { role: "toggleDevTools" }
        ]
    },
    {
        label: "Window",
        submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }]
    },
    {
        role: "help",

        submenu: [
            {
                label: "Learn More",
                click: async () => {
                    await shell.openExternal("https://hello.illidari.org")
                }
            }
        ]
    }
]

module.exports = { getQiniuyunConfigState, getAutoSyncState, menuTemplate }
