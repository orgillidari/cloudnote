// NodeJS模块
const path = require("node:path")
const fs = require("node:fs")

// Electron模块
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron")
const { autoUpdater } = require("electron-updater")

// 第三方模块 - electron-log
const log = require("electron-log/main")
log.initialize()
// 第三方模块 - electron-is-dev
const isDev = require("electron-is-dev")
// 第三方模块 - electron-store
const Store = require("electron-store")
Store.initRenderer()
const settingsStore = new Store({ name: "Settings" })
const fileStore = new Store({ name: "FileDB" })
const savedLocation = settingsStore.get("savedFileLocation") || join(app.getPath("appData"), "cloud-note/Files")
if (!fs.existsSync(savedLocation)) {
    fs.mkdirSync(savedLocation)
}

// 第三方模块 - @electron/remote
require("@electron/remote/main").initialize()

// 自定义模块 - 七牛云
const QiniuyunManager = require("./src/utils/QiniuyunManager")
// 创建七牛云管理器
function CreateQiniuyunManager() {
    const accessKey = settingsStore.get("accessKey")
    const secretKey = settingsStore.get("secretKey")
    const bucket = settingsStore.get("bucket")
    return new QiniuyunManager(accessKey, secretKey, bucket)
}
let qiniuyunManager = CreateQiniuyunManager()

// 窗口
const AppWindow = require("./AppWindow")
let mainWindow, settingsWindow

// 创建窗口
function createWindow() {
    const mainWindowConfig = {
        icon: path.join(__dirname, "/public/logo64.png"),
        width: 1600,
        height: 900
    }

    const serve_url = "http://localhost:9595"
    const local_url = `file://${path.join(__dirname, "./index.html").replace(/\\/g, "/")}`
    const mainWindowUrl = isDev ? serve_url : local_url
    mainWindow = new AppWindow(mainWindowConfig, mainWindowUrl)
    mainWindow.on("closed", () => {
        mainWindow = null
    })
    // 启用开发者工具
    // mainWindow.webContents.openDevTools()
    // 启用 remote 模块
    require("@electron/remote/main").enable(mainWindow.webContents)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    // 检查更新
    if (isDev) {
        Object.defineProperty(app, "isPackaged", {
            get() {
                return true
            }
        })
        autoUpdater.updateConfigPath = path.join(__dirname, "dev-app-update.yml")
    }
    autoUpdater.autoDownload = false

    autoUpdater.on("err", (err) => {
        log.info(err)
        dialog.showErrorBox("Error: ", err == null ? "unknown" : (err.stack || err).toString())
    })
    autoUpdater.on("checking-for-update", () => {
        log.info("-- 开始检查新版本")
    })
    autoUpdater.on("update-available", () => {
        log.info("发现新版本")
        dialog
            .showMessageBox({
                type: "info",
                title: "应用有新的版本",
                message: "发现新版本，是否现在更新？",
                buttons: ["是", "否"]
            })
            .then((ret) => {
                if (ret.response === 0) {
                    log.info("开始下载更新")
                    autoUpdater.downloadUpdate()
                } else {
                    log.info("取消下载更新")
                    app.quit()
                }
            })
    })
    autoUpdater.on("update-not-available", () => {
        log.info("没有新版本")
        dialog.showMessageBox({
            title: "没有新版本",
            message: "当前已经是最新版本"
        })
    })
    autoUpdater.on("download-progress", (info) => {
        let log_message = "  下载速度: " + info.bytesPerSecond
        log_message = log_message + " - 已下载: " + info.percent + "%"
        log_message = log_message + " (" + info.transferred + "/" + info.total + ")"
        log.info(log_message)
    })
    autoUpdater.on("update-downloaded", () => {
        log.info("更新完成")
        dialog
            .showMessageBox({
                title: "安装更新",
                message: "更新下载完毕，应用将重启并进行安装"
            })
            .then((ret) => {
                setImmediate(() => autoUpdater.quitAndInstall())
            })
    })

    autoUpdater.checkForUpdates()

    // 菜单
    const menu = Menu.buildFromTemplate(require("./src/Menu/menuTemplate").menuTemplate)
    Menu.setApplicationMenu(menu)

    createWindow()

    app.on("activate", function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// -- 打开配置窗口
ipcMain.on("open-settings-window", () => {
    // 创建窗口
    const settingsWindowConfig = {
        width: 800,
        height: 600
    }

    const settingsWindowUrl = isDev ? `file://${path.join(__dirname, "./src/settings/settings.html")}` : `file://${path.join(__dirname, "./settings/settings.html")} `

    settingsWindow = new AppWindow(settingsWindowConfig, settingsWindowUrl)
    settingsWindow.on("closed", () => {
        settingsWindow = null
    })
    // 移除菜单
    settingsWindow.removeMenu()
    // 启用开发者工具
    settingsWindow.webContents.openDevTools()
    // 启用 remote 模块
    require("@electron/remote/main").enable(settingsWindow.webContents)
})

// -- 在配置窗口中更新配置
// 使用 : ipcMain.emit("update-config", { updateMenu: false })
ipcMain.on("update-config", (args) => {
    // 更新七牛
    qiniuyunManager = CreateQiniuyunManager()

    // 更新菜单
    delete require.cache[require.resolve("./src/Menu/menuTemplate")]
    const menu = Menu.buildFromTemplate(require("./src/Menu/menuTemplate").menuTemplate)
    Menu.setApplicationMenu(menu)
})

// 使用 : ipcMain.emit("upload-all-file")
ipcMain.on("upload-all-file", (args) => {
    mainWindow.webContents.send("loading-status", true)

    const fileMap = fileStore.get("files") || {}

    // 上传
    const uploadPromiseArr = Object.keys(fileMap).map((id) => {
        const file = fileMap[id]
        return qiniuyunManager.updateFile(file.id, file.path)
    })
    Promise.all(uploadPromiseArr)
        .then((ret) => {
            dialog.showMessageBox({
                type: "info",
                title: `恭喜`,
                message: `成功上传了${ret.length}个文件`
            })
            mainWindow.webContents.send("upload-all-file-success")
        })
        .catch((err) => {
            console.log(err)
            dialog.showErrorBox("同步失败", "请检查七牛云配置")
        })
        .finally(() => {
            mainWindow.webContents.send("loading-status", false)
        })
})

// 使用 : ipcMain.emit("download-all-file")
ipcMain.on("download-all-file", (args) => {
    mainWindow.webContents.send("loading-status", true)
    qiniuyunManager
        .list()
        .then((ret) => {
            const fileMap = fileStore.get("files") || {}

            // 过滤无效的项
            const downloadItemArr = ret.items.filter((item) => {
                if (fileMap.hasOwnProperty(item.key)) {
                    const file = fileMap[item.key]

                    if (!fs.existsSync(file.path)) {
                        // 文件不存在，需要更新
                        return true
                    }

                    const localTime = file.syncedAt * 10000
                    const serverTime = item.putTime
                    if (localTime < serverTime) {
                        // 本地文件不是最新的，需要更新
                        return true
                    } else {
                        // 本地文件是最新的，不需要更新
                        return false
                    }
                } else {
                    // 本地配置没有该文件， 不需要更新
                    return false
                }
            })

            // 下载
            const donwloadPromiseArr = downloadItemArr.map((item) => {
                const file = fileMap[item.key]
                return qiniuyunManager.downloadFile(file.id, file.path)
            })
            // 返回 Promise 对象，保证该对象的finally回调函数执行完成后再执行外部的finally回调函数。
            return Promise.all(donwloadPromiseArr)
                .then((ret) => {
                    dialog.showMessageBox({
                        type: "info",
                        title: `恭喜`,
                        message: `成功下载了${ret.length}个文件`
                    })
                    mainWindow.webContents.send("download-all-file-success")
                })
                .catch((err) => {
                    console.log(err)
                    dialog.showErrorBox("同步失败", "请检查七牛云配置")
                })
        })
        .catch((err) => {
            console.log(err)
            dialog.showErrorBox("同步失败", "请检查七牛云配置")
        })
        .finally(() => {
            mainWindow.webContents.send("loading-status", false)
        })
})

// 使用 : ipcRenderer.send("auto-sync-upload", { id: activeFile.id, key, path: activeFile.path })
ipcMain.on("auto-sync-upload", (event, args) => {
    qiniuyunManager
        .updateFile(args.id, args.path)
        .then((ret) => {
            mainWindow.webContents.send("auto-sync-upload-success", { ret: 1, status: "file-has-uploaded", id: args.id })
        })
        .catch((err) => {
            dialog.showErrorBox("同步失败", "请检查七牛云配置")
        })
})

// 使用 : ipcRenderer.send("auto-sync-download", { id: file.id, key, path: file.path })
ipcMain.on("auto-sync-download", (event, args) => {
    qiniuyunManager
        .stat(args.id)
        .then((ret) => {
            const files = fileStore.get("files")
            const file = files[args.id]
            const localTime = file.syncedAt * 10000
            const serverTime = ret.putTime
            // console.log("-----  auto-sync-download - localTime  : ", localTime)
            // console.log("-----  auto-sync-download - serverTime : ", serverTime)
            if (!fs.existsSync(file.path) || localTime < serverTime) {
                qiniuyunManager
                    .downloadFile(args.id, args.path)
                    .then(() => {
                        mainWindow.webContents.send("auto-sync-download-success", { ret: 1, status: "file-has-updated", id: args.id })
                    })
                    .catch((err) => {
                        dialog.showErrorBox("同步失败", "请检查七牛云配置")
                    })
            } else {
                mainWindow.webContents.send("auto-sync-download-success", { ret: 0, status: "file-is-new", id: args.id })
            }
        })
        .catch((err) => {
            if (err.statusCode === 612) {
                // 没有找到改文件
                mainWindow.webContents.send("auto-sync-download-success", { ret: -1, status: "file-not-found", id: args.id })
                // dialog.showErrorBox("同步失败", "请检查七牛云配置")
            } else {
                mainWindow.webContents.send("auto-sync-download-success", { ret: -1, status: "file-not-found", id: args.id })
                dialog.showErrorBox("同步失败", "请检查七牛云配置")
            }
        })
})

// 使用 : ipcRenderer.send("auto-sync-delete", { id, key, path: fileMap[id].path })
ipcMain.on("auto-sync-delete", (event, args) => {
    qiniuyunManager
        .delete(args.id)
        .then((ret) => {
            mainWindow.webContents.send("auto-sync-delete-success", { ret: 1, status: "file-has-deleted", id: args.id })
        })
        .catch((err) => {
            mainWindow.webContents.send("auto-sync-delete-success", { ret: -1, status: "file-delete-failed", id: args.id })
        })
})

// 使用
ipcMain.on("auto-sync-rename", (event, args) => {
    // 使用ID作为key时，当文件名称发生变化时不需要任何处理。
    // qiniuyunManager
    //     .rename(args.oldKey, args.newKey)
    //     .then((ret) => {
    //         mainWindow.webContents.send("auto-sync-rename-success", { ret: 1, status: "file-has-renamed", id: args.id })
    //     })
    //     .catch((err) => {
    //         mainWindow.webContents.send("auto-sync-rename-success", { ret: -1, status: "file-rename-failed", id: args.id })
    //     })
})
