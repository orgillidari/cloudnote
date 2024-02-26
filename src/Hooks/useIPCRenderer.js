import { useEffect } from "react"

const { ipcRenderer } = window.require("electron")

const useIPCRenderer = (ipcMap) => {
    useEffect(() => {
        Object.entries(ipcMap).forEach(([key, value]) => {
            ipcRenderer.on(key, value)
        })
        return () => {
            Object.entries(ipcMap).forEach(([key, value]) => {
                ipcRenderer.removeListener(key, value)
            })
        }
    })
}

export default useIPCRenderer
