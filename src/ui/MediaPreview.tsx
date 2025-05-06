import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MediaItem } from './MediaItem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface MediaPreviewProps {
  selectedItem: MediaItem | null
}

export function MediaPreview({ selectedItem }: MediaPreviewProps) {
  return (
    <Card className="flex-grow md:w-1/2 lg:w-2/3">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Selected media preview</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100vh-300px)] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div
              key={selectedItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <h2 className="text-xl font-semibold mb-4">{selectedItem.name}</h2>
              {selectedItem.type === 'image' && (
                <img src={selectedItem.path} alt={selectedItem.name} className="max-w-full max-h-[calc(100%-2rem)] object-contain rounded-lg shadow-md" />
              )}
              {selectedItem.type === 'video' && (
                <video src={selectedItem.path} controls className="max-w-full max-h-[calc(100%-2rem)] rounded-lg shadow-md" />
              )}
              {selectedItem.type === 'audio' && (
                <audio src={selectedItem.path} controls className="w-full max-w-md" />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-muted-foreground"
            >
              Select an item to preview
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
