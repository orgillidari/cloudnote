import React, { useState, useEffect, useRef } from "react"
import useKeyPress from "../Hooks/useKeyPress"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons"

const Search = ({ title, onSearch }) => {
    // console.log("----- 组件【Search】")
    const [searchState, setSearchState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const escPressed = useKeyPress({ flag: "Search", keyCode: 27 })
    let node = useRef(null)

    const startSearch = () => {
        setSearchState(true)
    }

    const closeSearch = () => {
        setSearchState(false)

        setSearchValue("")
        onSearch(false, "")
    }

    const onChangeHandler = (e) => {
        setSearchValue(e.target.value)
        onSearch(true, e.target.value)
    }

    useEffect(() => {
        if (searchState && escPressed) {
            closeSearch()
        }
    }, [escPressed]) // 防止无限循环

    useEffect(() => {
        if (searchState && node.current) {
            node.current.focus()
        }
    }, [searchState])

    if (!searchState) {
        return (
            <div className="input-group">
                <span className="form-control">{title}</span>
                <div className="input-group-append" onClick={startSearch}>
                    <button className="btn btn-outline-secondary" type="button">
                        <FontAwesomeIcon icon={faMagnifyingGlass} size="sm" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="input-group">
            <input ref={node} type="text" className="form-control" value={searchValue} onChange={onChangeHandler} />
            <div className="input-group-append" onClick={closeSearch}>
                <span className="input-group-text">
                    <FontAwesomeIcon icon={faXmark} size="lg" />
                </span>
            </div>
        </div>
    )
}

export default Search
