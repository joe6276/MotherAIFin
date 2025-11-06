const { google } = require("googleapis")
const path = require("path")
const dotenv = require("dotenv")
const mssql = require("mssql")
const { sqlConfig } = require("../config")
const fs= require("fs")
dotenv.config({ path: path.resolve(__dirname, "../.env") })



function getOauth2Client() {
    return new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URL1
    )
}


// Work On it
async function getValidTokens(currentUser, email) {

    console.log(currentUser, email);

    if (!currentUser.AccessToken) {
        throw new Error("No user logged in!")
    }

    const oauth2Client = getOauth2Client()

    const now = Date.now();
    const isExpired = currentUser.TokenExpiry && currentUser.TokenExpiry < (now + 5 * 60 * 1000);
    console.log(isExpired);

    if (isExpired && currentUser.RefreshToken) {
        console.log("We are here");

        oauth2Client.setCredentials({
            refresh_token: currentUser.RefreshToken
        })


        try {
            const { credentials } = await oauth2Client.refreshAccessToken()
            currentUser.AccessToken = credentials.access_token

            if (credentials.refresh_token) {
                currentUser.RefreshToken = credentials.refresh_token
            }
            currentUser.TokenExpiry = credentials.expiry_date;

            const pool = await mssql.connect(sqlConfig);
            await pool.request()
                .input("AccessToken", mssql.NVarChar, credentials.access_token)
                .input("RefreshToken", mssql.NVarChar, credentials.refresh_token)
                .input("TokenExpiry", mssql.NVarChar, credentials.expiry_date.toString())
                .input("Email", mssql.NVarChar, email)
                .query(`
            UPDATE Users
            SET 
                AccessToken = @AccessToken,
                RefreshToken = @RefreshToken,
                TokenExpiry = @TokenExpiry,
                LastLogin = GETDATE()
            WHERE 
                Email = @Email
        `);
            return credentials;

        } catch (error) {
            console.error('Error refreshing token:', error);
            throw new Error('Failed to refresh token');
        }
    }



    return {
        access_token: currentUser.AccessToken,
        refresh_token: currentUser.RefreshToken,
        expiry_date: currentUser.TokenExpiry
    }

}



async function getURL(req, res) {
    const oauth2Client = getOauth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent'
    });
    res.json({ authUrl });
}


async function getCallback(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.redirect('http://localhost:80?auth=error');
    }
    console.log("This was Called!!!");
    console.log("Code", code);
    
    
    try {
        const oauth2Client = getOauth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        console.log("The Tokens");
        console.log(tokens);
        
        
        // Get user info
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        try {
            const pool = await mssql.connect(sqlConfig);
            await pool.request()
                .input("AccessToken", mssql.NVarChar, tokens.access_token)
                .input("RefreshToken", mssql.NVarChar, tokens.refresh_token)
                .input("TokenExpiry", mssql.NVarChar, tokens.expiry_date.toString())
                .input("Email", mssql.NVarChar, userInfo.data.email)
                .query(`
            UPDATE Users
            SET 
                AccessToken = @AccessToken,
                RefreshToken = @RefreshToken,
                TokenExpiry = @TokenExpiry,
                LastLogin = GETDATE()
            WHERE 
                Email = @Email
        `);

        console.log("UPDATED!!!");
        
        } catch (err) {
            console.error("Error updating tokens:", err);
        }



        // Set session
        req.session.authenticated = true;
        req.session.userEmail = userInfo.data.email;

        console.log(tokens);

        console.log('User logged in:', userInfo.data.email);

        // Redirect back to frontend
        res.redirect('http://localhost:80?auth=success');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('http://localhost:80?auth=error');
    }
}

async function getFiles(req, res) {

    const pool = await mssql.connect(sqlConfig);
    const { email } = req.body
    const result = await pool.request()
        .input("Email", mssql.NVarChar, email)
        .query(`
        SELECT 
            AccessToken, 
            RefreshToken, 
            TokenExpiry 
        FROM Users
        WHERE Email = @Email
    `);

    const userTokens = result.recordset[0]; // first matching user (if any)
    console.log(userTokens);

    try {
        const tokens = await getValidTokens(userTokens, email);
        console.log("Tokens");

        console.log(tokens);

        const oauth2Client = getOauth2Client();
        oauth2Client.setCredentials(tokens);

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const folderId = req.query.folderId || 'root';

        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, modifiedTime, size, iconLink)',
            orderBy: 'folder,name',
            pageSize: 100
        });

        res.json({ files: response.data.files });
    } catch (error) {
        console.error('Error fetching files:', error);

        if (error.message === 'Failed to refresh token') {
            req.session.destroy();
            currentUser = null;
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }

        res.status(500).json({ error: 'Failed to fetch files' });
    }

};

async function uploadFile(req,res) {
    try {
        
    const pool = await mssql.connect(sqlConfig);
    const { email } = req.body
    const result = await pool.request()
        .input("Email", mssql.NVarChar, 'joendambuki16@gmail.com')
        .query(`
        SELECT 
            AccessToken, 
            RefreshToken, 
            TokenExpiry 
        FROM Users
        WHERE Email = @Email
    `);

    const userTokens = result.recordset[0]; // first matching user (if any)
    console.log(userTokens);

        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
          fs.mkdirSync('uploads');
        }

        const folderId = req.body.folderId || 'root';
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const tokens = await getValidTokens(userTokens, 'joendambuki16@gmail.com')
        const oauth2Client =   new google.auth.OAuth2(
        process.env.CLIENT_ID1,
        process.env.CLIENT_SECRET1,
        process.env.REDIRECT_URL
    )
        oauth2Client.setCredentials({refresh_token:tokens.refresh_token});

        const drive = google.drive({ version: 'v3', auth: oauth2Client })
        const fileMetadata = {
            name: req.file.originalname,
            parents: [folderId]
        }
        const media = {
            mimeType: req.file.mimeType,
            body: fs.createReadStream(req.file.path)
        }


        // Upload to Google Drive
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, size'
        });

        fs.unlinkSync(req.file.path)
        console.log('File uploaded:', response.data.name);
        res.json({ success:true, file:response.data})

    } catch (error) {
console.error('Error uploading file:', error);

        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to upload file' });
    }
}

module.exports = { getURL, getCallback, getFiles, uploadFile}

