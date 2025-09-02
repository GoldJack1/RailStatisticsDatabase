# 🚂 Rail Statistics Database

A modern web application for managing railway station data with Firebase backend and React frontend.

## Features

- 🔐 **Secure Authentication** - Firebase Authentication with email/password
- 📊 **Station Management** - Add, edit, view, and search railway stations
- 🌍 **Geospatial Data** - Store coordinates as Firestore GeoPoints
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Real-time Updates** - Instant data synchronization with Firestore
- 🚀 **Fast Performance** - Optimized React components and lazy loading

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project with Authentication and Firestore enabled
- Netlify account

### 1. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing `rail-statistics` project
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**
5. Create a user account in Authentication > Users

### 2. Configure Firebase

1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click the web icon (</>)
4. Register your app and copy the config
5. Update `src/firebase.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Install & Build

```bash
# Navigate to the app directory
cd netlify-react-app

# Make setup script executable
chmod +x setup_and_deploy.sh

# Run setup script
./setup_and_deploy.sh
```

### 4. Deploy to Netlify

```bash
# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

## 📁 Project Structure

```
netlify-react-app/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── components/         # React components
│   │   ├── Login.js       # Authentication form
│   │   ├── Dashboard.js   # Main dashboard
│   │   └── PrivateRoute.js # Route protection
│   ├── contexts/
│   │   └── AuthContext.js # Authentication context
│   ├── App.js             # Main app component
│   ├── index.js           # App entry point
│   ├── index.css          # Global styles
│   └── firebase.js        # Firebase configuration
├── package.json            # Dependencies and scripts
├── netlify.toml           # Netlify configuration
├── setup_and_deploy.sh    # Setup automation script
└── README.md              # This file
```

## 🔐 Authentication

The app uses Firebase Authentication with email/password:

1. **Create User**: Go to Firebase Console > Authentication > Users > Add User
2. **Login**: Use the created credentials in the app
3. **Security**: All routes except `/login` require authentication

## 🌐 Netlify Configuration

The `netlify.toml` file includes:

- **Build Settings**: Publishes from `build` directory
- **Routing**: Handles React Router with proper redirects
- **Security Headers**: XSS protection, frame options, etc.
- **Node Version**: Specifies Node.js 18+

## 🛠️ Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🔧 Customization

### Adding New Components

1. Create component in `src/components/`
2. Import in `App.js`
3. Add route in the Routes section

### Styling

- Uses Bootstrap 5 for responsive design
- Custom CSS in `src/index.css`
- Bootstrap Icons for icons

### Firebase Integration

- Authentication handled in `AuthContext.js`
- Firestore operations in individual components
- Real-time updates with Firestore listeners

## 🚨 Troubleshooting

### Build Errors

- Ensure Node.js 18+ is installed
- Clear `node_modules` and run `npm install` again
- Check Firebase config in `firebase.js`

### Authentication Issues

- Verify Firebase Authentication is enabled
- Check if user exists in Firebase Console
- Ensure Firebase config is correct

### Netlify Deployment Issues

- Check `netlify.toml` configuration
- Verify build command and publish directory
- Check Netlify build logs for errors

## 📱 Mobile Support

The app is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets
- All screen sizes

## 🔒 Security Features

- Protected routes with authentication
- Firebase security rules
- HTTPS enforcement on Netlify
- XSS protection headers
- CSRF protection

## 🎯 RRT Management Features (Latest Updates)

### Ranger Rover Travelcard (RRT) System
- **Dynamic Form Generation**: Automatically creates forms based on JSON structure
- **Smart Object Array Handling**: Properly displays and edits complex railcard data
- **Firebase Storage Integration**: Direct integration with Firebase Storage for RRT files
- **JSON Editor**: Advanced editing capabilities for complex nested structures

### Recent Fixes ✅
- **Railcard Display**: Fixed `[object Object]` display issue - railcards now show as readable JSON
- **Save Functionality**: Fixed navigation redirect after saving changes
- **Array Handling**: Improved flatten/unflatten logic for nested object arrays
- **Route Management**: Corrected routing paths for proper navigation

### RRT Components
- `RRTList.js` - Browse and manage all RRT files
- `DynamicRRTForm.js` - Advanced form for editing any RRT structure
- `RRTForm.js` - Standard form for basic RRT operations
- `RRTDashboard.js` - Main RRT management interface

## 🌟 Future Enhancements

- User role management
- Audit logging
- Bulk import/export
- Advanced search filters
- Data visualization charts
- API rate limiting
- RRT bulk operations
- Enhanced railcard validation

## 📞 Support

For issues or questions:
1. Check Firebase Console for authentication/ Firestore issues
2. Review Netlify build logs
3. Check browser console for JavaScript errors
4. Verify all environment variables are set

---

**Built with ❤️ for Railway Statistics**
