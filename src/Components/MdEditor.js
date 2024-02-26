import React, { useState, useEffect } from "react"

import Vditor from "vditor"
import "vditor/dist/index.css"

const MdEditor = ({ file, onFileChange }) => {
    const [vd, setVd] = useState(null)
    useEffect(() => {
        const vditor = new Vditor("vditor", {
            width: "100%",
            height: "100%",
            theme: "classic",
            mode: "ir",
            value: file.content,
            cache: {
                enable: false
            },
            preview: {
                markdown: {
                    codeBlockPreview: false
                }
            },
            // cdn: "http://192.168.5.201/vditor",
            after: () => {
                setVd(vditor)
            },
            input: (val) => {
                onFileChange(file.id, val)
            }
        })
        // // 组件销毁时，销毁vditor实例，这里会有问题。
        // return () => {
        //     if (vditor) {
        //         vditor.destroy()
        //         setVd(null)
        //     }
        // }
    }, [])

    useEffect(() => {
        if (vd) {
            vd.setValue(file.content)
        }
    }, [vd, file.content])

    return <div id="vditor" />
}

export default MdEditor
