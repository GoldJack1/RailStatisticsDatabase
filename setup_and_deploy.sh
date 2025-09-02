#!/bin/bash

echo "🚂 Setting up Station Admin React App for Netlify..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the app
echo "🔨 Building the app..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to build the app"
    exit 1
fi

echo "✅ App built successfully"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

echo "🚀 Ready to deploy to Netlify!"
echo ""
echo "📋 Next steps:"
echo "1. Update src/firebase.js with your actual Firebase config"
echo "2. Create a user account in Firebase Authentication"
echo "3. Run: netlify login"
echo "4. Run: netlify deploy --prod"
echo ""
echo "🔐 To create a user account:"
echo "1. Go to Firebase Console > Authentication > Users"
echo "2. Click 'Add User'"
echo "3. Enter email and password"
echo "4. Use these credentials to log into your app"
echo ""
echo "🌐 Your app will be available at the URL Netlify provides after deployment"
