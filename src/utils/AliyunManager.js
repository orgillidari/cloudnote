const fs = require("node:fs")
const OSS = require("ali-oss")

class AliyunManager {
    constructor() {
        this.AK = "111"
        this.SK = "222"
        this.region = "oss-cn-beijing"
        this.bucket = "aoyi-books"
        this.client = new OSS({
            accessKeyId: this.AK,
            accessKeySecret: this.SK,
            region: this.region,
            bucket: this.bucket
        })
    }

    uploadFile(key, file) {
        let stream = fs.createReadStream(file)
        return this.client.putStream(key, stream)
    }
    downloadFile(key, file) {
        return this.client
            .getStream(key)
            .then((ret) => {
                ret.stream.pipe(fs.createWriteStream(file))
                return new Promise((resolve, reject) => {
                    ret.stream.on("finish", resolve)
                    ret.stream.on("err", reject)
                })
            })
            .catch((err) => {
                return Promise.reject(err)
            })
    }
}

module.exports = AliyunManager
