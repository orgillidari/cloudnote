import { useRef, useEffect } from "react"

const { getCurrentWindow, Menu, MenuItem } = window.require("@electron/remote")

const useContextMenu = ({ flag = "--", items, targetSelector }) => {
    let clickedElement = useRef(null)

    useEffect(() => {
        // 创建菜单对象
        const menu = new Menu()
        items.forEach((item) => {
            menu.append(new MenuItem(item))
        })

        const handleContextMenu = (event) => {
            // 仅指定的元素才能触发右键菜单
            const target = document.querySelector(targetSelector)
            if (target && target.contains(event.target)) {
                clickedElement.current = event.target
                menu.popup({ window: getCurrentWindow() })
            }
        }

        window.addEventListener("contextmenu", handleContextMenu)

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu)
        }
    })

    return clickedElement
}

export default useContextMenu
