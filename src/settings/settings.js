const { ipcRenderer } = require("electron")
const { dialog, getCurrentWindow } = require("@electron/remote")
const Store = require("electron-store")

// 全局变量
const settingsStore = new Store({ name: "Settings" })

// 配置项
const configArr = ["#savedFileLocation", "#accessKey", "#secretKey", "#bucket"]

const $ = (selector) => {
    const ret = document.querySelectorAll(selector)
    return ret.length > 1 ? ret : ret[0]
}

document.addEventListener("DOMContentLoaded", () => {
    // 获取初始化数据
    configArr.forEach((selector) => {
        const savedValue = settingsStore.get(selector.substr(1))
        if (savedValue) {
            $(selector).value = savedValue
        }
    })

    $("#select-new-location").addEventListener("click", () => {
        dialog
            .showOpenDialog({
                properties: ["openDirectory"]
            })
            .then((ret) => {
                if (Array.isArray(ret.filePaths) && ret.filePaths.length > 0) {
                    savedFileLocation = ret.filePaths[0]
                    $("#savedFileLocation").value = ret.filePaths[0]
                }
            })
    })

    $("#settings-form").addEventListener("submit", (e) => {
        e.preventDefault()

        configArr.forEach((selector) => {
            if ($(selector)) {
                let { id, value } = $(selector)
                settingsStore.set(id, value ? value : "")
            }
        })

        // sent a event back to main process to enable menu items if qiniu is configed
        ipcRenderer.send("update-config")

        // 关闭窗口
        getCurrentWindow().close()
    })

    $(".nav-tabs").addEventListener("click", (e) => {
        e.preventDefault()

        // 切换Tab
        $(".nav-link").forEach((element) => {
            element.classList.remove("active")
        })
        e.target.classList.add("active")

        // 切换内容
        $(".config-area").forEach((element) => {
            element.style.display = "none"
        })
        $(e.target.dataset.tab).style.display = "block"
    })
})
