# FlashMob Learning - Spontaneous Study Sessions Platform

A location-based platform that enables students to create and discover immediate study opportunities. Find nearby peers who want to study the same topic right now!

## 🚀 Featuressssss

- **Location-based Session Discovery**: Find study sessions near you using GPS
- **Instant Session Creation**: Create study sessions starting in 15-60 minutes
- **Real-time Matching**: Get matched with students studying the same subjects
- **Two-tier Admin System**: Session admins and platform admins
- **User Preferences**: Set favorite subjects and maximum travel distance
- **Check-in System**: Confirm attendance for sessions

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd flashmob-learning
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration
# Update MongoDB URI and JWT secret
```

**Backend .env Configuration:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flashmob_learning
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

**Option A - MongoDB Service:**
```bash
# On macOS (using Homebrew)
brew services start mongodb-community

# On Windows
net start MongoDB

# On Linux
sudo systemctl start mongod
```

**Option B - Direct Start:**
```bash
mongod --dbpath /path/to/your/data/directory
```

### 4. Seed the Database

```bash
# From the backend directory
npm run seed
```

This will populate your database with:
- 5 sample venues
- 3 sample locations
- 3 sample courses
- 3 sample instructors
- 3 sample sections

### 5. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

The backend API will be running at `http://localhost:5000`

### 6. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 7. Start the Frontend

```bash
npm start
```

The frontend will automatically open at `http://localhost:3000`

## 📁 Project Structure

```
flashmob-learning/
├── backend/
│   ├── models/
│   │   └── index.js          # MongoDB schemas
│   ├── server.js             # Express server & API routes
│   ├── seed.js               # Database seeding script
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CreateSession.js
│   │   │   ├── SessionList.js
│   │   │   ├── SessionDetails.js
│   │   │   └── UserProfile.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   └── CreateSession.css
│   ├── package.json
│   └── .env (optional)
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/nearby` - Get nearby sessions
- `GET /api/sessions/:session_id` - Get session details
- `POST /api/sessions/:session_id/join` - Join a session
- `POST /api/sessions/:session_id/checkin` - Check-in to session
- `DELETE /api/sessions/:session_id` - Cancel session (admin only)

### Venues
- `GET /api/venues` - Get all venues
- `GET /api/venues/:venue_id` - Get venue by ID

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/preferences` - Update user preferences

## 🧪 Testing the Application

### 1. Register a New Account
- Navigate to `http://localhost:3000`
- Click "Sign up"
- Fill in your details and select your subject interests
- Set your maximum travel distance

### 2. Create a Study Session
- After logging in, click "Create Session"
- Select a subject and topic
- Choose a venue from the dropdown
- Set start time (15-60 minutes from now)
- Set duration and max participants
- Click "Create Session"

### 3. Find Sessions
- Click "Find Sessions" from the dashboard
- Browse available sessions near you
- Click on a session to view details
- Join sessions you're interested in

### 4. Enable Location Services
- Allow the browser to access your location when prompted
- This enables the nearby session feature

## 🔒 Security Notes

**Important for Production:**

1. Change the JWT_SECRET in `.env` to a strong, random string
2. Use environment-specific MongoDB URIs
3. Enable HTTPS
4. Add rate limiting to API endpoints
5. Implement input validation and sanitization
6. Add CORS whitelist for production domains

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows (then kill PID)
```

### Location Not Working
- Ensure you're using HTTPS or localhost
- Check browser location permissions
- Allow location access when prompted

## 📱 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers with geolocation support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team

---

**Happy Studying! 📚✨**
