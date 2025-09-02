# 🚂 Fixing CORS Issues with Firebase Storage

## The Problem
You're experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access JSON files from Firebase Storage. This is a common issue that occurs because Firebase Storage doesn't automatically include the necessary `Access-Control-Allow-Origin` headers.

## What CORS Errors Look Like
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/rail-statistics.firebasestorage.app/o/RRT-JSONS%2Ffile.json?alt=media' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## The Solution
You need to upload a CORS configuration file to your Firebase Storage bucket. This tells Firebase to include the proper headers for cross-origin requests.

## Step-by-Step Fix

### 1. Install Google Cloud SDK
The easiest way to configure Firebase Storage CORS is using the `gsutil` command-line tool.

**For macOS:**
```bash
# Using Homebrew
brew install --cask google-cloud-sdk

# Or download from Google
# Visit: https://cloud.google.com/sdk/docs/install
```

**For Windows:**
- Download from: https://cloud.google.com/sdk/docs/install
- Run the installer

**For Linux:**
```bash
# Ubuntu/Debian
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

### 2. Authenticate with Google Cloud
```bash
gcloud auth login
```

This will open a browser window for you to sign in with your Google account (the same one you use for Firebase).

### 3. Set Your Project
```bash
gcloud config set project rail-statistics
```

### 4. Upload CORS Configuration
From your project directory, run:
```bash
python upload_cors.py
```

This script will:
- Check if `gsutil` is available
- Create the proper CORS configuration
- Upload it to your Firebase Storage bucket

### 5. Wait for Changes to Take Effect
CORS configuration changes can take 2-3 minutes to propagate. After running the script:
- Wait a few minutes
- Refresh your web app
- Check the browser console for CORS errors

## Alternative Manual Method

If you prefer to do it manually:

### 1. Create CORS Configuration File
Create a file called `cors.json` with this content:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type", 
      "Access-Control-Allow-Origin", 
      "Access-Control-Allow-Methods", 
      "Access-Control-Allow-Headers"
    ]
  }
]
```

### 2. Upload Using gsutil
```bash
gsutil cors set cors.json gs://rail-statistics.firebasestorage.app
```

## What This CORS Configuration Does

- **`"origin": ["*"]`** - Allows requests from any domain (including localhost for development)
- **`"method": ["GET", "POST", "PUT", "DELETE", "HEAD"]`** - Allows all common HTTP methods
- **`"maxAgeSeconds": 3600`** - Caches the CORS preflight response for 1 hour
- **`"responseHeader"`** - Includes the necessary CORS headers in responses

## Security Considerations

The current configuration allows access from any origin (`*`). For production use, you might want to restrict this to specific domains:

```json
[
  {
    "origin": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type", 
      "Access-Control-Allow-Origin", 
      "Access-Control-Allow-Methods", 
      "Access-Control-Allow-Headers"
    ]
  }
]
```

## Troubleshooting

### Still Getting CORS Errors?
1. **Wait longer** - Changes can take up to 5 minutes
2. **Check bucket name** - Ensure you're using the correct bucket name
3. **Verify authentication** - Run `gcloud auth list` to see active accounts
4. **Check project** - Run `gcloud config get-value project` to verify project

### gsutil Command Not Found?
- Make sure Google Cloud SDK is properly installed
- Restart your terminal after installation
- Add the SDK to your PATH if needed

### Permission Denied?
- Ensure you're logged in with the correct Google account
- Verify you have Owner or Editor permissions on the Firebase project

## Verification

After applying the CORS configuration, you can verify it worked by:

1. **Checking the browser console** - CORS errors should disappear
2. **Using gsutil to view current CORS settings:**
   ```bash
   gsutil cors get gs://rail-statistics.firebasestorage.app
   ```

## Next Steps

Once CORS is configured:
1. Your RRT JSON files should load properly
2. The web app will be able to read from Firebase Storage
3. You can continue developing and testing your application

## Need Help?

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify your Firebase project settings
3. Ensure you're using the correct bucket name
4. Try the manual method if the script doesn't work

---

**Note:** This CORS configuration is specifically for Firebase Storage. If you're also using Firestore, that service handles CORS automatically and doesn't require additional configuration.
