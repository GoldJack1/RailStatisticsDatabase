# Firebase Configuration Setup

## 🔐 Security Fix Applied

The Firebase API keys have been moved to environment variables for security. You need to create a local environment file to run the application.

## 📋 Setup Instructions

### 1. Create Environment File

Create a file named `.env.local` in the root directory with these contents:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyD0-OjpeptPX5zG1x0411nkP0cdQq5oWXc
REACT_APP_FIREBASE_AUTH_DOMAIN=rail-statistics.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://rail-statistics-default-rtdb.europe-west1.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=rail-statistics
REACT_APP_FIREBASE_STORAGE_BUCKET=rail-statistics.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=998967146702
REACT_APP_FIREBASE_APP_ID=1:998967146702:web:deea56da65d25bc92ff89f
REACT_APP_FIREBASE_MEASUREMENT_ID=G-VT13N64VR2
```

### 2. For Production/Deployment

When deploying to Netlify, Vercel, or other platforms, add these as environment variables in your hosting dashboard.

#### Netlify Environment Variables:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add each `REACT_APP_*` variable with its corresponding value

#### Vercel Environment Variables:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable for Production, Preview, and Development

### 3. Local Development

After creating `.env.local`:

```bash
npm start
```

The app will automatically load the environment variables.

## 🔒 Security Notes

- `.env.local` is already in `.gitignore` and won't be committed
- Never commit API keys to git repositories
- Use environment variables for all sensitive configuration
- Consider rotating API keys if they were previously exposed

## 📁 File Structure

```
netlify-react-app/
├── .env.local              # Your local environment (create this)
├── .env.example            # Template (optional)
├── FIREBASE_SETUP.md       # This guide
└── src/
    └── firebase.js         # Updated to use env vars
```
