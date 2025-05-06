'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "../components/ui/label"
import { Folder, ChevronRight, Loader2, Plus, FileUp, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { useToast } from "../hooks/use-toast"
import { Checkbox } from "../components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog"

const { ipcRenderer } = window.require("electron");

interface Collection {
  id: number;
  name: string;
  description: string;
  itemCount: number;
}

interface MediaItem {
  id: number;
  name: string;
  type: string;
  path: string;
  format: string;
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddFilesDialogOpen, setIsAddFilesDialogOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchCollections()
    fetchAllMediaItems()
  }, [])

  const fetchCollections = async () => {
    try {
      const data = await ipcRenderer.invoke("fetch-collections");
      setCollections(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setIsLoading(false);
    }
  }

  const fetchAllMediaItems = async () => {
    try {
      const data = await ipcRenderer.invoke("fetch-media");
      setAllMediaItems(data);
    } catch (error) {
      console.error("Error fetching all media items:", error);
    }
  }

  const handleCollectionSelect = async (collection: Collection) => {
    setSelectedCollection(collection)
    setIsLoading(true)
    try {
      const data = await ipcRenderer.invoke("fetch-media-in-collection", collection.id);
      setMediaItems(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching media items:", error);
      setIsLoading(false);
    }
  }

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await ipcRenderer.invoke("add-collection", newCollectionName, newCollectionDescription);
      await fetchCollections()
      setIsDialogOpen(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
      toast({
        title: "Success",
        description: "New collection added successfully",
      })
    } catch (error) {
      console.error("Error adding collection:", error);
      toast({
        title: "Error",
        description: "Failed to add new collection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFilesToCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await ipcRenderer.invoke("add-files-to-collection", selectedCollection?.id, selectedFiles);
      await handleCollectionSelect(selectedCollection!)
      setIsAddFilesDialogOpen(false)
      setSelectedFiles([])
      toast({
        title: "Success",
        description: "Files added to collection successfully",
      })
    } catch (error) {
      console.error("Error adding files to collection:", error);
      toast({
        title: "Error",
        description: "Failed to add files to collection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleDeleteMediaItem = async (mediaId: number) => {
    setIsLoading(true)
    try {
      const result = await ipcRenderer.invoke("delete-media-item", mediaId);
      if (result.success) {
        setMediaItems(prev => prev.filter(item => item.id !== mediaId));
        toast({
          title: "Success",
          description: "Media item deleted successfully",
        })
      } else {
        throw new Error("Failed to delete media item");
      }
    } catch (error) {
      console.error("Error deleting media item:", error);
      toast({
        title: "Error",
        description: "Failed to delete media item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Collections</h1>
      {!selectedCollection ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Collections</CardTitle>
              <CardDescription>Manage your media collections</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Collection</DialogTitle>
                  <DialogDescription>
                    Create a new collection to organize your media.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCollection}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Collection'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell>{collection.name}</TableCell>
                      <TableCell>{collection.description}</TableCell>
                      <TableCell>{collection.itemCount}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCollectionSelect(collection)}
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedCollection.name}</CardTitle>
              <CardDescription>{selectedCollection.description}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCollection(null)}
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Back to Collections
              </Button>
              <Dialog open={isAddFilesDialogOpen} onOpenChange={setIsAddFilesDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <FileUp className="w-4 h-4 mr-2" />
                    Add Files
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Files to Collection</DialogTitle>
                    <DialogDescription>
                      Select files to add to this collection.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddFilesToCollection}>
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                      {allMediaItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`file-${item.id}`}
                            checked={selectedFiles.includes(item.id)}
                            onCheckedChange={() => handleFileSelect(item.id)}
                          />
                          <Label htmlFor={`file-${item.id}`}>{item.name}</Label>
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading || selectedFiles.length === 0}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Files'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mediaItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.format}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the media item
                                from your database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMediaItem(item.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
