'use client'

import { Dropzone, ExtFile, FileMosaic, uploadFile } from "@files-ui/react"

export const DragAndDrop = ({
    tranfromImageToCode
}:{
    tranfromImageToCode: (file: File) => Promise<void>
}) => {
    const uploadFiles = (files: ExtFile[]) => {
        const file = files[0].file
        if(file != null) tranfromImageToCode(file)
    }

    return(
        <Dropzone
            header = {false}
            footer = {false}
            maxFiles={1}
            label="Arrastra tu imagen aqui"
            accept="image/*"
            onChange={uploadFiles}
        />
    )
}