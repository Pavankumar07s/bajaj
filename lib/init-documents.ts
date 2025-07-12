import { existsSync } from 'fs'
import { PrismaClient } from "../lib/generated/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

export async function initializeDocuments() {
  try {
    // Get list of documents in Prisma
    const existingDocs = await prisma.document.findMany()
    const existingFilenames = new Set(existingDocs.map(d => d.filename))

    // Check if any documents from load-chunk-file.js are missing
    const pdfPaths = [
      "public/hackathonproblemstatement/01.pdf",
      "public/hackathonproblemstatement/02.pdf",
      "public/hackathonproblemstatement/03.pdf",
      "public/hackathonproblemstatement/04.pdf"
    ]
    
    const csvPaths = [
      "public/hackathonproblemstatement/BFS_Share_Price.csv"
    ]

    const allPaths = [...pdfPaths, ...csvPaths]
    const missingFiles = allPaths.filter(path => {
      const filename = path.split('/').pop()!
      return !existingFilenames.has(filename) && existsSync(path)
    })

    if (missingFiles.length > 0) {
      console.log('Found missing documents, running loader...')
      await execAsync('npm run load-docs')  // Updated command
      console.log('Documents loaded and linked successfully')
    } else {
      console.log('All documents are already loaded and linked')
    }
  } catch (error) {
    console.error('Error initializing documents:', error)
  }
}
