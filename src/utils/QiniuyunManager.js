const fs = require("node:fs")
const qiniu = require("qiniu")
const axios = require("axios")
const { resolve } = require("node:path")

class QiniuyunManager {
    constructor(accessKey, secretKey, bucket) {
        // this.accessKey = "0LmtHbLrp8YqANCW4U5ipT7eTvzAdDd8uAHmdHKk"
        // this.secretKey = "D2PPGP6SIYTsFS3V9b-sQycJBdEsBDVdNY2p0Waa"
        // this.bucket = "orgillidari-hello"

        this.accessKey = accessKey
        this.secretKey = secretKey
        this.bucket = bucket

        // 鉴权对象
        this.mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey)

        // 上传配置
        this.config = new qiniu.conf.Config()
        this.config.zone = qiniu.zone.Zone_z1

        // 资源管理对象
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)

        // CND管理对象
        this.cdnManager = new qiniu.cdn.CdnManager(this.mac)
    }

    // 高阶组件
    _handleCallback(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr
            }
            if (respInfo.statusCode == 200) {
                resolve(respBody)
            } else {
                reject({ statusCode: respInfo.statusCode, body: respBody })
            }
        }
    }

    // 获取bucket域名
    // https://developer.qiniu.com/kodo/3949/get-the-bucket-space-domain
    getBucketDomain() {
        const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
        const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
        // console.log("trigger here")
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, digest, this._handleCallback(resolve, reject))
        })
    }

    // 获取下载地址
    generateDownloadLink(key) {
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain()
        return domainPromise
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    const pattern = /^https?/
                    this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`
                    const deadline = parseInt(Date.now() / 1000) + 3600 // 1小时过期
                    return this.bucketManager.privateDownloadUrl(this.publicBucketDomain, key, deadline)
                } else {
                    throw Error("域名未找到，请查看存储空间是否已经过期")
                }
            })
            .catch((err) => {
                return Promise.reject(err)
            })
    }

    // 上传文件
    updateFile(key, file) {
        // 上传凭证
        const options = {
            scope: this.bucket + ":" + key
        }
        const putPolicy = new qiniu.rs.PutPolicy(options)
        const uploadToken = putPolicy.uploadToken(this.mac)

        // 上传文件
        const formUploader = new qiniu.form_up.FormUploader(this.config)
        const readableStream = fs.createReadStream(file)
        const putExtra = new qiniu.form_up.PutExtra()
        putExtra.resumeRecordFile = "progress.log"
        putExtra.version = "v2"
        putExtra.partSize = 6 * 1024 * 1024

        return new Promise((resolve, reject) => {
            formUploader.putStream(uploadToken, key, readableStream, putExtra, this._handleCallback(resolve, reject))
        })
    }

    // 下载文件
    downloadFile(key, file) {
        return this.generateDownloadLink(key)
            .then((url) => {
                return axios({
                    url,
                    method: "GET",
                    responseType: "stream",
                    headers: { "Cache-Control": "no-cache" }
                }).then((ret) => {
                    const writer = fs.createWriteStream(file)
                    ret.data.pipe(writer)
                    return new Promise((resolve, reject) => {
                        writer.on("finish", resolve)
                        writer.on("err", reject)
                    })
                })
            })
            .catch((err) => {
                return Promise.reject(err.response)
            })
    }
    // 获取文件信息
    stat(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject))
        })
    }
    // 删除文件
    delete(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject))
        })
    }
    // 重命名
    rename(oldKey, newKey) {
        const options = {
            force: true
        }
        return new Promise((resolve, reject) => {
            this.bucketManager.move(this.bucket, oldKey, this.bucket, newKey, options, this._handleCallback(resolve, reject))
        })
    }
    // 获取文件列表
    list() {
        const options = {
            // limit: 10,
            // prefix: "images/"
        }
        return new Promise((resolve, reject) => {
            this.bucketManager.listPrefix(this.bucket, options, this._handleCallback(resolve, reject))
        })
    }
    // CDN刷新
    refresh(urls) {
        return new Promise((resolve, reject) => {
            this.cdnManager.refreshUrls(urls, this._handleCallback(resolve, reject))
        })
    }
}

module.exports = QiniuyunManager
