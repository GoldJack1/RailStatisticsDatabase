#!/bin/bash

echo "🚂 Firebase Storage CORS Fix Script"
echo "=================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3 first."
    exit 1
fi

# Check if gsutil is available
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil not found. Please install Google Cloud SDK first."
    echo ""
    echo "📋 Installation steps:"
    echo "1. Visit: https://cloud.google.com/sdk/docs/install"
    echo "2. Download and install the SDK for your platform"
    echo "3. Run 'gcloud auth login' to authenticate"
    echo "4. Run this script again"
    exit 1
fi

echo "✅ Python 3 found"
echo "✅ gsutil found"
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

echo "✅ Authenticated with Google Cloud"
echo ""

# Set the project
echo "🔧 Setting project to 'rail-statistics'..."
gcloud config set project rail-statistics

# Run the Python script
echo "🚀 Running CORS configuration upload..."
python3 upload_cors.py

echo ""
echo "🎉 CORS fix completed!"
echo "💡 Wait 2-3 minutes for changes to take effect, then refresh your web app."
