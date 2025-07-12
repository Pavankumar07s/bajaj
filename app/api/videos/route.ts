import { NextResponse } from "next/server"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY // Add this to your .env file

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&q=${encodeURIComponent(
      query + " electronics engineering"
    )}&type=video&key=${YOUTUBE_API_KEY}`
  )

  const data = await response.json()
  
  return NextResponse.json(data)
}