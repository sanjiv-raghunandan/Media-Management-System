import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from "./button"
import { Input } from "./input"

interface SearchBarProps {
  onSearch: (term: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  return (
    <div className="flex mb-6">
      <Input
        type="text"
        placeholder="Search media..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mr-2"
      />
      <Button onClick={handleSearch}>
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  )
}
