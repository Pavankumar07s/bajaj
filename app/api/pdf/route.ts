import { NextResponse } from "next/server"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { QdrantClient } from "@qdrant/js-client-rest" 
import { PrismaClient } from "../../../lib/generated/prisma"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()
const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY || undefined
})
const COLLECTION_NAME = "pdf_chunks"

export async function POST(req: Request) {
  try {
    await prisma.$connect()

    const formData = await req.formData()
    const file = formData.get("pdf") as File

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }

    console.log(`Processing PDF: ${file.name} (${file.size} bytes)`)

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const blob = new Blob([buffer], { type: "application/pdf" })

    // Load and process PDF
    const loader = new PDFLoader(blob)
    const docs = await loader.load()
    
    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "No content found in PDF" }, { status: 400 })
    }

    const pdfContent = docs.map(doc => doc.pageContent).join("\n")
    
    if (!pdfContent.trim()) {
      return NextResponse.json({ error: "PDF appears to be empty" }, { status: 400 })
    }

    console.log(`PDF content length: ${pdfContent.length} characters`)

    // Save metadata to Prisma
    const documentId = uuidv4()
    await prisma.document.create({
      data: {
        id: documentId,
        filename: file.name,
        vectorId: documentId,
      },
    })

    console.log(`Created document record with ID: ${documentId}`)

    // Chunk the PDF
    const splitter = new RecursiveCharacterTextSplitter({ 
      chunkSize: 1000, 
      chunkOverlap: 200 
    })
    const chunks = await splitter.splitText(pdfContent)
    
    // Filter out empty chunks
    const validChunks = chunks.filter(chunk => chunk.trim().length > 0)
    
    if (validChunks.length === 0) {
      return NextResponse.json({ error: "No valid text chunks found in PDF" }, { status: 400 })
    }

    console.log(`Processing ${validChunks.length} text chunks`)

    // Verify collection exists and has correct configuration
    await verifyCollection(qdrant, COLLECTION_NAME)

    // Embed chunks using Google Generative AI Embeddings
    const vectors = await getGoogleEmbeddings(validChunks)
    
    if (vectors.length !== validChunks.length) {
      throw new Error(`Mismatch between chunks (${validChunks.length}) and vectors (${vectors.length})`)
    }

    // Validate vector dimensions
    const expectedDimension = 768
    for (let i = 0; i < vectors.length; i++) {
      if (!Array.isArray(vectors[i]) || vectors[i].length !== expectedDimension) {
        throw new Error(`Invalid vector at index ${i}: expected ${expectedDimension} dimensions, got ${vectors[i]?.length || 'undefined'}`)
      }
      
      // Validate that all values are numbers
      for (let j = 0; j < vectors[i].length; j++) {
        if (typeof vectors[i][j] !== 'number' || !isFinite(vectors[i][j])) {
          throw new Error(`Invalid vector value at index ${i}, position ${j}: ${vectors[i][j]}`)
        }
      }
    }

    console.log(`Generated ${vectors.length} embeddings with ${vectors[0].length} dimensions`)

    // Store embeddings in Qdrant with corrected format
    try {
      const points = vectors.map((vector, idx) => ({
        id: uuidv4(), // Generate a unique UUID for each point
        vector: vector,
        payload: {
          documentId: documentId,
          chunk: validChunks[idx],
          chunkIndex: idx,
          filename: file.name,
          createdAt: new Date().toISOString(),
        },
      }))

      console.log(`Preparing to upsert ${points.length} points to Qdrant`)
      console.log(`Sample point structure:`, {
        id: points[0].id,
        vectorLength: points[0].vector.length,
        payloadKeys: Object.keys(points[0].payload),
        chunkPreview: points[0].payload.chunk.substring(0, 100) + "..."
      })

      // Upsert in smaller batches to avoid potential size limits
      const batchSize = 50
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize)
        console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} with ${batch.length} points`)
        
        try {
          // CORRECTED: Use the proper upsert method format
          const response = await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points: batch,
          })
          
          console.log(`Batch ${Math.floor(i / batchSize) + 1} upserted successfully:`, response)
        } catch (batchError) {
          console.error(`Batch upsert failed for batch starting at index ${i}:`, batchError)
          
          // Enhanced error logging
          if (batchError && typeof batchError === 'object') {
            if ('response' in batchError) {
              const errorResponse = (batchError as any).response
              console.error('Detailed error response:', {
                status: errorResponse?.status,
                statusText: errorResponse?.statusText,
                data: errorResponse?.data,
                headers: errorResponse?.headers
              })
            }
            if ('data' in batchError) {
              console.error('Error data:', (batchError as any).data)
            }
          }
          
          throw new Error(`Failed to upsert batch starting at index ${i}: ${batchError}`)
        }
      }

      console.log(`Successfully stored ${points.length} points in Qdrant`)
    } catch (qdrantError) {
      console.error("Qdrant upsert error:", qdrantError)
      
      // Enhanced error details
      if (qdrantError && typeof qdrantError === 'object') {
        if ('response' in qdrantError) {
          const response = (qdrantError as any).response
          console.error("Qdrant error response:", {
            status: response?.status,
            statusText: response?.statusText,
            data: response?.data,
            url: response?.url
          })
        }
        if ('message' in qdrantError) {
          console.error("Error message:", (qdrantError as any).message)
        }
      }
      
      throw new Error(`Failed to store embeddings in Qdrant: ${qdrantError}`)
    }

    // Verify the data was stored correctly
    try {
      const collectionInfo = await qdrant.getCollection(COLLECTION_NAME)
      console.log(`Collection now has ${collectionInfo.points_count} points`)
    } catch (verifyError) {
      console.warn("Could not verify collection state:", verifyError)
    }

    return NextResponse.json({ 
      success: true,
      content: pdfContent.substring(0, 1000) + (pdfContent.length > 1000 ? "..." : ""),
      documentId,
      chunks: validChunks.length,
      vectors: vectors.length,
      filename: file.name,
      processing: {
        totalChunks: validChunks.length,
        embeddingDimensions: vectors[0]?.length || 0,
        storedPoints: validChunks.length
      }
    })
  } catch (error) {
    console.error("Error processing PDF:", error)
    
    // Enhanced error reporting
    let errorMessage = "Failed to process PDF"
    let errorDetails = "Unknown error"
    let errorStack = ""
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.message
      errorStack = error.stack || ""
    } else if (typeof error === 'string') {
      errorMessage = error
      errorDetails = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
      errorDetails = JSON.stringify(error)
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Verify collection exists and has correct configuration
async function verifyCollection(client: QdrantClient, name: string) {
  try {
    const info = await client.getCollection(name)
    console.log(`Collection info:`, {
      status: info.status,
      points_count: info.points_count,
      indexed_vectors_count: info.indexed_vectors_count,
      vector_size: info.config.params.vectors?.size,
      distance: info.config.params.vectors?.distance
    })
    
    // Handle both old and new vector config formats
    let vectorConfig = info.config.params.vectors
    if (typeof vectorConfig === 'object' && vectorConfig !== null) {
      // New format check
      if ('size' in vectorConfig && typeof vectorConfig.size === 'number') {
        if (vectorConfig.size !== 768) {
          throw new Error(`Collection has wrong vector size: ${vectorConfig.size} (expected 768)`)
        }
      } else {
        throw new Error("Collection vectors configuration is missing size parameter")
      }
      
      if ('distance' in vectorConfig && vectorConfig.distance !== "Cosine") {
        console.warn(`Collection uses ${vectorConfig.distance} distance instead of Cosine`)
      }
    } else {
      throw new Error("Collection vectors configuration is missing or invalid")
    }
    
    console.log(`Collection ${name} is properly configured`)
  } catch (error) {
    console.error("Collection verification failed:", error)
    throw new Error(`Collection verification failed: ${error}`)
  }
}

// Enhanced embedding function with better error handling
async function getGoogleEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY
  
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set")
  }
  
  console.log(`Processing ${texts.length} texts for embeddings`)
  
  const batches = batchTexts(texts, 100)
  const allEmbeddings: number[][] = []
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items`)
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            requests: batch.map(text => ({
              model: "models/text-embedding-004",
              content: {
                parts: [{ text: text.trim() }]
              }
            }))
          }),
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error ${response.status}:`, errorText)
        throw new Error(`Google API request failed with status ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      
      // Handle batch response
      if (!data.embeddings || !Array.isArray(data.embeddings)) {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response format: missing embeddings array")
      }
      
      if (data.embeddings.length !== batch.length) {
        throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${data.embeddings.length}`)
      }
      
      // Validate and collect embeddings
      for (let i = 0; i < data.embeddings.length; i++) {
        const embedding = data.embeddings[i]
        
        if (!embedding || !embedding.values || !Array.isArray(embedding.values)) {
          throw new Error(`Invalid embedding at batch index ${i}: missing or invalid values`)
        }
        
        if (embedding.values.length !== 768) {
          throw new Error(`Invalid embedding dimension at batch index ${i}: expected 768, got ${embedding.values.length}`)
        }
        
        // Validate all values are valid numbers
        for (let j = 0; j < embedding.values.length; j++) {
          if (typeof embedding.values[j] !== 'number' || !isFinite(embedding.values[j])) {
            throw new Error(`Invalid embedding value at batch ${i}, position ${j}: ${embedding.values[j]}`)
          }
        }
        
        allEmbeddings.push(embedding.values)
      }
      
      console.log(`Successfully processed batch ${batchIndex + 1}, total embeddings: ${allEmbeddings.length}`)
      
      // Add delay to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
    } catch (error) {
      console.error(`Batch ${batchIndex + 1} failed:`, error)
      throw new Error(`Failed to process embeddings batch ${batchIndex + 1}: ${error}`)
    }
  }
  
  if (allEmbeddings.length === 0) {
    throw new Error("No embeddings were generated")
  }
  
  if (allEmbeddings.length !== texts.length) {
    throw new Error(`Embedding count mismatch: expected ${texts.length}, got ${allEmbeddings.length}`)
  }
  
  console.log(`Successfully generated ${allEmbeddings.length} embeddings`)
  return allEmbeddings
}

// Batch texts with size limits and validation
function batchTexts(texts: string[], batchSize = 100): string[][] {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Invalid texts array provided")
  }
  
  if (batchSize <= 0) {
    throw new Error("Batch size must be greater than 0")
  }
  
  const batches: string[][] = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    // Filter out empty strings and ensure minimum length
    const validBatch = batch.filter(text => text && text.trim().length > 10)
    if (validBatch.length > 0) {
      batches.push(validBatch)
    }
  }
  
  return batches
}