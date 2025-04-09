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
git clone <repo url>
cd task-manager
```

### 2. Setup Backend
Navigate to the Backend Folder
``` bash

cd server
```
### 3.Install Backend Dependencies

``` bash

npm install
```
### 4.Setup Environment Variables
Create a .env file in the server/ directory and add the following variables:

``` bash

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

FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_AUTH_URI=
FIREBASE_TOKEN_URI=
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=
FIREBASE_CLIENT_X509_CERT_URL=
FIREBASE_UNIVERSE_DOMAIN=

```

Replace placeholders (e.g., <your-mongodb-connection-string>) with your actual values. For example, MONGO_URI might look like mongodb+srv://user:password@cluster0.mongodb.net/dbname.



### 5. Setup Frontend
Navigate to the Frontend Folder

``` bash

cd client
```
Install Frontend Dependencies

``` bash
npm install
```

Setup Environment Variables
Create a .env file in the client/ directory and add the following variables:

bash 
```

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
```
Replace placeholders (e.g., <your-firebase-api-key>) with your actual values from Firebase and Agora consoles. Ensure all variables are prefixed with VITE_ for Vite compatibility.

### 6. Run the Application
Run the Backend
``` bash

cd server
nodemon start
```

Uses nodemon to start the server with auto-restart on changes.
The backend will run on http://localhost:5000 (or your specified PORT).

Run the Frontend
``` bash

cd client
npm run dev
```
Starts the Vite development server.
The frontend will run on http://localhost:5173 (default Vite port).

Access the Application
Open your browser to http://localhost:5173 to use the frontend.
Backend APIs will be available at http://localhost:5000.

