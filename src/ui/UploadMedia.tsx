'use client'

import React, { useRef, useState } from 'react'
import { Upload, Folder } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription, AlertTitle } from './alert'

const { ipcRenderer } = window.require("electron")

interface UploadMediaProps {
  onUploadComplete: () => void
}

export function UploadMedia({ onUploadComplete }: UploadMediaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

 /* const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    console.log(files)
    if (files && files.length > 0) {
      try {
        const filePaths = Array.from(files).map(file => file.path)
        console.log('File paths to be uploaded:', filePaths)
        await ipcRenderer.invoke('upload-media', filePaths)
        setUploadSuccess(true)
        onUploadComplete()
      } catch (error) {
        console.error('Error uploading files:', error)
        setUploadSuccess(false)
      }
    }
  } */
  const handleFileSelection = async () => {
    const filePaths = await ipcRenderer.invoke("dialog:openFiles"); // Call the exposed API
    if (!filePaths || filePaths.length === 0) {
      console.log("No files selected");
      return;
    }
    console.log("Selected file paths:", filePaths); // Log full paths
    await handleFileUpload(filePaths);
  };

  const handleFileUpload = async (filePaths: string[]) => {
    try {
	const result = await ipcRenderer.invoke("upload-media", filePaths);
      console.log(result); // Handle success
    } catch (error) {
      console.error(error); // Handle errors
    }
  };


const handleFolderSelection = async () => {
    const folderPath = await ipcRenderer.invoke("dialog:openFolder"); // Call the exposed API
    if (!folderPath || folderPath.length === 0) {
      console.log("No files selected");
      return;
    }
    console.log("Selected file paths:", folderPath); // Log full paths
    await handleFolderUpload(folderPath);
  };
  const handleFolderUpload = async (folderPath: string[]) => {
    try {
	const result = await ipcRenderer.invoke("upload-media-folder", folderPath);
      console.log(result); // Handle success
    } catch (error) {
      console.error(error); // Handle errors
    }
  };
    return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
        <CardDescription>Choose files or a folder to upload</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
         <Button
          onClick={handleFileSelection}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderSelection}
          // @ts-ignore
          directory=""
          webkitdirectory=""
          className="hidden"
        />
        <Button
          onClick={() => folderInputRef.current?.click()}
          className="w-full"
          variant="outline"
        >
          <Folder className="mr-2 h-4 w-4" />
          Upload Folder
        </Button>
        {uploadSuccess && (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Media added successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

