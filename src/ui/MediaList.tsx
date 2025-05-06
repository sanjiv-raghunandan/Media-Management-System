import React from 'react'
import { MediaItem } from './MediaItem'
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Loader2, Trash2, ExternalLink, Play } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog"

const { ipcRenderer } = window.require("electron")

interface MediaListProps {
  mediaItems: MediaItem[]
  isLoading: boolean
  onPreview: (item: MediaItem) => void
  onDelete: (id: number) => void
}

export function MediaList({ mediaItems, isLoading, onPreview, onDelete }: MediaListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const openMediaInApp = async (mediaItem: MediaItem) => {
    try {
      const response = await ipcRenderer.invoke('open-media', mediaItem.path);
      if (response.includes('Unsupported media type')) {
        alert('This media type is not supported!');
      } else {
        console.log(response);
      }
    } catch (error) {
      console.error('Error opening media:', error);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {mediaItems.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="aspect-square mb-2 bg-muted flex items-center justify-center">
              {item.type === 'image' ? (
                <img src={item.path} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="text-4xl">{item.type.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{item.format}</p>
            <div className="flex justify-between">
              <Button className="lg:w-1/3" variant="outline" size="sm" onClick={() => onPreview(item)}>
                <Play className="w-5 h-5" />
              </Button>
              <Button className="lg:w-1/3" variant="outline" size="sm" onClick={() => openMediaInApp(item)}>
                <ExternalLink className="w-5 h-5" />
                <span className="sr-only">Open</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="lg:w-1/3" variant="outline" size="sm">
                    <Trash2 className="w-5 h-5" />
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
                    <AlertDialogAction onClick={() => onDelete(item.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


