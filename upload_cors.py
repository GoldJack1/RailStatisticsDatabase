#!/usr/bin/env python3
"""
Script to upload CORS configuration to Firebase Storage bucket.
This resolves the CORS errors when accessing JSON files from the web app.
"""

import json
import subprocess
import sys
import os

def upload_cors_to_firebase():
    """Upload CORS configuration to Firebase Storage bucket."""
    
    # Your Firebase Storage bucket name
    bucket_name = "rail-statistics.firebasestorage.app"
    
    # CORS configuration
    cors_config = [
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
    
    # Save CORS config to temporary file
    cors_file = "temp_cors.json"
    with open(cors_file, 'w') as f:
        json.dump(cors_config, f, indent=2)
    
    try:
        # Upload CORS configuration using gsutil
        print(f"🚀 Uploading CORS configuration to bucket: {bucket_name}")
        
        cmd = [
            "gsutil", "cors", "set", cors_file, f"gs://{bucket_name}"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ CORS configuration uploaded successfully!")
            print("🔄 The changes may take a few minutes to take effect.")
            print("💡 Try refreshing your web app after a few minutes.")
        else:
            print("❌ Failed to upload CORS configuration:")
            print(f"Error: {result.stderr}")
            print("\n💡 Make sure you have gsutil installed and configured.")
            print("   Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install")
            
    except FileNotFoundError:
        print("❌ gsutil not found. Please install Google Cloud SDK:")
        print("   https://cloud.google.com/sdk/docs/install")
        print("\n💡 After installation, run 'gcloud auth login' to authenticate.")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        
    finally:
        # Clean up temporary file
        if os.path.exists(cors_file):
            os.remove(cors_file)

def check_gsutil():
    """Check if gsutil is available."""
    try:
        result = subprocess.run(["gsutil", "version"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

if __name__ == "__main__":
    print("🚂 Firebase Storage CORS Configuration Uploader")
    print("=" * 50)
    
    if not check_gsutil():
        print("❌ gsutil not found. Please install Google Cloud SDK first.")
        print("\n📋 Installation steps:")
        print("1. Visit: https://cloud.google.com/sdk/docs/install")
        print("2. Download and install the SDK for your platform")
        print("3. Run 'gcloud auth login' to authenticate")
        print("4. Run this script again")
        sys.exit(1)
    
    print("✅ gsutil found. Proceeding with CORS upload...")
    upload_cors_to_firebase()
