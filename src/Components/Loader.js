import "./Loader.scss"

import React from "react"

const Loader = ({ text = "执行中" }) => {
    return (
        <div className="my-loader">
            <div className="spinner-border my-spinner" role="status"></div>
            <span className="my-spinner-tips">{text}</span>
        </div>
    )
}

export default Loader
