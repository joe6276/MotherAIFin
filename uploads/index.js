// uploadImageFile.js
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
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
    const blobName = `${uuidv4()}-${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file buffer
    await blockBlobClient.uploadData(file.buffer, { overwrite: true });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading image:", error.message);
    throw error;
  }
}

module.exports = {uploadImageFile};
