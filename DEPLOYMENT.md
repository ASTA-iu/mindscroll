# MindScroll - Installation & Deployment Guide

This guide covers installing MindScroll on any Windows, Mac, or Linux computer.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - **Local MongoDB**: [Download Community Edition](https://www.mongodb.com/try/download/community)
   - **MongoDB Atlas** (Cloud): [Create free account](https://www.mongodb.com/cloud/atlas)
3. **Hugging Face API Key** (Free):
   - Go to https://huggingface.co/settings/tokens
   - Create a new token with read access
   - Copy and save it

4. **Git** (Optional, for cloning): [Download here](https://git-scm.com/)

---

## 🚀 Step 1: Get the Code

### Option A: Clone from Git
```bash
git clone <your-repository-url>
cd mindscroll
```

### Option B: Download ZIP
1. Download the project as ZIP
2. Extract it to your desired location
3. Open terminal/command prompt in the extracted folder

---

## 🔧 Step 2: Backend Setup

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```
*This downloads all required Node.js packages (~5-10 minutes depending on internet)*

### 3. Create `.env` File
Create a file named `.env` in the `backend` folder with:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mindscroll
# For MongoDB Atlas (cloud), use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindscroll

# AI APIs
HUGGING_FACE_API_KEY=your_hf_api_key_here
SIGHTENGINE_KEY=your_sightengine_key_here

# Server
PORT=5000
NODE_ENV=development

# Frontend Communication
CORS_ORIGIN=http://localhost:3000
```

**Where to find each value:**
- `HUGGING_FACE_API_KEY`: From https://huggingface.co/settings/tokens
- `MONGODB_URI`: 
  - Local: `mongodb://localhost:27017/mindscroll`
  - Atlas: Copy from MongoDB Atlas dashboard → Connect → Connection String
- `SIGHTENGINE_KEY`: Optional (sign up at https://sightengine.com if needed)

---

## 🎨 Step 3: Frontend Setup

### 1. Navigate to Frontend
```bash
cd ../frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Setup (Optional)
Frontend uses `.env` file (if needed):
```env
REACT_APP_API_URL=http://localhost:5000/api
```
*This file may already exist - no changes needed for local development*

---

## ▶️ Step 4: Start the Application

You'll need **2 terminal windows** (one for backend, one for frontend).

### Terminal 1: Start Backend (Port 5000)
```bash
cd backend
npm start
```
**Expected Output:**
```
Server running on port 5000
✓ MongoDB connected
✓ Ready to accept requests
```

### Terminal 2: Start Frontend (Port 3000)
```bash
cd frontend
npm start
```
**Expected Output:**
```
Compiled successfully!
You can now view mindscroll in the browser.
Local: http://localhost:3000
```

### 3. Open Application
Visit: **http://localhost:3000** in your browser

---

## 🌐 Running on a Different Computer

### Quick Copy Steps:
1. **Copy the project folder** to the new computer
2. **Skip node_modules** (too large) - they will be reinstalled
3. Follow steps 2-4 above (Installation & Setup)

### Network Access (Same WiFi/Network):
If you want to access from another device on same network:

1. Find your computer's IP address:
   - **Windows**: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
   - **Mac/Linux**: Terminal, type `ifconfig`

2. On the other device, visit:
   ```
   http://<your-ip>:3000
   ```
   Example: `http://192.168.1.100:3000`

3. Make sure ports 3000 and 5000 are not blocked by firewall

---

## ⚙️ MongoDB Setup

### Option A: Local MongoDB (Easiest for Local Development)

**Windows:**
1. Download MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Run installer and follow prompts
3. MongoDB will start as a service automatically
4. Use connection string: `mongodb://localhost:27017/mindscroll`

**Mac/Linux:**
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install -y mongodb
sudo service mongod start
```

### Option B: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a new cluster (M0 tier is free)
4. Click "Connect" → "Add Connection IP" → "Allow Access from Anywhere" (for development)
5. Create database user and password
6. Copy connection string
7. Replace `<username>`, `<password>`, and `<password>` in the string
8. Use this in `MONGODB_URI` in backend `.env`

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/mindscroll
```

---

## 🔑 API Keys Setup

### Hugging Face API Key (Required)

1. Visit https://huggingface.co/join
2. Create free account
3. Go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Select scope: "Read" (for inference)
6. Copy the token
7. Paste in backend `MONGODB_URI` as `HUGGING_FACE_API_KEY`

### Sightengine API Key (Optional)

For advanced image moderation:
1. Visit https://sightengine.com
2. Sign up (free tier available)
3. Get API key from dashboard
4. Add to backend `.env`

---

## ✅ Verify Installation

Test if everything works:

1. **Backend API Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"Server is running"}`

2. **MongoDB Connection:**
   - Check backend logs - should show "✓ MongoDB connected"

3. **Frontend:**
   - Open http://localhost:3000
   - Should load without errors

---

## 🐛 Troubleshooting

### Port Already in Use
**Error:** `Port 3000/5000 already in use`

**Solution:**
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :5000
```
Kill the process or use different ports in `.env`

### MongoDB Connection Failed
**Error:** `MongooseError: Cannot connect to MongoDB`

**Solution:**
1. Verify MongoDB is running
2. Check `MONGODB_URI` in `.env` is correct
3. For Atlas: ensure IP is whitelisted and credentials are correct
4. Check username/password have no special characters (escape with URL encoding)

### npm install Fails
**Error:** Module not found or compilation errors

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Hugging Face API Rate Limited
**Error:** `HF API rate limit exceeded`

**Solution:**
- Free tier has limits (~1 request per second)
- Upgrade account for higher limits
- Or add delays between API calls

---

## 📦 Project Structure

```
mindscroll/
├── backend/              # Node.js + Express server
│   ├── server.js         # Main server file
│   ├── routes/           # API endpoints
│   ├── models/           # MongoDB schemas
│   ├── utils/            # AI analysis services
│   ├── middleware/       # Authentication, validation
│   ├── .env              # Configuration (create this)
│   └── package.json      # Dependencies
│
├── frontend/             # React application
│   ├── src/              # React source code
│   │   ├── App.js        # Main component
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── services/     # API client
│   ├── public/           # Static files
│   ├── package.json      # Dependencies
│   └── .env              # Configuration (optional)
│
├── PROJECT_THESIS.md     # Complete documentation
├── QUICKSTART.md         # 5-minute quick start
├── README.md             # Project overview
└── SETUP.md              # Original setup guide
```

---

## 🚀 Production Deployment

For deploying to production (beyond local development):

1. Use MongoDB Atlas (cloud)
2. Deploy backend to Heroku, AWS, or similar
3. Deploy frontend to Netlify, Vercel, or AWS
4. Update `CORS_ORIGIN` to production domain
5. Use production-grade HF or other AI service
6. Enable HTTPS
7. Set `NODE_ENV=production`

See docstring in code files for specific production configurations.

---

## 📞 Support

If you encounter issues:
1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Review `.env` file for missing or incorrect values
4. Verify all prerequisites are installed
5. Check that ports 3000 and 5000 are available

---

**Last Updated:** March 2026
