const path = require("node:path")

// electron-store 模块
const Store = require("electron-store")
const settingsStore = new Store({ name: "Settings" })

const QiniuyunManager = require("./QiniuyunManager")

function CreateQiniuyunManager() {
    const accessKey = settingsStore.get("accessKey")
    const secretKey = settingsStore.get("secretKey")
    const bucket = settingsStore.get("bucket")
    return new QiniuyunManager(accessKey, secretKey, bucket)
}

const qiniu = CreateQiniuyunManager()

const urls = ["http://s85pa9kzw.hb-bkt.clouddn.com/C%3A%7CUsers%7CHello%7CDesktop%7C1.md"]
qiniu
    .refresh(urls)
    .then((ret) => {
        console.log(ret)
    })
    .catch((err) => {
        console.log(err)
    })
