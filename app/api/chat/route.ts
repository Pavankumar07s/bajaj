import { NextResponse } from "next/server"
import { QdrantClient } from "@qdrant/js-client-rest"
import { DataAPIClient } from "@datastax/astra-db-ts"
import { initializeDocuments } from '../../../lib/init-documents'


// Initialize clients with error handling
let qdrant: QdrantClient | null = null
let astraClient: DataAPIClient | null = null
let astraCollection: any = null


try {
  // Initialize Qdrant with proper authentication
  if (process.env.QDRANT_URL) {
    const qdrantConfig: any = { 
      url: process.env.QDRANT_URL,
      // Add API key if using Qdrant Cloud
      ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY })
    }
    qdrant = new QdrantClient(qdrantConfig)
  }
  
  // Initialize Astra DB with proper configuration
  if (process.env.ASTRA_DB_APPLICATION_TOKEN && process.env.ASTRA_DB_API_ENDPOINT) {
    astraClient = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN)
    const db = astraClient.db(process.env.ASTRA_DB_API_ENDPOINT)
    astraCollection = db.collection("bajaj")
  }
} catch (error) {
  console.error("Error initializing database clients:", error)
}

const COLLECTION_NAME = "pdf_chunks" 

// Google Embeddings function (matching your PDF route)
async function getGoogleEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY!
  const allEmbeddings: number[][] = []
  
  for (const text of texts) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/embedding-001",
            content: {
              parts: [{ text: text }]
            }
          }),
        }
      )
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`)
      }
      
      const data = await response.json()
      
      if (data.embedding && data.embedding.values) {
        allEmbeddings.push(data.embedding.values)
      } else {
        throw new Error("Invalid response format from Google GenAI embeddings API")
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error("Error getting embedding for text:", text.substring(0, 50) + "...")
      throw error
    }
  }
  
  return allEmbeddings
}

// Fallback dummy embedding function
function getDummyEmbeddings(texts: string[]): number[][] {
  return texts.map((text) => {
    if (!text || typeof text !== 'string') return new Array(384).fill(0)
    
    const arr = new Array(384).fill(0)
    for (let i = 0; i < text.length; i++) {
      arr[i % 384] += text.charCodeAt(i) / 255
    }
    return arr
  })
}

// Initialize documents on first request
let initialized = false

export async function POST(req: Request) {
  try {
    if (!initialized) {
      await initializeDocuments()
      initialized = true
    }

    // Validate environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("Invalid JSON in request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { messages, pdfContext, documentId, userId } = body

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const question = messages[messages.length - 1]?.content

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: "Invalid question content" }, { status: 400 })
    }

    let contextChunks: string[] = []
    let ragContext = ""

    // Search Qdrant for relevant context
    if (qdrant && process.env.QDRANT_URL) {
      try {
        let questionEmbedding: number[]

        // Try to get real embeddings first, fallback to dummy if needed
        if (process.env.GOOGLE_GENAI_API_KEY) {
          try {
            const embeddings = await getGoogleEmbeddings([question])
            questionEmbedding = embeddings[0]
          } catch (embeddingError) {
            console.warn("Failed to get Google embeddings, using dummy:", embeddingError)
            questionEmbedding = getDummyEmbeddings([question])[0]
          }
        } else {
          questionEmbedding = getDummyEmbeddings([question])[0]
        }

        // Search Qdrant for top K similar chunks
        const searchResult = await qdrant.search(COLLECTION_NAME, {
          vector: questionEmbedding,
          limit: 5,
          filter: documentId ? { 
            must: [{ 
              key: "documentId", 
              match: { value: documentId } 
            }] 
          } : undefined,
        })

        // Retrieve top K chunks
        contextChunks = searchResult
          .map((res: any) => res.payload?.chunk)
          .filter((chunk): chunk is string => Boolean(chunk))
        
        ragContext = contextChunks.length
          ? `\n\nRelevant document context:\n${contextChunks.join("\n---\n")}`
          : ""
          
        console.log(`Found ${contextChunks.length} relevant chunks for question`)
        
      } catch (qdrantError) {
        console.error("Qdrant search error:", qdrantError)
        
        // Check if it's an authentication error
        if (qdrantError instanceof Error && qdrantError.message.includes('Forbidden')) {
          console.error("Qdrant authentication failed. Please check your QDRANT_API_KEY.")
        }
        
        // Continue without context if Qdrant fails
        ragContext = ""
      }
    }

    // Prepare system message
    const systemMessage = {
      role: "system" as const,
      content: `You are an AI assistant specialized in financial services.${ragContext}
You help users with queries about loans, insurance, credit cards, EMI, and investments.
1. Answer customer queries on loans, insurance, credit cards, EMI, etc.
2. Ask questions to check user eligibility and suggest suitable loan products.
3. Give investment suggestions based on user preferences, risk profile, or current market trends.
Always keep your responses clear, concise, and helpful. If appropriate, ask follow-up questions to better assist the user.`,
    }

    // Call Groq LLM
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (parseError) {
        console.error("Failed to parse Groq error response:", parseError)
        errorData = { error: "Unknown error from LLM service" }
      }
      
      console.error("Groq API error:", errorData)
      
      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 500 })
      } else if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      } else {
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
      }
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure from Groq API:", data)
      return NextResponse.json({ error: "Invalid response from LLM service" }, { status: 500 })
    }

    const assistantResponse = data.choices[0].message.content

    // Save chat completion to Astra DB (only if available)
    if (astraCollection) {
      try {
        await astraCollection.insertOne({
          userId: userId || "anonymous",
          timestamp: new Date().toISOString(),
          message: question,
          response: assistantResponse,
          documentId: documentId || null,
        })
      } catch (astraError) {
        console.error("Error saving to Astra DB:", astraError)
        // Continue without saving to DB if it fails
      }
    }

    return NextResponse.json({ content: assistantResponse })
  } catch (error) {
    console.error("Error in chat API route:", error)
    
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({ error: "Network error. Please check your connection." }, { status: 503 })
    }
    
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 })
  }
}