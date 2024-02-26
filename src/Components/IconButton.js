import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const IconButton = ({ classes, text, icon, onClick }) => {
    return (
        <button type="button" className={`btn btn-block border-0 ${classes}`} onClick={onClick}>
            <FontAwesomeIcon className="mr-3" icon={icon} size="lg" />
            {text}
        </button>
    )
}

export default IconButton
