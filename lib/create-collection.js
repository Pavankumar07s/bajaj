// // create-collection.js
// const { QdrantClient } = require("@qdrant/js-client-rest");

// async function createCollection() {
//   const qdrant = new QdrantClient({
//     url: "https://d6496794-c868-4dc6-93ea-4457d2631258.europe-west3-0.gcp.cloud.qdrant.io:6333",
//     apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.5TjHaBxCq-uuSZMKtwlaMZPYn9VkHdGqS5X4s-WPy0o"// Replace with your actual API key
//   });

//   try {
//     // List existing collections
//     console.log("Listing existing collections...");
//     const collections = await qdrant.getCollections();
//     console.log("Existing collections:", collections.collections.map(c => c.name));

//     // Check if collection already exists
//     const collectionExists = collections.collections.some(
//       collection => collection.name === "pdf_chunks"
//     );

//     if (collectionExists) {
//       console.log("Collection 'pdf_chunks' already exists!");
//       return;
//     }

//     // Create the collection
//     console.log("Creating collection 'pdf_chunks'...");
//     await qdrant.createCollection("pdf_chunks", {
//       vectors: {
//         size: 768,
//         distance: "Cosine"
//       }
//     });

//     console.log("Collection 'pdf_chunks' created successfully!");

//     // Verify creation
//     const collectionInfo = await qdrant.getCollection("pdf_chunks");
//     console.log("Collection info:", collectionInfo);

//   } catch (error) {
//     console.error("Error creating collection:", error);
//   }
// }

// // Run the script
// createCollection();
// create-collection.js
const { QdrantClient } = require("@qdrant/js-client-rest");

async function createCollection() {
  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL || undefined,
    apiKey: process.env.QDRANT_API_KEY // Replace with your actual API key
  });

  try {
    // List existing collections
    console.log("Listing existing collections...");
    const collections = await qdrant.getCollections();
    console.log("Existing collections:", collections.collections.map(c => c.name));

    // Check if collection already exists
    const collectionExists = collections.collections.some(
      collection => collection.name === "pdf_chunks"
    );

    if (collectionExists) {
      console.log("Collection 'pdf_chunks' already exists!");
      
      // Get collection info to verify configuration
      const collectionInfo = await qdrant.getCollection("pdf_chunks");
      console.log("Existing collection info:", {
        status: collectionInfo.status,
        points_count: collectionInfo.points_count,
        vector_size: collectionInfo.config.params.vectors?.size,
        distance: collectionInfo.config.params.vectors?.distance
      });
      
      // Verify it has the correct configuration
      if (collectionInfo.config.params.vectors?.size !== 768) {
        console.error("Collection has wrong vector size! Recreating...");
        await qdrant.deleteCollection("pdf_chunks");
        console.log("Deleted existing collection with wrong configuration");
      } else {
        console.log("Collection configuration is correct");
        return;
      }
    }

    // Create the collection with proper configuration
    console.log("Creating collection 'pdf_chunks'...");
    const createResponse = await qdrant.createCollection("pdf_chunks", {
      vectors: {
        size: 768,
        distance: "Cosine"
      },
      // Optional: Add optimizers config for better performance
      optimizers_config: {
        deleted_threshold: 0.2,
        vacuum_min_vector_number: 1000,
        default_segment_number: 0,
        max_segment_size: null,
        memmap_threshold: null,
        indexing_threshold: 20000,
        flush_interval_sec: 5,
        max_optimization_threads: null
      },
      // Optional: Add HNSW config for better search performance
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
        max_indexing_threads: 0,
        on_disk: false
      }
    });

    console.log("Collection creation response:", createResponse);
    console.log("Collection 'pdf_chunks' created successfully!");

    // Verify creation with detailed info
    const collectionInfo = await qdrant.getCollection("pdf_chunks");
    console.log("Collection verification:", {
      status: collectionInfo.status,
      points_count: collectionInfo.points_count,
      indexed_vectors_count: collectionInfo.indexed_vectors_count,
      segments_count: collectionInfo.segments_count,
      vector_size: collectionInfo.config.params.vectors?.size,
      distance: collectionInfo.config.params.vectors?.distance,
      optimizer_status: collectionInfo.optimizer_status
    });

    // Test the collection by creating a simple point
    console.log("Testing collection with a sample point...");
    const testVector = new Array(768).fill(0).map(() => Math.random() * 2 - 1);
    
    const testPoint = {
      id: "test-point",
      vector: testVector,
      payload: {
        test: true,
        created_at: new Date().toISOString()
      }
    };

    const upsertResponse = await qdrant.upsert("pdf_chunks", {
      wait: true,
      points: [testPoint]
    });
    
    console.log("Test upsert response:", upsertResponse);

    // Verify the test point was added
    const finalInfo = await qdrant.getCollection("pdf_chunks");
    console.log("Final collection info:", {
      points_count: finalInfo.points_count,
      indexed_vectors_count: finalInfo.indexed_vectors_count
    });

    // Clean up test point
    await qdrant.delete("pdf_chunks", {
      wait: true,
      points: ["test-point"]
    });
    
    console.log("Test point cleaned up. Collection is ready for use!");

  } catch (error) {
    console.error("Error creating collection:", error);
    
    // Enhanced error logging
    if (error && typeof error === 'object') {
      if ('response' in error) {
        const response = (error).response;
        console.error("Error response details:", {
          status: response?.status,
          statusText: response?.statusText,
          data: response?.data,
          url: response?.url
        });
      }
      if ('message' in error) {
        console.error("Error message:", (error).message);
      }
    }
    
    process.exit(1);
  }
}

// Run the script
createCollection().catch(console.error);