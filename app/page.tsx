import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  BookOpen,
  Youtube,
  FileQuestion,
  MessageSquare,
  Cpu,
  Zap,
  CircuitBoardIcon as Circuit,
  MicroscopeIcon as Microchip,
} from "lucide-react"
import ChatPage from "./chat/page"


export default function Home() {
  return (
    <ChatPage />
  )
}

