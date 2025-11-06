// uploadImageFile.js
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
require("dotenv").config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

async function uploadImageFile(file) {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerName = "spareparts";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn’t exist
    await containerClient.createIfNotExists({ access: "blob" });

    const fileName = path.basename(file.originalname);
    const blobName = `${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file buffer
    await blockBlobClient.uploadData(file.buffer, { overwrite: true });

    return blockBlobClient.url;
  } catch (error) {
    console.error(error)
    console.error("Error uploading image:", error.message);
    throw error;
  }
}


async function uploadVideoToBlob(localFilePath) {
  // Get connection string from environment variable
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is not set");
  }
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerName = "spareparts"; // customize as needed
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists({ access: "blob" });

  const blobName = path.basename(localFilePath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file stream
  const fileStream = fs.createReadStream(localFilePath);
  await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: "video/mp4" }
  });

  console.log(`☁️ Uploaded to Azure Blob: ${blockBlobClient.url}`);
  return blockBlobClient.url;
}
module.exports = {uploadImageFile, uploadVideoToBlob};
