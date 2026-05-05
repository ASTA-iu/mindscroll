# 🚀 MindScroll Complete Setup Guide
## AI-Powered Educational Content Platform v1.1 with Search & Tag Discovery

**Version:** 1.1.0 (March 2025)  
**Last Updated:** March 2025  
**Status:** Production Ready - Fully Tested

---

## 📋 Table of Contents
1. [Quick Start (TL;DR)](#quick-start-tldr)
2. [System Requirements](#system-requirements)
3. [Prerequisites & Installation](#prerequisites--installation)
4. [Environment Setup](#environment-setup)
5. [Database Configuration](#database-configuration)
6. [API Keys Configuration](#api-keys-configuration)
7. [Running the Application](#running-the-application)
8. [New Features in v1.1](#new-features-in-v11)
9. [Verification & Testing](#verification--testing)
10. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start (TL;DR)

**For Experienced Developers - Copy & Paste:**

```bash
# 1. Install dependencies
cd mindscroll/backend && npm install
cd ../frontend && npm install

# 2. Create .env file in backend/ with:
MONGODB_URI=mongodb://localhost:27017/mindscroll
JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
AI_API_KEY=hf_your_huggingface_token_here

# 3. Ensure MongoDB is running:
mongosh  # or mongo

# 4. Start both servers (separate terminals):
# Terminal 1:
cd mindscroll/backend && npm start

# Terminal 2:
cd mindscroll/frontend && npm start

# 5. Open http://localhost:3000 in browser
```

**Done!** Your MindScroll v1.1 platform is now running with:
- ✅ AI-powered educational content filtering
- ✅ Full-text search functionality
- ✅ Tag-based content discovery (single & multi-tag filtering)
- ✅ User profiles, likes, comments, follows
- ✅ Post detail pages for individual post viewing

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS:** Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM:** 4GB (8GB recommended)
- **Disk Space:** 2GB free space
- **Internet:** Required for API connections

### Required Software (Tested & Working)
- **Node.js:** v16.0.0 or higher ([Download](https://nodejs.org/))
- **npm:** v7.0.0 or higher (comes with Node.js)
- **MongoDB:** v4.4 or higher ([Download Community Edition](https://www.mongodb.com/try/download/community))
- **Firefox or Chrome:** For testing the deployed application
- **Git:** (Optional, for cloning the repository)

### Optional but Recommended
- **MongoDB Compass:** Visual database management tool
- **Postman:** API testing tool

### Verify Installation
```bash
# Check Node.js version
node --version
# Expected output: v16.x.x or higher

# Check npm version
npm --version
# Expected output: v7.x.x or higher
```

---

## 📦 Prerequisites & Installation

### Step 1: Clone/Copy the Project

**Option A - Using Git:**
```bash
git clone <repository-url> mindscroll
cd mindscroll
```

**Option B - Manual Copy:**
- Copy the `mindscroll` folder to your desired location
- Open terminal/command prompt in the copied folder

### Step 2: Install Backend Dependencies

```bash
cd mindscroll/backend
npm install
```

**Expected output:** 
```
added XX packages in X.XXs
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Expected output:**
```
added XX packages in X.XXs
```

---

## 🔧 Environment Setup

### Create Backend Environment File

1. **Navigate to backend folder:**
   ```bash
   cd mindscroll/backend
   ```

2. **Create `.env` file** (copy the template below):
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

3. **If `.env.example` doesn't exist, create `.env` file manually:**

   **File:** `mindscroll/backend/.env`
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/mindscroll
   
   # Authentication (Keep as is - secure random JWT secret)
   JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   
   # AI API - Only Hugging Face Required for v1.1
   AI_API_KEY=hf_your_huggingface_api_key_here
   ```
   
   **Note:** Only `AI_API_KEY` is required for v1.1. Other APIs are optional.

---

## 🗄️ Database Configuration

### Step 1: Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as service, it should auto-start
# Otherwise, run:
mongod
```

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo systemctl start mongod
```

### Step 2: Verify MongoDB Connection

```bash
# Connect to MongoDB
mongo
# or
mongosh
```

You should see:
```
> 
```

Type `exit` to close MongoDB shell.

### Step 3: Create Database (Optional - Auto-created on first run)

The application will automatically create the `mindscroll` database when you first run it.

---

## 🔑 API Keys Configuration (v1.1)

### ✅ REQUIRED: Hugging Face API Key (AI Text/Image Analysis)

**This is the only required API key for v1.1**

1. **Visit:** https://huggingface.co/settings/tokens
2. **Sign up/Login** with email (free account)
3. **Click "New token"** in the settings
4. **Name:** "MindScroll"
5. **Type:** Select "Read only"
6. **Copy the token** - it starts with `hf_`
7. **Add to `.env` in backend folder:**
   ```env
   AI_API_KEY=hf_your_copied_token_here
   ```

**Example:**
```env
AI_API_KEY=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
```

✅ **That's it!** This single key powers:
- Text classification (educational scoring)
- Image analysis via OCR (Tesseract.js - included locally)
- Video frame analysis
- Content moderation

### ⏸️ Optional APIs (For Future Use)
- OpenRouter (advanced image analysis - optional)
- SightEngine (dedicated NSFW detection - optional)

**These are NOT required for v1.1 and can be skipped.**

---

## 🚀 Running the Application

### Option 1: Run Both Servers (Recommended)

#### Terminal 1 - Backend Server
```bash
cd mindscroll/backend
node server.js
```

**Expected Output:**
```
Server listening on port 5000
MongoDB connected successfully
✓ All moderation services initialized
```

#### Terminal 2 - Frontend Server
```bash
cd mindscroll/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view the application in the browser.
  Local:            http://localhost:3000
```

### Option 2: Separate Scripts (Linux/macOS)

Create `start-all.sh`:
```bash
#!/bin/bash
cd mindscroll/backend
node server.js &
BACKEND_PID=$!

cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

Run:
```bash
chmod +x start-all.sh
./start-all.sh
```

### Option 3: Windows PowerShell Script

Create `start-all.ps1`:
```powershell
# Terminal 1: Backend
Start-Process powershell -ArgumentList "cd '$PWD\mindscroll\backend'; node server.js"

# Wait 3 seconds for backend to start
Start-Sleep -Seconds 3

# Terminal 2: Frontend
Start-Process powershell -ArgumentList "cd '$PWD\mindscroll\frontend'; npm start"

Write-Host "✓ Both servers starting..."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
```

Run:
```powershell
.\start-all.ps1
```

---

## ✅ Verification & Testing

### Step 1: Check Backend Health

```bash
# In a new terminal
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"Server is running"}
```

### Step 2: Open Application in Browser

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### Step 3: Test User Registration

1. Click **Register**
2. Fill in credentials:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `Test@1234`
3. Click **Register**

**Expected Result:** Redirected to login page

### Step 4: Test Login

1. Use credentials from Step 3
2. Click **Login**

**Expected Result:** Redirected to Feed page

### Step 5: Test NEW v1.1 Search Feature

1. **Go to Feed page** (after login)
2. **Look for Search Bar** (top of feed section)
3. **Type in search box:** "biology"
4. **Press Enter or click button**

**Expected Result:**
- Posts containing "biology" appear in feed
- URL changes to: `http://localhost:3000/feed?search=biology`
- Posts are filtered by content match (case-insensitive)

### Step 6: Test NEW v1.1 Tag Filtering

1. **In Feed page**, look for **Tag Input Section** below search bar
2. **Type a tag:** "science"
3. **Click "Add Tag"** or press Enter
4. **See suggestions dropdown** (existing tags from posts)

**Expected Result:**
- Tag appears as a "chip" with an X to remove
- Feed reloads showing only posts with "science" tag
- URL changes to: `http://localhost:3000/feed?tags=science`
- You can add multiple tags: `?tags=science,biology,education`

### Step 7: Test Combined Search + Tags

1. **Search for:** "malaria" 
2. **Add tags:** "health" + "medicine"
3. **Feed shows posts about malaria that are tagged as medical content**

**URL becomes:** `http://localhost:3000/feed?search=malaria&tags=health,medicine`

### Step 8: Test Clickable Tags

1. **View a post** (click on any post to see PostDetail page)
2. **Look for tags displayed on the post**
3. **Click on any tag** (e.g., "chemistry")
4. **Feed is filtered to show only posts with that tag**

**Expected Result:**
- Page navigates to: `/feed?tags=chemistry`
- Only posts tagged "chemistry" appear
- Works for multiple tags if you combine them

### Step 9: Test Custom Tags (Post Owners)

1. **Create a new post** with educational content (you are the owner)
2. **After post approval**, view your post
3. **Look for "Add Tag" button** (only visible to post owner)
4. **Add a custom tag:** "mycustomtag"
5. **Tag appears on post** and is available for filtering

**Expected Result:**
- Your tag is saved to the post
- Tag suggestions now include it
- All users can filter by your custom tag

### Step 10: Test Post Detail Page

1. **In Feed**, click on any post
2. **NEW: Full post detail page loads**
3. **See:**
   - Full post content
   - All images/videos
   - Educational score badge
   - All comments
   - Like/comment buttons
   - All tags displayed and clickable
   - Back to Feed button

**URL:** `http://localhost:3000/post/:postId`

### Step 11: Test Post Creation with AI Moderation

1. **Go to Feed** → Click **Create Post**
2. **Enter Text:** "Learn about malaria transmission cycles and disease prevention methods"
3. **Upload Image:** Select an educational diagram or scientific image
4. **Click Submit**

**Expected Result:**
```
AI Educational Content Analysis Modal appears
Educational Value Score: 60-75%
Status: ✓ Approved - Ready to Post!
Analysis Breakdown:
  - Text Content: 70%
  - Image Analysis: 65%
  - Combined: 68%
AI-Generated Tags: [malaria, disease, health, education, medicine]
```

### Step 12: Test Rejection (Inappropriate Content)

1. **Go to Feed** → Click **Create Post**
2. **Enter Text:** "haha lol this is so funny 😂"
3. **Click Submit**

**Expected Result:**
```
Error Modal Appears
❌ Rejection: Content does not meet educational standards
Educational Value Score: 15%
Minimum required: 65%
Reason: Non-educational/meme content detected
```

---

## ✨ New Features in v1.1

### 1. Full-Text Search
- **Search any post by content** - Type keywords in the search bar
- **Case-insensitive matching** - "biology", "Biology", "BIOLOGY" all match
- **URL persistent** - Shareable search links: `?search=biology`
- **Works with tags** - Combine search with tag filtering

### 2. AI-Generated Tags
- **Automatic semantic tagging** - Every post gets educational tags
- **Multiple tags per post** - Posts categorized by topic (biology, physics, etc.)
- **Tag suggestions** - Autocomplete dropdown as you type
- **Clickable tag discovery** - Click any tag to filter feed

### 3. Tag-Based Filtering
- **Single tag filtering** - View all posts with "science" tag
- **Multi-tag filtering** - Combine tags: `biology` AND `medical`
- **OR logic filtering** - Shows posts with ANY selected tag
- **Tag UI** - Visual chip display with remove button
- **URL state persistence** - Share filter links: `?tags=science,biology`

### 4. Custom User Tags
- **Post owners can add tags** - Add your own tags to your posts
- **Custom tag input** - Type and add with button or Enter key
- **Tag management** - Remove tags anytime
- **Immediate availability** - Custom tags searchable/filterable right away

### 5. Post Detail Page
- **Individual post view** - Click any post to see full details
- **Complete information** - All content, comments, tags, scores visible
- **Clickable tags** - Jump to tag-filtered feed from post detail
- **Easy comments** - See and add all comments in one place

### 6. Improved Feed Experience
- **Search + Filter together** - Use search AND tags simultaneously
- **Empty state messages** - Clear feedback when no posts match
- **URL state recovery** - Refresh page, tags/search persist
- **Pagination ready** - Load more posts as you scroll

---

## 🔒 AI Moderation System Explanation

### How Independent Content Checking Works

**Two-Stage Validation:**

#### Stage 1: Violation Detection (Independent Check)
- Text checked for: NSFW, violence, memes, drugs, offensive language
- Image checked for: NSFW/explicit content, violence, graphic content
- Video checked for: NSFW, violence
- **Result:** If ANY type has violations → Post REJECTED (score: 0%)

#### Stage 2: Educational Scoring (Only if Stage 1 Passes)
- Text educational value: 0-100%
- Image educational value: 0-100%
- Video educational value: 0-100%
- **Combined Score:** Weighted average
- **Threshold:** ≥50% = APPROVED, <50% = REJECTED

### Example Scenarios

**✅ APPROVED - Educational Content with Auto-Generated Tags:**
```
User Post: "Learn about photosynthesis and cellular respiration"
Image: Biology diagram with scientific labels

Analysis Results:
- Text Score: 80% (educational keywords detected)
- Image Score: 75% (OCR extracted labels, classified as educational)
- Combined Score: 78%
- Generated Tags: [cell-biology, photosynthesis, respiration, education, science]

Result: APPROVED ✅
Post appears in feed with green badge
Tags are immediately searchable and filterable
```

**❌ REJECTED - Meme Content:**
```
User Post: "haha lol this is so funny 😂 main character energy"

Analysis Results:
- Text Score: 5% (meme language detected: "haha", "lol", "energy")
- Meme Detection: TRUE
- Result: REJECTED ❌

Reason: Casual/non-educational content
User sees rejection modal with:
- Educational score: 5%
- Minimum required: 65%
- Suggestion: "Add educational context or factual information"
```

**✅ APPROVED - Medical with Auto-Tags:**
```
User Post: "Malaria is transmitted by Anopheles mosquitoes. Here are prevention methods..."
Image: Medical diagram showing parasite lifecycle

Analysis Results:
- Text Score: 85% (medical keywords: malaria, mosquito, prevention, transmission)
- Image Score: 80% (medical diagram recognized)
- Combined: 83%
- Generated Tags: [malaria, medicine, parasitology, public-health, disease-prevention]

Result: APPROVED ✅
Post appears in feed
Users can find it by searching "prevention" or filtering by "medicine" tag
```

---

## 🐛 Troubleshooting

### Issue: Port 5000 Already in Use

**Solution:**
```bash
# Windows - Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

**macOS/Linux:**
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Issue: "Cannot find module" Error

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Issue: MongoDB Connection Failed

**Check if MongoDB is running:**

**Windows:**
```bash
tasklist | findstr mongod
```

**macOS/Linux:**
```bash
ps aux | grep mongod
```

**If not running, start MongoDB:**

**Windows:**
```bash
mongod
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Issue: API Keys Not Working

1. **Verify `.env` file exists** in `mindscroll/backend/.env`
2. **Check API keys are not empty** - no spaces before/after
3. **Restart backend server** after adding keys
4. **Check backend console** for initialization messages

### Issue: Frontend Shows Blank Page

```bash
# Clear browser cache
# Windows: Ctrl+Shift+Delete
# macOS: Cmd+Shift+Delete

# Reinstall frontend dependencies
cd mindscroll/frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Image Upload Fails

1. **Check file size** - Maximum 5MB recommended
2. **Verify file format** - PNG or JPEG only
3. **Check browser console** for specific error messages
4. **Backend logs** may show more details

### Issue: Moderation Scores Are Low/Not Accurate

**Add more educational keywords to the image:**
- Use descriptive captions with scientific/medical terms
- Include labels, explanations, or learning context
- Ensure image is clear and professional quality

**Examples that score better:**
```
✅ "Diagram explaining the malaria parasite lifecycle - 
   showing how mosquitoes transmit Plasmodium to humans"

❌ "Malaria image"
```

---

## 📱 Accessing from Other Devices

### Same Network (LAN)

1. **Find your PC's IP address:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.x)
   
   # macOS/Linux
   ifconfig
   ```

2. **Update `.env` CORS setting:**
   ```env
   CORS_ORIGIN=http://YOUR_PC_IP:3000
   ```

3. **Access from other device:**
   ```
   http://YOUR_PC_IP:3000
   ```

### Remote Access (Outside Network)

Use tools like:
- **Ngrok** (recommended for testing)
- **AWS EC2** (for production)
- **DigitalOcean** (for production)

---

## 🔄 Project Structure

```
mindscroll/
├── backend/
│   ├── .env                    ← Configuration file (create this)
│   ├── server.js               ← Express server entry point
│   ├── package.json
│   ├── middleware/             ← Auth, validation middleware
│   ├── routes/                 ← API endpoints
│   ├── models/                 ← MongoDB schemas
│   └── utils/
│       ├── moderationIntegrationService.js  ← Main AI engine
│       ├── imageAnalysisService.js          ← Image analysis
│       ├── textAnalysisService.js           ← Text analysis
│       ├── hfModerationService.js           ← HuggingFace moderation
│       └── ...
│
├── frontend/
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/         ← React components
│   │   ├── pages/              ← Page components
│   │   ├── services/
│   │   │   └── api.js          ← Backend API calls
│   │   └── styles/
│   └── build/                  ← Production build
│
├── COMPLETE_SETUP_GUIDE.md    ← This file
├── AI_MODERATION_SYSTEM.md
├── README.md
└── package.json
```

---

## 📊 Performance Optimization

### Database Optimization for Search & Tags

**Add MongoDB indexes for better performance** (run in `mongosh`):

```javascript
// Connect to MongoDB and run these commands:
use mindscroll

// Index for feed sorting (newest first)
db.posts.createIndex({ createdAt: -1 })

// Index for author lookup
db.posts.createIndex({ author: 1 })

// Index for tag filtering (most important for v1.1)
db.posts.createIndex({ tags: 1 })

// Index for text search
db.posts.createIndex({ content: "text" })

// Index for educational status filtering
db.posts.createIndex({ isEducational: 1 })

// User indexes
db.users.createIndex({ email: 1, unique: true })
db.users.createIndex({ username: 1, unique: true })

// Check indexes were created
db.posts.getIndexes()
```

**These indexes significantly speed up:**
- Tag filtering queries
- Content search
- Feed pagination
- User lookups

### Frontend Performance

```bash
# Create production build (only needed for deployment)
cd mindscroll/frontend
npm run build

# Output: optimized files in frontend/build/ directory
```

### Frontend Performance

```bash
# Create production build
cd mindscroll/frontend
npm run build

# Serve compiled version
npx serve -s build -l 3000
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Keep API keys secret
2. **Use strong JWT_SECRET** - Generate new one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Enable HTTPS** in production
4. **Rotate API keys** regularly
5. **Implement rate limiting** on API endpoints
6. **Use environment variables** - Never hardcode secrets

---

## 📞 Support & Resources

### Common API Issues

- **HuggingFace:** https://huggingface.co/docs/api
- **OpenRouter:** https://openrouter.ai/docs
- **SightEngine:** https://www.sightengine.com/docs
- **MongoDB:** https://docs.mongodb.com/

### Useful Commands

```bash
# View backend logs
tail -f backend/logs.txt

# Clear all user data (development only)
mongo mindscroll --eval "db.dropDatabase()"

# Restart just backend
pkill -f "node server.js"
cd mindscroll/backend && node server.js

# Check all running Node processes
ps aux | grep node
```

---

## 🎉 You're All Set!

### Your MindScroll v1.1 is Ready!

**What You Now Have:**
- ✅ AI-powered educational content filtering
- ✅ Full-text content search across all posts
- ✅ AI-generated semantic tags on every post
- ✅ Multi-tag filtering with OR logic
- ✅ Custom user tags for post owners
- ✅ Clickable tags for instant filtering
- ✅ Individual post detail pages
- ✅ Combined search + tag filtering
- ✅ URL-persistent shareable links
- ✅ User authentication with JWT
- ✅ Likes, comments, follow system
- ✅ User profiles with bios and images

### Immediate Next Steps:

1. **Test all v1.1 features** (see Verification section above)
   - Create posts with different content types
   - Try the search feature
   - Test tag filtering
   - Try combining search + tags

2. **Explore tag suggestions** by hovering over tag input

3. **View Post Detail page** - click any post in feed

4. **Create custom tags** - add your own tags to your posts

5. **Share filtered links** - copy `?tags=xyz&search=abc` URLs to friends

### Helpful Commands for Future Use:

```bash
# Restart backend only (if you need to)
cd mindscroll/backend
npm start

# Restart frontend only (if you need to)
cd mindscroll/frontend
npm start

# Stop all Node processes
ps aux | grep node  # Find all node processes
kill -9 <PID>      # Kill specific process

# Access MongoDB directly
mongosh
use mindscroll
db.posts.find()        # View all posts
db.users.find()        # View all users
db.posts.countDocuments({ isEducational: true })  # Count approved posts

# View backend logs
cd mindscroll/backend
npm start 2>&1 | tee server.log
```

### Troubleshooting Quick Links:
- Port already in use? See "Port 5000 Already in Use" section
- Module not found? See "Cannot find module" section
- MongoDB not running? See "MongoDB Connection Failed" section
- Search not working? See "Troubleshooting" section

---

**🎓 MindScroll v1.1 - Educational Content Platform with Intelligent Discovery**

**Happy Learning! 📚✨**
