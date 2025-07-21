import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import csv from 'csv-parser'
import { v4 as uuidv4 } from 'uuid'
import { QdrantClient } from '@qdrant/js-client-rest'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PrismaClient } from '../lib/generated/prisma'

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()
const prisma = new PrismaClient()

// Initialize Qdrant with connection check
const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY|| undefined
})
const COLLECTION_NAME = "pdf_chunks"

// Batch texts for Google API (same as working code)
function batchTexts(texts, batchSize = 100) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Invalid texts array provided")
  }
  
  if (batchSize <= 0) {
    throw new Error("Batch size must be greater than 0")
  }
  
  const batches = []
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

// Enhanced Google Generative AI Embeddings function (same as working code)
async function getGoogleEmbeddings(texts) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set")
  }
  
  console.log(`Processing ${texts.length} texts for embeddings`)
  
  const batches = batchTexts(texts, 100)
  const allEmbeddings = []
  
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

// Utility: Read PDF file using LangChain PDFLoader
async function readPDF(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`)
    }
    
    console.log(`Reading PDF: ${filePath}`)
    const loader = new PDFLoader(filePath)
    const docs = await loader.load()
    
    if (!docs || docs.length === 0) {
      throw new Error(`No content found in PDF: ${filePath}`)
    }
    
    const pdfContent = docs.map(doc => doc.pageContent).join("\n")
    
    if (!pdfContent.trim()) {
      throw new Error(`PDF appears to be empty: ${filePath}`)
    }
    
    console.log(`PDF content length: ${pdfContent.length} characters`)
    return pdfContent
  } catch (error) {
    console.error(`Error reading PDF ${filePath}:`, error)
    throw error
  }
}

// Utility: Read CSV as text
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`))
        return
      }
      
      console.log(`Reading CSV: ${filePath}`)
      const rows = []
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => rows.push(JSON.stringify(data)))
        .on("end", () => {
          if (rows.length === 0) {
            reject(new Error(`No data found in CSV: ${filePath}`))
            return
          }
          console.log(`CSV rows processed: ${rows.length}`)
          resolve(rows.join("\n"))
        })
        .on("error", (error) => {
          console.error(`Error reading CSV ${filePath}:`, error)
          reject(error)
        })
    } catch (error) {
      console.error(`Error setting up CSV reader for ${filePath}:`, error)
      reject(error)
    }
  })
}

// Verify collection exists and has correct configuration (same as working code)
async function verifyCollection(client, name) {
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

// Utility: Split, embed and upload
async function processFile(text, docName, filePath) {
  const documentId = uuidv4()
  
  // Create document in Prisma first
  await prisma.document.create({
    data: {
      id: documentId,
      filename: docName,
      vectorId: documentId,
    },
  })

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
  const chunks = await splitter.splitText(text)
  const vectors = await getGoogleEmbeddings(chunks)

  // Update points structure with valid UUIDs for point IDs
  const points = vectors.map((vector, idx) => ({
    id: uuidv4(), // Generate new UUID for each point instead of composite ID
    vector: vector,
    payload: {
      documentId,
      chunk: chunks[idx],
      chunkIndex: idx,
      docName,
      filePath,
      createdAt: new Date().toISOString(),
    },
  }))

  // Process in batches
  const batchSize = 50
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize)
    console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`)
    
    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: batch,
    })
  }

  console.log(`✅ Uploaded ${docName} with ${points.length} chunks (ID: ${documentId})`)
  return documentId
}

// Check Qdrant connection
async function checkQdrantConnection() {
  try {
    console.log("Checking Qdrant connection...")
    const collections = await qdrant.getCollections()
    console.log("✅ Qdrant connection successful")
    return true
  } catch (error) {
    console.error("❌ Qdrant connection failed:", error.message)
    console.error("Make sure Qdrant is running on", process.env.QDRANT_URL || "http://localhost:6333")
    return false
  }
}

// Verify collection exists
async function verifyCollectionExists() {
  try {
    await verifyCollection(qdrant, COLLECTION_NAME)
    console.log(`✅ Collection ${COLLECTION_NAME} verified`)
  } catch (error) {
    console.log(`Creating collection ${COLLECTION_NAME}...`)
    try {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
          distance: "Cosine",
        },
      })
      console.log(`✅ Collection ${COLLECTION_NAME} created successfully`)
    } catch (createError) {
      console.error(`❌ Failed to create collection:`, createError)
      throw createError
    }
  }
}

// Main handler
async function main() {
  try {
    console.log("Starting document processing...")
    
    // Check Qdrant connection first
    const connectionOk = await checkQdrantConnection()
    if (!connectionOk) {
      console.log("\n📋 To start Qdrant:")
      console.log("- Using Docker: docker run -p 6333:6333 qdrant/qdrant")
      console.log("- Or set QDRANT_URL environment variable to your Qdrant instance")
      process.exit(1)
    }
    
    // Verify collection exists
    await verifyCollectionExists()
    
    // Process PDFs with absolute paths
    const pdfPaths = [
      path.resolve(__dirname, "../public/hackathonproblemstatement/01.pdf"),
      path.resolve(__dirname, "../public/hackathonproblemstatement/02.pdf"),
      path.resolve(__dirname, "../public/hackathonproblemstatement/03.pdf"),
      path.resolve(__dirname, "../public/hackathonproblemstatement/04.pdf"),
    ]
    
    console.log("\n📄 Processing PDFs...")
    for (const filePath of pdfPaths) {
      try {
        const content = await readPDF(filePath)
        const docName = path.basename(filePath)
        await processFile(content, docName, filePath)
      } catch (error) {
        console.error(`❌ Failed to process PDF ${filePath}:`, error.message)
        // Continue with other files
      }
    }

    // Process CSV
    console.log("\n📊 Processing CSV...")
    const csvPath = path.resolve(__dirname, "../public/hackathonproblemstatement/BFS_Share_Price.csv")
    try {
      const csvText = await readCSV(csvPath)
      await processFile(csvText, "BFS_Share_Price.csv", csvPath)
    } catch (error) {
      console.error(`❌ Failed to process CSV ${csvPath}:`, error.message)
    }

    // Verify the data was stored correctly
    try {
      const collectionInfo = await qdrant.getCollection(COLLECTION_NAME)
      console.log(`\n✅ Collection now has ${collectionInfo.points_count} points`)
    } catch (verifyError) {
      console.warn("Could not verify collection state:", verifyError)
    }

    console.log("\n🎉 Document processing completed successfully!")
  } catch (error) {
    console.error("❌ Main process error:", error)
    process.exit(1)
  }
}

main().catch(console.error)