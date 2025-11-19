const fs = require("fs")
const path= require("path")
const dotenv = require('dotenv')
const {google} = require("googleapis")

dotenv.config({path:path.resolve(__dirname, "../.env")})

const CLIENT_ID =process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URL = process.env.REDIRECT_URL
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const oauthclient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)

oauthclient.setCredentials({ refresh_token: REFRESH_TOKEN })


const drive = google.drive({
    version: 'v3',
    auth: oauthclient
})

async function getFolderId(folderName) {
    try {
        const response = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id,name)'
        });

        if (response.data.files.length > 0) {
            return response.data.files[0].id;
        }
        throw new Error( folderName +' folder not found');
    } catch (error) {
        console.error('Error finding  folder:', error);
        throw error;
    }
}



function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

async function uploadFileToDrive( folderName,filePath, originalName){
    try {
        const folderId = getFolderId(folderName)
        const mimeType = getMimeType(originalName);
         // Prepare file metadata
    const fileMetadata = {
      name: originalName
    };

   
    
    // If folderId is provided, add it to parents; otherwise it goes to root
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    // Prepare file media
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };
    const CLIENT_ID =process.env.CLIENT4
const CLIENT_SECRET = process.env.SECRET4
const REDIRECT_URL = process.env.REDIRECT_URL4
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const oauthclient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)

oauthclient.setCredentials({ refresh_token: REFRESH_TOKEN })


const drive = google.drive({
    version: 'v3',
    auth: oauthclient
})

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink, webContentLink'
    });
      fs.unlinkSync(filePath);
    
    return response.data;

    } catch (error) {
        if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
    }
}
async function findorCreateDateFolder(folder) {
    const parentFolderId = await getFolderId(folder)
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const folderName = dateString;

    try {
        const searchResponse = await drive.files.list({
            q: `name='${folderName}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });


        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
            // Folder exists, return its ID
    
            return searchResponse.data.files[0].id;
        }

        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
        };

        const createResponse = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name'
        });

        return createResponse.data.id;

    } catch (error) {
        console.error('Error finding/creating date folder:', error);
    }


}

async function createFileinDateFolder(name,content) {
    try {
        var dateFolderId = await findorCreateDateFolder("HTML")

        const now = new Date()
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        fileName = `${name}-${dateString}.html`; 

        const fileMetadata = {
            name: fileName,
            parents: [dateFolderId]
        };

        const media = {
            mimeType: 'text/html',
            body: content
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, parents'
        });
        return {
            fileId: response.data.id,
            fileName: fileName,
            dateFolderId: dateFolderId,
            webViewLink: response.data.webViewLink
        };
    } catch (error) {
        console.error('Error creating file in date folder:', error);
    }
}


async function run() {
    try {
        const response = await  getFolderId("Test")
        console.log(response);
        
    } catch (error) {
        console.log(error);
        
    }
}


run()
module.exports={
    createFileinDateFolder,
    uploadFileToDrive
}
