import "./FileList.scss"

import React, { useState, useEffect, useLayoutEffect, useRef } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEdit, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faMarkdown } from "@fortawesome/free-brands-svg-icons"

import { GetParentNode } from "../utils/helper.js"
import useKeyPress from "../Hooks/useKeyPress"
import useContextMenu from "../Hooks/useContextMenu"

const FileList = ({ fileArr, onFileClick, onFileSave, onFileDelete }) => {
    // console.log("----- 组件【FileList】")
    const [editStatus, setEditStatus] = useState(false)
    const [title, setTitle] = useState("")

    let node = useRef(null)

    const enterPressed = useKeyPress({ flag: "FileList", keyCode: 13 })
    const escPressed = useKeyPress({ flag: "FileList", keyCode: 27 })
    const clickedElement = useContextMenu({
        flag: "FileList",
        items: [
            {
                label: "打开",
                click: () => {
                    console.log("打开")
                    const parentElement = GetParentNode(clickedElement.current, "content-menu-item")
                    if (parentElement) {
                        onFileClick(parentElement.dataset.id)
                    }
                }
            },
            {
                label: "编辑",
                click: () => {
                    console.log("编辑")
                    const parentElement = GetParentNode(clickedElement.current, "content-menu-item")
                    if (parentElement) {
                        // onFileSave(parentElement.dataset.id, parentElement.dataset.title)
                        setEditStatus(parentElement.dataset.id)
                        setTitle(parentElement.dataset.title)
                    }
                }
            },
            {
                label: "删除",
                click: () => {
                    console.log("删除")
                    const parentElement = GetParentNode(clickedElement.current, "content-menu-item")
                    if (parentElement) {
                        onFileDelete(parentElement.dataset.id)
                    }
                }
            }
        ],
        targetSelector: ".content-menu"
    })

    const closeEdit = (file) => {
        setEditStatus(false)
        setTitle("")
    }

    useEffect(() => {
        const file = fileArr.find((file) => {
            return file.id === editStatus
        })
        if (editStatus && enterPressed) {
            if (title.trim() !== "") {
                onFileSave(file.id, title)
                closeEdit(file)
            }
        }
        if (editStatus && escPressed) {
            if (file.isNew) {
                onFileDelete(file.id)
            }
            closeEdit(file)
        }
    }, [enterPressed, escPressed]) // 防止无限循环

    useEffect(() => {
        // 切换编辑的文件时：删除新建文件
        if (editStatus) {
            const newFile = fileArr.find((file) => {
                return file.isNew
            })

            if (newFile && newFile.id !== editStatus) {
                onFileDelete(newFile.id)
            }
        }

        // 设置焦点
        if (editStatus && node.current) {
            // 当编辑一个标题时，再次点击新建这里node.current为null，为什么？
            node.current.focus()
        }
    }, [editStatus])

    useLayoutEffect(() => {
        const newFile = fileArr.find((file) => {
            return file.isNew
        })
        if (newFile) {
            setEditStatus(newFile.id)
            setTitle(newFile.title)
            if (node.current) {
                node.current.focus()
            }
        }
    }, [fileArr])

    return (
        <div className="wrapper">
            <ul className="list-group list-group-flush content-menu">
                {fileArr.map((file) => (
                    <li className="list-group-item row no-gutters d-flex align-items-center content-menu-item" key={file.id} data-id={file.id} data-title={file.title}>
                        {file.id !== editStatus && (
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon icon={faMarkdown} size="lg" />
                                </span>
                                <span
                                    className="col-6 my-link"
                                    onClick={() => {
                                        onFileClick(file.id)
                                    }}
                                >
                                    {file.title}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-light col-2"
                                    onClick={() => {
                                        setEditStatus(file.id)
                                        setTitle(file.title)
                                    }}
                                >
                                    <FontAwesomeIcon title="编辑" icon={faEdit} size="lg" />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-light col-2"
                                    onClick={() => {
                                        onFileDelete(file.id)
                                    }}
                                >
                                    <FontAwesomeIcon title="删除" icon={faTrash} size="lg" />
                                </button>
                            </>
                        )}
                        {file.id === editStatus && (
                            <>
                                <input
                                    ref={node}
                                    className="col-10"
                                    value={title}
                                    placeholder="请输入文件名称"
                                    onChange={(e) => {
                                        setTitle(e.target.value)
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-light col-2"
                                    onClick={() => {
                                        // 删除新建的文件
                                        if (file.isNew) {
                                            onFileDelete(file.id)
                                        }
                                        closeEdit(file)
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXmark} size="lg" />
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default FileList
