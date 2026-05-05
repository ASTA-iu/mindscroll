# How to Transfer MindScroll to Another PC (From Start)

Complete guide for moving your MindScroll project to a different computer and setting it up from scratch.

---

## 📋 What You Need

### On Source PC (Current PC)
- Access to current MindScroll folder
- USB drive or cloud storage (Google Drive, Dropbox, OneDrive)
- Administrator access

### On Target PC (New PC)
- Node.js v14+ installed ([Download](https://nodejs.org/))
- MongoDB installed locally OR MongoDB Atlas account
- Git installed (optional but recommended)
- Hugging Face API key

---

## 📦 Step 1: Prepare Source Code for Transfer

### Option A: Using Git (Recommended - Smallest Size)

1. **On source PC**, initialize git repo (if not already done):
```bash
cd mindscroll
git init
git add .
git commit -m "Initial project setup"
```

2. **Push to GitHub/GitLab** (optional but safer):
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

3. **Or create a compressed backup:**
```bash
# Windows
tar -czf mindscroll-backup.tar.gz mindscroll/

# Mac/Linux
tar -czf mindscroll-backup.tar.gz mindscroll/
```

### Option B: Manual Copy (Comprehensive)

**Files/Folders to Copy:**
```
✓ mindscroll/backend/
  - routes/
  - models/
  - middleware/
  - utils/
  - server.js
  - package.json
  - .env.example (NOT .env!)

✓ mindscroll/frontend/
  - src/
  - public/
  - package.json

✓ Documentation Files:
  - README.md
  - QUICK_START.md
  - DEPLOYMENT.md
  - API_SETUP.md
  - PROJECT_THESIS.md
```

**Do NOT Copy:**
```
✗ node_modules/          (too large, will reinstall)
✗ .env                   (sensitive, create new on target PC)
✗ build/                 (frontend build, will regenerate)
✗ dist/                  (backend build artifacts)
✗ .git/                  (if using git, push instead)
```

### Compression Tip
Use 7-Zip or WinRAR to compress only essential folders:
- Backend: ~2-3 MB
- Frontend: ~1-2 MB
- Docs: ~0.5 MB
- **Total: ~5 MB** (vs. 500+ MB with node_modules)

---

## 🖥️ Step 2: Transfer Code to Target PC

### Option A: Using USB Drive

1. **Copy compressed file to USB**
```bash
# Windows
xcopy mindscroll-backup.tar.gz E:\ /Y

# Mac/Linux
cp mindscroll-backup.tar.gz /Volumes/USB/
```

2. **On target PC, extract:**
```bash
# Windows (using 7-Zip or built-in)
tar -xzf mindscroll-backup.tar.gz

# Mac/Linux
tar -xzf mindscroll-backup.tar.gz
```

### Option B: Using Cloud Storage

1. **Upload to Google Drive/Dropbox:**
   - Create folder "MindScroll-Backup"
   - Upload mindscroll-backup.tar.gz
   - Share link or download on target PC

2. **On target PC, download and extract**

### Option C: Using Git (Fastest if repo is private)

```bash
# On target PC
git clone <your-repo-url>
cd mindscroll
```

### Option D: Using External Hard Drive
- Copy entire `mindscroll/` folder
- Paste on target PC
- Delete node_modules before copying to save space

---

## ⚙️ Step 3: Setup Backend on Target PC

### 1. Navigate to Backend
```bash
cd mindscroll/backend
```

### 2. Install Dependencies
```bash
npm install
```
*Note: This downloads all modules - first time takes 5-10 minutes*

### 3. Create `.env` File

**On source PC, show current settings:**
```bash
cat .env
```

**On target PC, create NEW `.env`:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/mindscroll
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindscroll

# AI APIs
HUGGING_FACE_API_KEY=your_api_key_here
SIGHTENGINE_KEY=your_key_here

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**⚠️ IMPORTANT - DO NOT COPY `.env` FILE DIRECTLY**
- `.env` contains sensitive API keys
- Always create new on each PC
- Each PC may have different database/API configuration

---

## 🎨 Step 4: Setup Frontend on Target PC

### 1. Navigate to Frontend
```bash
cd ../frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Check Configuration (Optional)

If `.env` exists, verify:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🗄️ Step 5: Database Setup on Target PC

### Option A: Local MongoDB (If PC has MongoDB installed)

1. **Verify MongoDB is running:**
```bash
# Windows (Services)
tasklist | findstr mongod

# Mac/Linux
ps aux | grep mongod
```

2. **Start MongoDB if not running:**
```bash
# Windows
net start MongoDB

# Mac (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

3. **Connection string in `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/mindscroll
```

### Option B: MongoDB Atlas (Cloud Database - Recommended)

1. **Create free account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up or log in

2. **Get connection string:**
   - Project → Databases → Connect
   - Select "Connect your application"
   - Copy connection string

3. **Add to `.env`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindscroll
```

**⚠️ UPDATE USERNAME/PASSWORD IN STRING**

---

## ▶️ Step 6: Start Application on Target PC

### Terminal 1: Start Backend
```bash
cd backend
npm start
```

**Expected Output:**
```
Server running on port 5000
✓ MongoDB connected
✓ Ready for requests
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
http://localhost:3000
```

### 3. Open Application
Visit: **http://localhost:3000**

---

## ✅ Verification Checklist

After setup on target PC, verify everything:

- [ ] Backend starts without errors
- [ ] MongoDB shows "connected" message
- [ ] Frontend compiles successfully
- [ ] Can access http://localhost:3000
- [ ] No CORS errors in browser console (F12)
- [ ] No API connection errors
- [ ] Can list posts from /api/posts endpoint
- [ ] MongoDB has mindscroll database (see API_SETUP.md)

---

## 🔧 Common Transfer Issues

### Issue 1: Different Node Versions
**Problem:** `npm install` fails with version mismatch

**Solution:**
```bash
# Check Node version
node --version

# Should be v14 or higher
# If lower, update from nodejs.org
```

### Issue 2: Port Already in Use
**Problem:** Port 5000 or 3000 already in use

**Solution - Windows:**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

**Solution - Mac/Linux:**
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port
PORT=5001
```

### Issue 3: MongoDB Connection Fails
**Problem:** Cannot connect to MongoDB

**Check:**
1. Is MongoDB running? (see Step 5)
2. Is connection string correct in `.env`?
3. If using Atlas, is IP whitelisted?
4. Username/password correct?

### Issue 4: Hugging Face API Key Invalid
**Problem:** `Invalid Hugging Face API key`

**Solution:**
1. Get new key from https://huggingface.co/settings/tokens
2. Copy EXACTLY (no spaces)
3. Add to `.env` as `HUGGING_FACE_API_KEY=hf_xxxxx`

### Issue 5: node_modules Installation Fails
**Problem:** npm install gives permission or network error

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove old modules
rm -rf node_modules
rm package-lock.json

# Try install again
npm install
```

---

## 📊 Transfer Checklist

### Before Transferring
- [ ] Compress source code (exclude node_modules)
- [ ] Verify `.env` is NOT included
- [ ] Create `.env.example` if needed
- [ ] Test backend starts on source PC
- [ ] Note down your API keys locations

### After Transferring
- [ ] Extract files on target PC
- [ ] Install Node.js on target PC
- [ ] Install MongoDB or setup Atlas account
- [ ] `npm install` in both backend and frontend
- [ ] Create `.env` in backend with new values
- [ ] Start both servers
- [ ] Verify connection to http://localhost:3000

---

## 🚀 Network Access (Optional)

**To access from another computer on same WiFi:**

1. **Find your PC's IP address:**
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig`

2. **On other computer, visit:**
   ```
   http://<your-ip>:3000
   ```
   Example: `http://192.168.1.100:3000`

3. **Make sure:**
   - Both PCs on same WiFi network
   - Firewall allows ports 3000 and 5000
   - `.env` has `CORS_ORIGIN=http://<your-ip>:3000` (optional)

---

## 📝 Environment Variables to Update

When moving to new PC, these `.env` values may need updating:

| Variable | Why It Changes | Example Values |
|----------|---|---|
| `MONGODB_URI` | Different database setup | Local vs. Atlas |
| `PORT` | Port might be in use | 5000, 5001, 5002 |
| `CORS_ORIGIN` | Different PC IP | http://localhost:3000 or http://192.x.x.x:3000 |
| `NODE_ENV` | Should stay same | development or production |

**API Keys that shouldn't change:**
- `HUGGING_FACE_API_KEY` - Same key works everywhere
- `SIGHTENGINE_KEY` - Same key works everywhere

---

## 🔒 Security Notes

### DO:
✅ Keep `.env` file with API keys **private** - never upload to git  
✅ Use `.env.example` template for others (without secrets)  
✅ Create strong passwords for MongoDB  
✅ Use VPN if accessing from public WiFi  

### DO NOT:
❌ Commit `.env` to git  
❌ Share API keys in messages/emails  
❌ Expose keys in error logs  
❌ Leave credentials in code comments  

---

## 📞 Fast Transfer Steps (Summary)

```bash
# On Source PC:
cd mindscroll
npm install  # Ensure clean state

# Package for transfer (compressed):
tar -czf mindscroll-backup.tar.gz mindscroll/

# Transfer via USB/Cloud/Git

# On Target PC:
tar -xzf mindscroll-backup.tar.gz
cd mindscroll/backend
npm install

# Create .env with your settings
# (See API_SETUP.md for details)

# Start both servers in separate terminals:
npm start  # backend terminal
# and
cd ../frontend && npm start  # frontend terminal

# Open http://localhost:3000
```

---

## 📚 References

- [QUICK_START.md](QUICK_START.md) - Quick setup reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed setup guide
- [API_SETUP.md](API_SETUP.md) - API configuration details
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- [Node.js Download](https://nodejs.org/)

---

**Ready to move your project to another PC!** 🚀

Last Updated: March 17, 2026
