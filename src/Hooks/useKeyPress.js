import { useState, useEffect } from "react"

const useKeyPress = ({ flag = "--", keyCode }) => {
    // console.log("----- Hook【useKeyPress】for【", flag, " on ", keyCode, "】")
    const [keyState, setKeyState] = useState(false)

    // 通过 event.repeat 去除重复事件调用。
    const keydownHandler = (event) => {
        if (keyCode === event.keyCode && !event.repeat) {
            // console.log("--------- ----- Func【keydownHandler】for【", flag, "】: ", keyCode)
            setKeyState(true)
        }
    }

    // 通过 event.repeat 去除重复事件调用。
    const keyupHandler = (event) => {
        if (keyCode === event.keyCode && !event.repeat) {
            // console.log("--------- ----- Func【keyupHandler】for【", flag, "】: ", keyCode)
            setKeyState(false)
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", keydownHandler)
        document.addEventListener("keyup", keyupHandler)
        return () => {
            document.removeEventListener("keydown", keydownHandler)
            document.removeEventListener("keyup", keyupHandler)
        }
    })

    return keyState
}

export default useKeyPress
