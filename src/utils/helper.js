// 将数组转换成字典
export function ArrToMap(arr) {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

// 将字典转换成数组
export function MapToArr(map) {
    return Object.keys(map).map((key) => map[key])
}

// 格式化数据-使数据符合存储要求
export function FormatFileMap(fileMap) {
    return MapToArr(fileMap).reduce((map, file) => {
        const { id, title, path, createdAt, isSynced, syncedAt } = file
        map[id] = {
            id,
            title,
            path,
            createdAt,
            isSynced,
            syncedAt
        }
        return map
    }, {})
}

// 获取DOM元素的父元素
export function GetParentNode(node, parentClassName) {
    let current = node
    while (current !== null) {
        if (current.classList.contains(parentClassName)) {
            return current
        }
        current = current.parentNode
    }
    return false
}

// 格式化时间戳
export function FormatTime(timestamp) {
    return new Date(timestamp).toLocaleString()
}
