export interface MediaItem {
  id: number
  name: string
  type: 'image' | 'video' | 'audio'
  path: string
}
