'use client'

import React, { useState, useEffect } from 'react'
import { MediaItem } from './MediaItem'
import { SearchBar } from './SearchBar'
import { MediaList } from './MediaList'
import { MediaPreview } from './MediaPreview'
import { UploadMedia } from './UploadMedia'
import Collections from './Collections'
import { Moon, Sun, Upload, Home, FolderOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Modal } from './Modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog"
import { useToast } from "../hooks/use-toast"

const { ipcRenderer } = window.require("electron");

export default function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const { toast } = useToast()
 
  useEffect(() => {
    fetchMediaItems();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filteredItems = mediaItems.filter(item =>
      item.name.toLowerCase().includes(term.toLowerCase())
    )
    setMediaItems(filteredItems)
  }

  const handlePreview = (item: MediaItem) => {
    setSelectedItem(item)
  }
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const fetchMediaItems = async () => {
    try {
      const data = await ipcRenderer.invoke("fetch-media");
      setMediaItems(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching media items:", error);
      setIsLoading(false);
    }
  };

  const handleUploadComplete = () => {
    fetchMediaItems();
    setIsUploadModalOpen(false);
  }

  const handleDeleteMediaItem = async (mediaId: number) => {
    setIsLoading(true)
    try {
      const result = await ipcRenderer.invoke("delete-media-item", mediaId);
      if (result.success) {
        setMediaItems(prev => prev.filter(item => item.id !== mediaId));
        if (selectedItem && selectedItem.id === mediaId) {
          setSelectedItem(null);
        }
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
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Media Manager</h1>
        <nav className="space-y-2">
          <Button
            variant={currentPage === 'home' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentPage('home')}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button
            variant={currentPage === 'collections' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentPage('collections')}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Collections
          </Button>
        </nav>
        <div className="mt-auto">
          <Button variant="outline" size="icon" onClick={toggleDarkMode} className="w-full">
            {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          {currentPage === 'home' && (
            <>
              <SearchBar onSearch={handleSearch} />
              <Button onClick={() => setIsUploadModalOpen(true)} className="mb-4">
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/2">

                  <MediaList
                    mediaItems={mediaItems}
                    isLoading={isLoading}
                    onPreview={handlePreview}
                    onDelete={handleDeleteMediaItem}
                  />
                </div>
                <div className="lg:w-1/2">
                  <MediaPreview selectedItem={selectedItem} />
                </div>
              </div>
            </>
          )}
          {currentPage === 'collections' && <Collections />}
        </div>
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
        <UploadMedia onUploadComplete={handleUploadComplete} />
      </Modal>
    </div>
  )
}
