const fs = window.require("node:fs/promises")

const fileHelper = {
    readFile: (path) => {
        return fs.readFile(path, { encoding: "utf8" })
    },
    writeFile: (path, content) => {
        return fs.writeFile(path, content, { encoding: "utf8" })
    },
    renameFile: (path, newPath) => {
        return fs.rename(path, newPath)
    },
    deleteFile: (path) => {
        return fs.unlink(path)
    },
    copyFile: (path, newPath) => {
        return fs.copyFile(path, newPath)
    }
}

export default fileHelper
