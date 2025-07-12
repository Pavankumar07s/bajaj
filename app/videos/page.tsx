"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Clock, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Video {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  description: string
  duration: string
  viewCount: string
  publishedAt: string
}

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setLoading(true)
    setSearchPerformed(true)

    try {
      const response = await fetch(`/api/videos?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      const formattedVideos = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
      }))

      setVideos(formattedVideos)
    } catch (error) {
      console.error("Error searching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Electronics Engineering Video Tutorials</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for electronics tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {!searchPerformed && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Search Topics</h2>
          <div className="flex flex-wrap gap-2">
            {popularTopics.map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                className="border-amber-200 hover:bg-amber-50"
                onClick={() => {
                  setSearchQuery(topic)
                  handleSearch({ preventDefault: () => {} } as React.FormEvent)
                }}
              >
                {topic}
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : searchPerformed ? (
        <div className="text-center text-muted-foreground mt-12">
          <p>No videos found for "{searchQuery}". Try a different search term.</p>
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-12">
          <p>Search for electronics engineering topics to see video tutorials.</p>
        </div>
      )}
    </div>
  )
}

interface VideoCardProps {
  video: Video
}

function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="aspect-video overflow-hidden relative group">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            variant="secondary"
            className="bg-white/90 hover:bg-white"
            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
          >
            Play Video
          </Button>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-lg">{video.title}</CardTitle>
        <CardDescription>{video.channelTitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{video.description}</p>
        <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{video.channelTitle}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
        >
          Watch on YouTube
        </Button>
      </CardFooter>
    </Card>
  )
}

// Helper function to generate mock videos for demonstration
function generateMockVideos(query: string): Video[] {
  // Normalize the query to match with our predefined topics
  const normalizedQuery = query.toLowerCase()

  // Define specific video sets for common electronics topics
  const videoSets: Record<string, Partial<Video>[]> = {
    "circuit theory": [
      {
        id: "circuit-1",
        title: "Circuit Theory Fundamentals - Ohm's Law and Kirchhoff's Laws",
        channelTitle: "Electronics Engineering Hub",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Circuit+Theory",
        description:
          "Learn the fundamental principles of circuit theory including Ohm's Law and Kirchhoff's Laws with practical examples.",
        duration: "15:42",
        viewCount: "245K",
        publishedAt: "2023-05-15",
      },
      {
        id: "circuit-2",
        title: "Node Voltage Method - Circuit Analysis Made Easy",
        channelTitle: "Electronics Simplified",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Node+Voltage",
        description: "A step-by-step guide to the Node Voltage Method for analyzing complex circuits efficiently.",
        duration: "22:18",
        viewCount: "189K",
        publishedAt: "2023-07-22",
      },
      {
        id: "circuit-3",
        title: "Thevenin and Norton Equivalent Circuits Explained",
        channelTitle: "Circuit Theory Academy",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Thevenin+Norton",
        description:
          "Learn how to simplify complex circuits using Thevenin and Norton equivalent circuits with practical examples.",
        duration: "18:35",
        viewCount: "210K",
        publishedAt: "2023-04-10",
      },
    ],
    "digital electronics": [
      {
        id: "digital-1",
        title: "Logic Gates Fundamentals - AND, OR, NOT, XOR",
        channelTitle: "Digital Systems Pro",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Logic+Gates",
        description:
          "Comprehensive tutorial on basic logic gates, their truth tables, and implementations in digital circuits.",
        duration: "24:15",
        viewCount: "320K",
        publishedAt: "2023-03-18",
      },
      {
        id: "digital-2",
        title: "Flip-Flops and Latches in Digital Electronics",
        channelTitle: "Electronics Engineering Hub",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Flip+Flops",
        description: "Detailed explanation of various flip-flops and latches used in sequential digital circuits.",
        duration: "28:42",
        viewCount: "275K",
        publishedAt: "2023-06-05",
      },
      {
        id: "digital-3",
        title: "Karnaugh Maps and Boolean Algebra Simplification",
        channelTitle: "Digital Logic Design",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Karnaugh+Maps",
        description: "Learn how to simplify Boolean expressions using Karnaugh Maps and Boolean algebra techniques.",
        duration: "32:10",
        viewCount: "198K",
        publishedAt: "2023-02-28",
      },
    ],
    "analog electronics": [
      {
        id: "analog-1",
        title: "Operational Amplifiers - Working Principles and Applications",
        channelTitle: "Analog Circuit Design",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Op+Amps",
        description:
          "Comprehensive guide to operational amplifiers, their characteristics, and common circuit configurations.",
        duration: "35:22",
        viewCount: "290K",
        publishedAt: "2023-04-25",
      },
      {
        id: "analog-2",
        title: "Transistor Biasing Techniques Explained",
        channelTitle: "Electronics Simplified",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Transistor+Biasing",
        description: "Learn different methods of biasing transistors in analog circuits with practical examples.",
        duration: "27:15",
        viewCount: "215K",
        publishedAt: "2023-07-12",
      },
      {
        id: "analog-3",
        title: "Filter Design in Analog Electronics",
        channelTitle: "Analog Systems Pro",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Filter+Design",
        description:
          "Step-by-step guide to designing low-pass, high-pass, band-pass, and band-stop filters in analog circuits.",
        duration: "40:05",
        viewCount: "180K",
        publishedAt: "2023-05-30",
      },
    ],
    microprocessors: [
      {
        id: "micro-1",
        title: "8085 Microprocessor Architecture Explained",
        channelTitle: "Microprocessor Systems",
        thumbnail: "/placeholder.svg?height=200&width=360&text=8085+Architecture",
        description:
          "Detailed explanation of 8085 microprocessor architecture, registers, and instruction execution cycle.",
        duration: "45:18",
        viewCount: "310K",
        publishedAt: "2023-03-10",
      },
      {
        id: "micro-2",
        title: "Assembly Language Programming for Beginners",
        channelTitle: "Programming Simplified",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Assembly+Language",
        description: "Introduction to assembly language programming concepts with examples for microprocessors.",
        duration: "38:42",
        viewCount: "265K",
        publishedAt: "2023-06-22",
      },
      {
        id: "micro-3",
        title: "Interfacing Peripherals with Microprocessors",
        channelTitle: "Electronics Engineering Hub",
        thumbnail: "/placeholder.svg?height=200&width=360&text=Interfacing",
        description:
          "Learn how to interface various peripherals like LEDs, LCDs, keyboards, and sensors with microprocessors.",
        duration: "50:15",
        viewCount: "225K",
        publishedAt: "2023-04-18",
      },
    ],
  }

  // Check if the query matches any of our predefined topics
  for (const [topic, videos] of Object.entries(videoSets)) {
    if (normalizedQuery.includes(topic)) {
      return videos as Video[]
    }
  }

  // If no specific match, generate generic electronics videos
  return Array.from({ length: 9 }, (_, i) => {
    const id = `video-${i + 1}`
    const viewCount = `${Math.floor(Math.random() * 500) + 100}K`
    const minutes = Math.floor(Math.random() * 30) + 10
    const seconds = Math.floor(Math.random() * 60)
    const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`

    return {
      id,
      title: `${query} Tutorial for Electronics Engineering - Part ${i + 1}`,
      channelTitle: `Electronics Academy ${Math.floor(Math.random() * 10) + 1}`,
      thumbnail: `/placeholder.svg?height=200&width=360&text=${query.replace(/\s+/g, "+")}+${i + 1}`,
      description: `This comprehensive tutorial covers ${query} concepts for electronics engineering students. Learn the theory and practical applications with detailed examples.`,
      duration,
      viewCount,
      publishedAt: `2023-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, "0")}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, "0")}`,
    }
  })
}

const popularTopics = [
  "Circuit Theory",
  "Digital Electronics",
  "Analog Electronics",
  "Microprocessors",
  "Power Electronics",
  "Control Systems",
  "VLSI Design",
  "Communication Systems",
]
