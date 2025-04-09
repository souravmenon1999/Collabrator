Markdown

# Task Manager Application
This project is a full-stack task management application. It integrates Firebase for real-time data and notifications, Agora for real-time communication, and Google APIs for authentication.

## Project Structure
- **client**: The React Vite-based frontend.
- **server**: The Node.js-based backend.

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd task-manager
Replace <your-repository-url> with the actual URL of your Git repository.

2. Setup Backend
Navigate to the Backend Folder
Bash

cd server
Install Backend Dependencies
Bash

npm install
Setup Environment Variables
Create a .env file in the server/ directory and add the following variables:

Bash

PORT=5000
MONGO_URI=<your-mongodb-connection-string>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=<your-google-redirect-uri>
AGORA_APP_ID=<your-agora-app-id>
AGORA_APP_CERTIFICATE=<your-agora-app-certificate>
Backend Environment Variables Explained:
PORT: The port number the server will run on (default: 5000).
MONGO_URI: Connection string for your MongoDB database, used for storing task-related data.
GOOGLE_CLIENT_ID: Client ID from Google Cloud Console for OAuth authentication.
GOOGLE_CLIENT_SECRET: Secret key from Google Cloud Console for OAuth authentication.
GOOGLE_REDIRECT_URI: The URI where Google redirects after authentication (e.g., http://localhost:5000/api/google-callback).
AGORA_APP_ID: Unique identifier from Agora for real-time communication features.
AGORA_APP_CERTIFICATE: Certificate from Agora for generating secure tokens.
Replace placeholders (e.g., <your-mongodb-connection-string>) with your actual values. For example, MONGO_URI might look like mongodb+srv://user:password@cluster0.mongodb.net/dbname.

3. Setup Frontend
Navigate to the Frontend Folder
Bash

cd client
Install Frontend Dependencies
Bash

npm install
Setup Environment Variables
Create a .env file in the client/ directory and add the following variables:

Bash

VITE_AGORA_APP_ID=<your-agora-app-id>
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
VITE_FIREBASE_DATABASE_URL=<your-firebase-database-url>
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-messaging-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
VITE_FIREBASE_MEASUREMENT_ID=<your-firebase-measurement-id>
Frontend Environment Variables Explained:
VITE_AGORA_APP_ID: Agora App ID for enabling real-time communication in the frontend.
VITE_FIREBASE_API_KEY: API key from Firebase for authenticating with Firebase services.
VITE_FIREBASE_AUTH_DOMAIN: Domain used for Firebase Authentication.
VITE_FIREBASE_DATABASE_URL: URL to your Firebase Realtime Database for real-time data syncing.
VITE_FIREBASE_PROJECT_ID: Unique identifier for your Firebase project.
VITE_FIREBASE_STORAGE_BUCKET: Storage bucket URL for file uploads in Firebase.
VITE_FIREBASE_MESSAGING_SENDER_ID: Sender ID for Firebase Cloud Messaging (push notifications).
VITE_FIREBASE_APP_ID: App ID for your specific Firebase web app configuration.
VITE_FIREBASE_MEASUREMENT_ID: Measurement ID for Firebase Analytics tracking.
Replace placeholders (e.g., <your-firebase-api-key>) with your actual values from Firebase and Agora consoles. Ensure all variables are prefixed with VITE_ for Vite compatibility.

4. Run the Application
Run the Backend
Bash

cd server
npm run dev
Uses nodemon to start the server with auto-restart on changes.
The backend will run on http://localhost:5000 (or your specified PORT).

Run the Frontend
Bash

cd client
npm run dev
Starts the Vite development server.
The frontend will run on http://localhost:5173 (default Vite port).

Access the Application
Open your browser to http://localhost:5173 to use the frontend.
Backend APIs will be available at http://localhost:5000.

5. Build for Production (Optional)
Build the Frontend
Bash

cd client
npm run build
Outputs production-ready files to the client/dist/ folder.

Deploy the Backend
Bash

cd server
npm start
Ensure you’ve added a start script in server/package.json (e.g., "start": "node server.js").

Notes
Ensure you have Node.js (18.x or later) and npm (9.x or later) installed.
Set up Firebase, Agora, Google Cloud, and MongoDB accounts to obtain the necessary credentials.
Keep .env files secure and untracked by Git (use .gitignore).