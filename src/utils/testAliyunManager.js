const path = require("node:path")
const AliyunManager = require("./AliyunManager")

const aliyunManager = new AliyunManager()

const key = "helper.js"

// 上传
const file = path.join(__dirname, "helper.js")
// aliyunManager
//     .uploadFile(key, file)
//     .then((ret) => {
//         console.log("-----  OK : ", ret)
//     })
//     .catch((err) => {
//         console.log("----- Err : ", err)
//     })

// 下载
const file2 = path.join(__dirname, "helper2.js")
aliyunManager.downloadFile(key, file2).then((ret) => {
    console.log("-----  OK : ", ret)
})
