# Kali Linux Simulation

Simple browser-based Kali terminal simulation project with visitor tracking.

## Owner Info

- GitHub Account: https://github.com/hazemezz123
- Project Repository: https://github.com/hazemezz123/Kali_Linux_Simulation

## Setup

1. Clone the repository
2. Open `index.html` in your browser
3. Enter your name when prompted

## Features

- Browser-based Kali Linux terminal simulator
- Visitor registration and tracking
- Persistent user sessions using localStorage
- Firebase Firestore integration

## Firebase Security

The Firebase configuration is public (as intended for web apps). Security is enforced through Firestore Security Rules:

- Users can only **read** and **create** visitors
- Cannot update or delete existing records
- Name validation (1-100 characters)
- Timestamp validation

### Applying Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the content from `firestore.rules`
3. Publish the rules

## Notes

- This project simulates terminal behavior in the browser
- Commands are educational/simulated and do not run real system tools
- Firebase API keys for web apps are designed to be public
- Security is handled by Firestore Security Rules, not by hiding keys
