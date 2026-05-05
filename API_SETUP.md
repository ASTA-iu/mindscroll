# API Configuration & Setup Guide

Complete guide for setting up all required API keys and configurations for MindScroll.

---

## 🔑 Required API Keys

### 1. Hugging Face API Key (REQUIRED)

**Purpose:** Powers the core AI text/image/video analysis

**Get Your Key:**
1. Visit https://huggingface.co/join
2. Create a free account
3. Navigate to https://huggingface.co/settings/tokens
4. Click "New token" → Name it "MindScroll"
5. Select scope: **"Read"** (for inference)
6. Copy the generated token

**Add to `.env`:**
```env
HUGGING_FACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Free Tier Limits:**
- 1 request per second
- No training available
- For production, upgrade account

**Models Used:**
- `facebook/bart-large-mnli` - Text classification
- `google/vit-base-patch16-224` - Image analysis
- These are automatically accessed via the API

---

### 2. Sightengine API Key (OPTIONAL)

**Purpose:** Advanced NSFW/Violence detection for content moderation

**Get Your Key (Optional):**
1. Visit https://sightengine.com
2. Sign up for free account
3. Go to settings/API keys
4. Copy API key
5. Leave blank to skip (system uses fallback moderation)

**Add to `.env`:**
```env
SIGHTENGINE_KEY=your_api_key_here
```

**Free Tier Limits:**
- 1,000 requests/month
- Good for testing

---

## 🗄️ Database Configuration

### MongoDB - Two Options

#### Option A: Local MongoDB (Easiest for Development)

**Connection String:**
```env
MONGODB_URI=mongodb://localhost:27017/mindscroll
```

**Setup:**
- Windows: Download MSI from https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: `sudo apt-get install mongodb`

#### Option B: MongoDB Atlas (Recommended for Production)

**Connection String Format:**
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name
```

**Setup Steps:**

1. **Create Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up (free tier available)

2. **Create Cluster**
   - Click "Create" → Select **M0 (Free)** tier
   - Region: Choose closest to you
   - Create cluster (takes ~5 minutes)

3. **Whitelist IP Address**
   - Click "Network Access"
   - Add current IP or "0.0.0.0/0" (for development)
   - For production, use specific IPs

4. **Create Database User**
   - Click "Database Access"
   - Add New Database User
   - Remember username and strong password
   - Assign role: "Read and write to any database"

5. **Get Connection String**
   - Click "Databases" → "Connect"
   - Select "Connect your application"
   - Copy MongoDB driver connection string
   - Replace `<username>`, `<password>`, `<cluster>`

6. **Add to `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://myusername:mypassword@cluster0.abc123.mongodb.net/mindscroll
   ```

---

## ⚙️ Server Configuration

**File:** `backend/.env`

### Essential Settings

```env
# Database (required)
MONGODB_URI=mongodb://localhost:27017/mindscroll

# API Keys (required)
HUGGING_FACE_API_KEY=your_key_here

# Server (optional - defaults shown)
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Optional Settings

```env
# Moderation Services
SIGHTENGINE_KEY=optional_key_here

# JWT Configuration (for authentication)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# File Upload Size
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Timeouts (milliseconds)
API_TIMEOUT=30000
DB_TIMEOUT=30000
```

---

## 🚀 Testing API Configuration

### 1. Test Hugging Face Key
```bash
curl -X POST "https://api-inference.huggingface.co/models/facebook/bart-large-mnli" \
  -H "Authorization: Bearer YOUR_HF_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"inputs\":\"This is an educational post about physics\"}"
```

Expected response: Classification scores

### 2. Test MongoDB Connection
```bash
# In backend folder
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.log('✗ Error:', err.message));
"
```

### 3. Test Backend Health
```bash
npm start
# Then in another terminal:
curl http://localhost:5000/api/health
```

Expected response: `{"status":"Server is running"}`

---

## 🔐 Security Notes

### Local Development
- It's safe to keep API keys in `.env`
- Never commit `.env` to git (add to `.gitignore`)

### Production Deployment
- Use environment variable management services
- **Heroku:** Set config variables in dashboard
- **AWS:** Use AWS Secrets Manager
- **DigitalOcean:** Use App Platform environment variables
- Rotate API keys regularly
- Never expose keys in logs

### Securing Your `.env`
```bash
# Ensure .env is not tracked
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Create template for others
cp .env .env.example
# Remove sensitive values from .env.example
# Commit .env.example to git
```

---

## 🛠️ Troubleshooting

### Hugging Face API Error
**Error:** `401 Unauthorized` or `Invalid token`

**Solution:**
- Verify token copied correctly
- Check no extra spaces/characters
- Token should start with `hf_`
- Regenerate token if needed

### MongoDB Connection Error
**Error:** `MongooseError: Cannot connect to MongoDB`

**Solution (Local):**
- Verify MongoDB is running
- Windows: Check Services → MongoDB Server
- Mac/Linux: Check in terminal `ps aux | grep mongod`
- Try restarting MongoDB service

**Solution (Atlas):**
- Verify IP is whitelisted
- Check username and password are correct
- Ensure cluster is running (not paused)
- Use proper connection string format

### CORS Error
**Error:** `CORS policy: Cross-Origin Request Blocked`

**Solution:**
- Verify `CORS_ORIGIN` in `.env` matches frontend URL
- For local dev: Should be `http://localhost:3000`
- For production: Change to your domain

### Rate Limiting
**Error:** `Rate limit exceeded` from Hugging Face

**Solution:**
- Free tier: 1 req/sec limit
- Upgrade account for more requests
- Implement request queuing in code
- Cache results when possible

---

## 📚 API Reference

### Text Analysis Endpoint
```
POST /api/posts/create
Content-Type: application/json

{
  "content": "Educational text about science",
  "image": "base64_image_or_null",
  "video": "base64_video_or_null"
}
```

### Expected Response
```json
{
  "success": true,
  "post": {
    "_id": "xxx",
    "educationalScore": 87,
    "isEducational": true,
    "analysis": {
      "textScore": 0.89,
      "imageScore": 0.85,
      "videoScore": null
    }
  }
}
```

---

## 📋 Quick Configuration Checklist

- [ ] Create Hugging Face account
- [ ] Generate API token
- [ ] Set MongoDB connection string
- [ ] Create backend `.env` file
- [ ] Add API keys to `.env`
- [ ] Test connection with `npm start`
- [ ] Verify health check endpoint
- [ ] Test with sample post

---

**Last Updated:** March 2026
