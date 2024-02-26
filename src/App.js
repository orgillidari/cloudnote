import "./App.scss"

import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { faPlus, faFileImport } from "@fortawesome/free-solid-svg-icons"

import { ArrToMap, MapToArr, FormatFileMap, FormatTime } from "./utils/helper"
import fileHelper from "./utils/fileHelper"
import useIPCRenderer from "./Hooks/useIPCRenderer"

import Search from "./Components/Search"
import FileList from "./Components/FileList"
import IconButton from "./Components/IconButton"
import TabList from "./Components/TabList"
import MdEditor from "./Components/MdEditor"
import Loader from "./Components/Loader"

// 引入 Nodejs 模块。
const { join, dirname, basename, extname } = window.require("node:path")
const { existsSync, mkdirSync } = window.require("node:fs")
const { ipcRenderer } = window.require("electron")
const { app, dialog } = window.require("@electron/remote")

// 这个模块是一个commonjs模块，如果在渲染进程中调用其中的方法，需要使用window.require，但是在主进程中不需要。所以这里矛盾了。
// const { getAutoSyncState } = window.require("./src/Menu/menuTemplate")
const getAutoSyncState = () => {
    return ["accessKey", "secretKey", "bucket", "autoSave"].every((key) => !!settingsStore.get(key))
}

// electron-store 模块
const Store = window.require("electron-store")
const settingsStore = new Store({ name: "Settings" })
const fileStore = new Store({ name: "FileDB" })

// 保存文件到 electron-store
const saveFileMapToStore = (fileMap) => {
    const files = FormatFileMap(fileMap)
    fileStore.set("files", files)
}

// 组件
function App() {
    // console.log("----- 组件【App】")

    // 当前文件 - Map
    const [fileMap, setFileMap] = useState(fileStore.get("files") || {})
    // 当前文件 - Array
    const fileArr = MapToArr(fileMap)

    console.log("----- 组件【App】: fileMap: ", fileMap)
    // console.log("----- 组件【App】: fileArr: ", fileArr)

    // 当前搜索状态
    const [searchState, setSearchState] = useState(false)
    // 当前搜索关键词
    const [searchKeyword, setSearchKeyword] = useState("")
    // 当前搜索到的文件 - Array
    const [searchedFiles, setSearchedFiles] = useState([])

    // 当前打开的文件ID
    const [openedFileIDs, setOpenedFileIDs] = useState([])
    // 当前激活的文件ID
    const [activeFileID, setActiveFileID] = useState("")
    // 当前未保存的文件ID
    const [unsavedFileIDs, setUnsavedFileIDs] = useState([])

    // 是否当前正在执行
    const [loadState, setLoadState] = useState(false)

    // 文件保存位置
    const savedLocation = settingsStore.get("savedFileLocation") || join(app.getPath("appData"), "cloud-note/Files")
    if (!existsSync(savedLocation)) {
        mkdirSync(savedLocation)
    }

    // 当前打开的文件
    const openedFiles = openedFileIDs.map((openedFileID) => {
        return fileMap[openedFileID]
    })

    // 当前激活的文件
    const activeFile = fileMap[activeFileID]

    useEffect(() => {
        // 如果当前正在搜索：修改搜索列表中的文件
        if (searchState) {
            // 如果执行搜索：搜索当前文件列表中的文件
            const newSearchedFiles = fileArr.filter((file) => {
                return file.title.includes(searchKeyword) || file.isNew
            })
            setSearchedFiles(newSearchedFiles)
        }
    }, [fileMap])

    useEffect(() => {
        // 更新搜索列表
        if (searchState) {
            // 如果执行搜索：搜索当前文件列表中的文件
            const newSearchedFiles = fileArr.filter((file) => {
                return file.title.includes(searchKeyword)
            })
            setSearchedFiles(newSearchedFiles)
        } else {
            // 如果取消搜索：清空搜索列表 - (这里不更新了。否则会引起APP组件的重新渲染)
            // setSearchedFiles([])
        }
    }, [searchState, searchKeyword])

    useEffect(() => {
        if (openedFileIDs.includes(activeFileID)) {
            // 如果关闭的不是激活文件。不做任何处理
        } else {
            // 如果当前关闭的文件是激活的文件，那么修改当前激活的文件。
            if (openedFileIDs.length > 0) {
                setActiveFileID(openedFileIDs[0])
            } else {
                // 由于这里虽然修改了activeFileID，但是由于之前的默认值是activeFileID，所以这里不会引起APP组件的重新渲染。
                setActiveFileID("")
            }
        }
    }, [openedFileIDs])

    // 根据关键词搜索文件
    const searchFiles = (isSearching, keyword) => {
        console.log("searchFiles: ", isSearching, keyword)

        // 设置搜索状态
        setSearchState(isSearching)
        // 设置搜索关键词
        setSearchKeyword(keyword)
    }

    // 打开文件
    const openFile = (id) => {
        console.log("openFile: ", id)

        // 添加到打开的文件列表中
        setOpenedFileIDs((preOpenedFileIDs) => {
            if (!preOpenedFileIDs.includes(id)) {
                return [...preOpenedFileIDs, id]
            }
            return preOpenedFileIDs
        })

        // 设置激活的文件
        setActiveFileID(id)

        // 加载文件
        const file = fileMap[id]
        if (!file.isLoaded) {
            if (getAutoSyncState()) {
                ipcRenderer.send("auto-sync-download", { id: file.id, path: file.path })
            } else {
                fileHelper.readFile(file.path).then((content) => {
                    setFileMap((preFileMap) => {
                        const newFile = { ...preFileMap[id] }
                        newFile.content = content
                        newFile.isLoaded = true

                        const newFileMap = { ...preFileMap, [id]: newFile }

                        // 本地操作-不需要持久化数据

                        return newFileMap
                    })
                })
            }
        }
    }

    // 修改文件标题
    const saveFileTitle = (id, title) => {
        console.log("saveFileTitle: ", id, title)

        if (fileMap[id].isNew) {
            const newPath = join(savedLocation, `${id}.md`)
            fileHelper
                .writeFile(newPath, fileMap[id].content)
                .then(() => {
                    setFileMap((preFileMap) => {
                        const newFile = { ...preFileMap[id] }
                        newFile.title = title
                        newFile.path = newPath
                        delete newFile.isNew

                        const newFileMap = { ...preFileMap, [id]: newFile }

                        // 数据持久化
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })
                })
                .catch((err) => {
                    console.log("文件创建失败 : ", err)
                })
        } else {
            const oldPath = fileMap[id].path
            const newPath = join(dirname(fileMap[id].path), `${id}.md`)
            fileHelper
                .renameFile(oldPath, newPath)
                .then(() => {
                    setFileMap((preFileMap) => {
                        const newFile = { ...preFileMap[id] }
                        newFile.title = title
                        newFile.path = newPath
                        const newFileMap = { ...preFileMap, [id]: newFile }

                        // 数据持久化
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })

                    // 自动同步
                    if (getAutoSyncState()) {
                        if (fileMap[id].isSynced) {
                            // ID不变，不在需要修改。
                        }
                    }
                })
                .catch((err) => {
                    console.log("文件重命名失败 : ", err)
                })
        }
    }

    // 删除文件
    const deleteFile = (id) => {
        console.log("deleteFile: ", id)

        if (fileMap[id].isNew) {
            // 删除当前文件列表中的文件 - 操作的是Map
            setFileMap((preFileMap) => {
                const newFileMap = { ...preFileMap }
                delete newFileMap[id]

                // // 数据持久化
                // saveFileMapToStore(newFileMap)

                return newFileMap
            })
        } else {
            // 删除文件
            const filePath = fileMap[id].path
            fileHelper
                .deleteFile(filePath)
                .then(() => {
                    // 删除当前文件列表中的文件 - 操作的是Map
                    setFileMap((preFileMap) => {
                        const newFileMap = { ...preFileMap }
                        delete newFileMap[id]

                        // 数据持久化
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })

                    // 如果打开了文件：关闭Tab
                    closeTab(id)
                })
                .catch((err) => {
                    console.log("文件删除失败 : ", err)

                    // 删除当前文件列表中的文件 - 操作的是Map
                    setFileMap((preFileMap) => {
                        const newFileMap = { ...preFileMap }
                        delete newFileMap[id]

                        // 数据持久化
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })

                    // 如果打开了文件：关闭Tab
                    closeTab(id)
                })
        }

        if (getAutoSyncState()) {
            if (fileMap[id].isSynced) {
                ipcRenderer.send("auto-sync-delete", { id, path: fileMap[id].path })
            }
        }
    }

    // 切换Tab
    const changeTab = (id) => {
        console.log("changeTab: ", id)

        setActiveFileID(id)
    }

    // 关闭Tab
    const closeTab = (id) => {
        console.log("closeTab: ", id)

        setOpenedFileIDs((preOpenedFileIDs) => {
            if (preOpenedFileIDs.includes(id)) {
                const newOpenedFileIDs = preOpenedFileIDs.filter((openedFileID) => {
                    return openedFileID !== id
                })
                return newOpenedFileIDs
            }
            return preOpenedFileIDs
        })
    }

    // 修改文件内容
    const changeFile = (id, value) => {
        // console.log("changeFile: ", id, value)

        // 修改当前文件列表中的文件
        setFileMap((preFileMap) => {
            const file = preFileMap[id]
            file.content = value

            const newFilesNap = { ...preFileMap, [id]: file }
            return newFilesNap
        })

        // 修改未保存文件列表中的文件
        setUnsavedFileIDs((preUnsavedFileIDs) => {
            if (!preUnsavedFileIDs.includes(id)) {
                return [...preUnsavedFileIDs, id]
            }
            return preUnsavedFileIDs
        })
    }

    // 创建文件
    const createFile = () => {
        // 如果已经创建了文件，那么不做处理
        const foundFile = fileArr.find((file) => {
            return file.isNew
        })
        if (foundFile) {
            return
        }

        const newID = uuidv4()
        const newFile = {
            id: newID,
            title: "",
            path: "",
            content: "",
            createdAt: new Date().getTime(),
            isNew: true
        }

        setFileMap((preFileMap) => {
            return { ...preFileMap, [newFile.id]: newFile }
        })
    }

    // 保存文件内容
    const saveFile = () => {
        console.log("saveFile: ", activeFile)

        fileHelper
            .writeFile(activeFile.path, activeFile.content)
            .then(() => {
                if (unsavedFileIDs.includes(activeFileID)) {
                    setUnsavedFileIDs((preUnsavedFileIDs) => {
                        return preUnsavedFileIDs.filter((unsavedFileID) => {
                            return unsavedFileID !== activeFileID
                        })
                    })
                }

                // 自动同步
                if (getAutoSyncState()) {
                    ipcRenderer.send("auto-sync-upload", { id: activeFile.id, path: activeFile.path })
                }
            })
            .catch((err) => {
                console.log("文件保存失败 : ", err)
            })
    }

    // 导入文件
    const importFiles = () => {
        dialog
            .showOpenDialog({
                title: "选择导入的 Markdown 文件",
                properties: ["openFile", "multiSelections"],
                filters: [{ name: "Markdown Files", extensions: ["md"] }]
            })
            .then((result) => {
                // console.log("importFiles: ", result)

                if (result.canceled) {
                    return
                }

                const fileArr = result.filePaths.map((path) => {
                    const newID = uuidv4()
                    const newPath = join(savedLocation, `${newID}.md`)
                    const newFile = {
                        id: newID,
                        title: basename(path, extname(path)),
                        oldPath: path,
                        path: newPath,
                        content: "",
                        createdAt: new Date().getTime()
                    }
                    return newFile
                })

                const importFileArr = fileArr.filter(async (file) => {
                    try {
                        await fileHelper.copyFile(file.oldPath, file.path)
                        return true
                    } catch {
                        return false
                    }
                })

                if (importFileArr.length > 0) {
                    setFileMap((preFileMap) => {
                        const newFileMap = { ...preFileMap, ...ArrToMap(importFileArr) }

                        // 数据持久化
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })

                    dialog.showMessageBox({
                        type: "info",
                        title: `恭喜`,
                        message: `成功导入了${importFileArr.length}个文件`
                    })
                }
            })
    }

    const changeLoadingStatus = (event, args) => {
        setLoadState(args)
    }

    // -----------------------------------------------------------
    const uploadAllFileSuccess = (event, args) => {
        // 不做处理。
    }
    const downloadAllFileSuccess = (event, args) => {
        // 不做处理。
    }
    const autoSyncUploadSuccess = (event, { id }) => {
        setFileMap((preFileMap) => {
            const file = { ...fileMap[id], isSynced: true, syncedAt: new Date().getTime() }
            const newFileMap = { ...preFileMap, [id]: file }

            saveFileMapToStore(newFileMap)

            return newFileMap
        })
    }
    const autoSyncDownloadSuccess = (event, args) => {
        const file = fileMap[args.id]
        fileHelper
            .readFile(file.path)
            .then((content) => {
                if (args.ret === 1) {
                    setFileMap((preFileMap) => {
                        const newFile = { ...preFileMap[args.id] }
                        newFile.content = content
                        newFile.isLoaded = true
                        newFile.isSynced = true
                        newFile.syncedAt = new Date().getTime()

                        const newFileMap = { ...preFileMap, [args.id]: newFile }

                        // 需要持久化数据
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })
                } else if (args.ret <= 1) {
                    setFileMap((preFileMap) => {
                        const newFile = { ...preFileMap[args.id] }
                        newFile.content = content
                        newFile.isLoaded = true
                        // newFile.isSynced = true
                        // newFile.syncedAt = new Date().getTime()

                        const newFileMap = { ...preFileMap, [args.id]: newFile }

                        // 需要持久化数据
                        saveFileMapToStore(newFileMap)

                        return newFileMap
                    })
                }
            })
            .catch((err) => {
                dialog.showErrorBox("错误", "文件读取失败")
            })
    }
    const autoSyncDeleteSuccess = (event, args) => {
        // 不做处理。
    }

    const autoSyncRenameSuccess = (event, args) => {
        // 不做处理。
    }
    // 监听事件
    useIPCRenderer({
        "upload-all-file-success": uploadAllFileSuccess,
        "download-all-file-success": downloadAllFileSuccess,
        "auto-sync-upload-success": autoSyncUploadSuccess,
        "auto-sync-download-success": autoSyncDownloadSuccess,
        "auto-sync-delete-success": autoSyncDeleteSuccess,
        "auto-sync-rename-success": autoSyncRenameSuccess,
        "create-file": createFile,
        "import-files": importFiles,
        "save-file": saveFile,
        "loading-status": changeLoadingStatus
    })

    const renderLeft = () => {
        return (
            <>
                <Search title="我的云笔记" onSearch={searchFiles} />
                <FileList fileArr={searchState > 0 ? searchedFiles : fileArr} onFileClick={openFile} onFileSave={saveFileTitle} onFileDelete={deleteFile}></FileList>
                <div className="row">
                    <div className="col">
                        <IconButton classes={"btn-primary"} text="新建" icon={faPlus} onClick={createFile}></IconButton>
                    </div>
                    <div className="col">
                        <IconButton classes={"btn-success"} text="导入" icon={faFileImport} onClick={importFiles}></IconButton>
                    </div>
                </div>
            </>
        )
    }

    const renderRight = () => {
        if (openedFileIDs.length > 0) {
            return (
                <>
                    <TabList openFiles={openedFiles} activeID={activeFileID} unsavedIDs={unsavedFileIDs} onTabClick={changeTab} onCloseTab={closeTab}></TabList>
                    <div className="editor-zone">
                        <MdEditor key={activeFile && activeFile.id} file={activeFile} onFileChange={changeFile}></MdEditor>
                    </div>
                </>
            )
        }
    }

    return (
        <div className="page">
            <div className="content-zone">
                <div className="left">{renderLeft()}</div>
                <div className="right">{renderRight()}</div>
            </div>
            <div className="status-bar">
                {loadState && <Loader />}
                {activeFile && activeFile.isSynced && <div className="sync-status">已同步，上次同步时间：{FormatTime(activeFile.syncedAt)}</div>}
            </div>
        </div>
    )
}

export default App
