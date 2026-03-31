# Technology Stack

## Programming Languages
- **JavaScript (ES6+)**: Primary language for all application logic
- **HTML5**: Markup structure (index.html)
- **CSS3**: Styling and responsive design (style.css)

## Runtime Environment
- **Browser-based**: Runs entirely in modern web browsers
- **No build tools required**: Direct ES6 module loading
- **Client-side only**: No server-side processing needed

## Core Technologies

### Frontend
- **Vanilla JavaScript**: No frontend framework dependencies
- **ES6 Modules**: Native browser module system (`type="module"`)
- **DOM API**: Direct DOM manipulation for UI rendering
- **localStorage API**: Client-side session persistence

### Backend Services
- **Firebase SDK**: Cloud backend integration
  - **Firestore**: NoSQL document database for visitor data
  - **Firebase App**: Core Firebase initialization
- **Geolocation API**: Browser-based location detection

## Dependencies

### External Libraries
- **Firebase JavaScript SDK** (CDN or npm):
  - `firebase/app`
  - `firebase/firestore`

### No Build System
- Direct browser module loading
- No webpack, Vite, or bundler required
- No transpilation needed (modern browser targets)

## Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Text editor or IDE
- Firebase project with Firestore enabled

### Local Development
```bash
# Clone repository
git clone https://github.com/hazemezz123/Kali_Linux_Simulation

# Open in browser
# Simply open index.html in a web browser
# Or use a local server:
python -m http.server 8000
# or
npx serve
```

### Firebase Configuration
1. Create Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Update Firebase config in `src/constants.js`
4. Apply security rules from `firestore.rules`

## Browser Compatibility
- **Modern browsers** with ES6 module support
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **Minimum requirements**:
  - ES6 module support
  - localStorage API
  - Fetch API
  - Geolocation API (optional)

## Security Configuration

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /visitors/{document} {
      allow read: if true;
      allow create: if [validation rules];
      allow update, delete: if false;
    }
  }
}
```

### Security Features
- Read-only and create-only permissions
- Input validation on server side
- No sensitive data exposure
- Public API keys (standard for web apps)

## Deployment

### Static Hosting Options
- **GitHub Pages**: Direct deployment from repository
- **Firebase Hosting**: Integrated with Firebase backend
- **Netlify/Vercel**: Simple drag-and-drop deployment
- **Any static web server**: No special requirements

### Deployment Commands
```bash
# Firebase Hosting
firebase init hosting
firebase deploy

# GitHub Pages
# Push to gh-pages branch or configure in repository settings
```

## Development Tools
- **Git**: Version control
- **GitHub**: Repository hosting
- **Firebase Console**: Backend management
- **Browser DevTools**: Debugging and testing

## Performance Considerations
- **No bundling**: Direct module loading (HTTP/2 recommended)
- **Minimal dependencies**: Only Firebase SDK
- **Client-side rendering**: No server processing
- **localStorage caching**: Fast session restoration
