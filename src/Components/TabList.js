import "./TabList.scss"

import React from "react"
import classNames from "classnames"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

const TabList = ({ openFiles, activeID, unsavedIDs, onTabClick, onCloseTab }) => {
    return (
        <ul className="nav nav-tabs tab-list-component">
            {openFiles.map((file) => {
                const isUnsaved = unsavedIDs.includes(file.id)
                // 使用 fClassName 包
                const fClassName = classNames({
                    "nav-link": true,
                    "active": file.id === activeID,
                    "isUnsaved": isUnsaved
                })
                return (
                    <li className="nav-item" key={file.id}>
                        <a
                            // className={`nav-link ${file.id === activeID ? "active" : ""}`}
                            className={fClassName}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault()
                                onTabClick(file.id)
                            }}
                        >
                            {file.title}
                            <FontAwesomeIcon
                                className="ml-2 close-icon"
                                icon={faXmark}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCloseTab(file.id)
                                }}
                            />
                            <span className="ml-2 unsaved-icon"></span>
                        </a>
                    </li>
                )
            })}
        </ul>
    )
}

export default TabList
