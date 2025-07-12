"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Zap, BookOpen, FileQuestion, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
)

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface PDFContext {
  content: string;
  fileName: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      content:
        "Hello! I'm your Financial Services AI Assistant. I can help you with queries about loans, insurance, credit cards, EMI, investments, and more. You can ask me to check your eligibility, suggest loan or investment products, or answer any finance-related questions. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const [pdfContext, setPdfContext] = useState<PDFContext | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process PDF")
      }

      const data = await response.json()
      setPdfContext({
        content: data.content,
        fileName: file.name,
      })

      // Add a system message about the PDF context
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `PDF context loaded: ${file.name}. You can now ask questions about this document.`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, systemMessage])
    } catch (error) {
      console.error("Error uploading PDF:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true);

    try {
      // Call the Groq API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          pdfContext: pdfContext?.content, 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI API")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating response:", error)

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced chart parsing function
  function tryParseChart(content: string) {
    try {
      const match = content.match(/```(?:json|chart)\s*([\s\S]*?)```/i)
      if (match) {
        const data = JSON.parse(match[1])
        if (data && data.type && data.data) {
          // Validate supported chart types
          if (["bar", "pie", "line"].includes(data.type)) {
            return data
          }
        }
      }
    } catch {}
    return null
  }

  // Chart components
  function BarChartComponent({ data }: { data: any[] }) {
    const chartData = {
      labels: data.map((d) => d.name),
      datasets: [{
        label: "Value",
        data: data.map((d) => d.value),
        backgroundColor: [
          '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e',
          '#f97316', '#06b6d4', '#22c55e', '#a855f7', '#ec4899'
        ],
        borderColor: "#000000",
        borderWidth: 1,
      }],
    }
    
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' as const },
        title: { display: false },
      },
    }

    return <Bar data={chartData} options={options} />
  }

  function PieChartComponent({ data }: { data: any[] }) {
    const chartData = {
      labels: data.map((d) => d.name),
      datasets: [{
        data: data.map((d) => d.value),
        backgroundColor: [
          '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e',
          '#f97316', '#06b6d4', '#22c55e', '#a855f7', '#ec4899'
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      }],
    }
    
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' as const },
      },
    }

    return <Pie data={chartData} options={options} />
  }

  function LineChartComponent({ data }: { data: any[] }) {
    const chartData = {
      labels: data.map((d) => d.name),
      datasets: [{
        label: "Value",
        data: data.map((d) => d.value),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.1,
        fill: true,
      }],
    }
    
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' as const },
      },
      scales: {
        y: { beginAtZero: true },
      },
    }

    return <Line data={chartData} options={options} />
  }

  // Update the renderAssistantContent function
  function renderAssistantContent(content: string) {
    const chartData = tryParseChart(content)
    return (
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({node, ...props}) => <a {...props} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" />,
              code: (props) => {
                const {inline, className, children, ...rest} = props as {inline?: boolean, className?: string, children: React.ReactNode}
                return !inline ? (
                  <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs"><code {...rest}>{children}</code></pre>
                ) : (
                  <code className="bg-gray-100 rounded px-1">{children}</code>
                )
              },
              // Fix potential nested paragraph issues
              p: ({ children }) => <div className="mb-2">{children}</div>,
              table: ({node, ...props}) => (
                <div className="my-4 w-full overflow-auto rounded-lg border border-amber-200 shadow-sm">
                  <table className="w-full border-collapse bg-amber-50" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => (
                <thead className="bg-amber-100 border-b border-amber-200" {...props} />
              ),
              th: ({node, ...props}) => (
                <th className="p-3 text-left text-sm font-semibold text-amber-900" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="p-3 text-sm text-amber-800 border-b border-amber-100" {...props} />
              ),
              tr: ({node, ...props}) => (
                <tr className="hover:bg-amber-100/50" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {chartData && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            {/* Chart.js Bar chart */}
            {chartData.type === "bar" && <BarChartComponent data={chartData.data} />}
            {chartData.type === "pie" && <PieChartComponent data={chartData.data} />}
            {chartData.type === "line" && <LineChartComponent data={chartData.data} />}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Financial Services AI Assistant</h1>

        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="topics">Suggested Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Financial AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-hidden p-0">
                    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={message.role === "user" ? "bg-primary" : "bg-amber-500"}>
                                  {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`rounded-lg p-3 ${
                                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                {/* Fixed: Changed from <p> to <div> to avoid nesting issues */}
                                <div className="text-sm">
                                  {message.role === "assistant"
                                    ? renderAssistantContent(message.content)
                                    : message.content}
                                </div>
                                <div className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[80%]">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-amber-500">
                                  <Bot className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="rounded-lg p-3 bg-muted">
                                <div className="flex space-x-2">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"></div>
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-75"></div>
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-150"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePDFUpload}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-black"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Ask about loans, insurance, credit cards, investments..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </div>

              <div className="hidden lg:block">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-amber-500" />
                      Financial Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Learn More</h3>
                          <div className="space-y-2">
                            <Button asChild variant="outline" size="sm" className="w-full justify-start">
                              <Link href="/resources">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Browse Financial Resources
                              </Link>
                            </Button>
                            
                          </div>
                        </div>

                        <div>
                          
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Popular Topics</h3>
                          <div className="flex flex-wrap gap-2">
                            {popularTopics.map((topic, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800"
                                onClick={() => {
                                  setInput(`Tell me about ${topic}`)
                                  setActiveTab("chat")
                                }}
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Topics for Financial Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topicCategories.map((category, index) => (
                    <div key={index} className="space-y-3">
                      <h3 className="font-medium text-lg">{category.name}</h3>
                      <div className="space-y-2">
                        {category.topics.map((topic, topicIndex) => (
                          <Button
                            key={topicIndex}
                            variant="outline"
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setInput(`Tell me about ${topic}`)
                              setActiveTab("chat")
                            }}
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const popularTopics = [
  "Personal Loans",
  "Home Loans",
  "Credit Card Eligibility",
  "Insurance Types",
  "EMI Calculation",
  "Investment Options",
  "Mutual Funds",
  "Risk Profiling",
  "Market Trends",
]

const topicCategories = [
  {
    name: "Loans & Credit",
    topics: [
      "Personal Loan Eligibility",
      "Home Loan Process",
      "Car Loans",
      "Credit Card Offers",
      "EMI Calculation",
      "Balance Transfer",
    ],
  },
  {
    name: "Insurance",
    topics: [
      "Life Insurance",
      "Health Insurance",
      "Term Plans",
      "Premium Calculation",
      "Claim Process",
    ],
  },
  {
    name: "Investments",
    topics: [
      "Mutual Funds",
      "Fixed Deposits",
      "Stocks & Shares",
      "Retirement Planning",
      "Tax Saving Investments",
      "Investment Risk Profiling",
    ],
  },
  {
    name: "Financial Planning",
    topics: [
      "Budgeting",
      "Emergency Fund",
      "Credit Score",
      "Debt Management",
      "Goal-based Planning",
    ],
  },
  {
    name: "Market Trends",
    topics: [
      "Current Interest Rates",
      "Stock Market Overview",
      "Best Investment Options",
      "Economic Indicators",
    ],
  },
]