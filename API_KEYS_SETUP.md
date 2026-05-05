# 🔑 API Keys & Environment Configuration
## MindScroll AI Moderation System

**Status:** Ready for Setup on New PC  
**Last Updated:** March 19, 2026

---

## 📋 Step-by-Step API Key Setup

### Option 1: Use Existing Working Keys (Fastest)

If you want to get running immediately, here are tested API keys you can use:

```env
# .env file location: mindscroll/backend/.env

# Database
MONGODB_URI=mongodb://localhost:27017/mindscroll
JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a

# Tested Working Keys (Can use immediately)
AI_API_KEY=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
openrouter_API_KEY=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
SIGHTENGINE_USER=311012903
SIGHTENGINE_SECRET=9RziUQJq43iiWffwXXbqCpphSiZAsdZH

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

✅ **Pros:** Instant setup, already tested  
⚠️ **Cons:** Shared keys, rate limited, should replace with your own for production

---

### Option 2: Get Your Own API Keys (Recommended for Production)

#### 1. HuggingFace API Key (Text Analysis)

**Steps:**
1. Visit: https://huggingface.co/settings/tokens
2. Sign up (free) if you don't have an account
3. Click "New token" button
4. Fill in:
   - **Name:** MindScroll
   - **Type:** Read
5. Click "Generate token"
6. Copy the token (starts with `hf_`)
7. Add to `.env`:
   ```env
   AI_API_KEY=hf_your_token_here
   ```

**Verify it works:**
```bash
curl -X POST "https://api-inference.huggingface.co/models/facebook/bart-large-mnli" \
  -H "Authorization: Bearer hf_your_token_here" \
  -H "Content-Type: application/json" \
  -d "{\"inputs\": \"This is a test\"}"
```

**Rate Limits:** Free tier - reasonable limits  
**Cost:** Free tier available ✅

---

#### 2. OpenRouter API Key (Vision/Image Analysis)

**Steps:**
1. Visit: https://openrouter.ai/
2. Sign up (free tier available)
3. Go to: https://openrouter.ai/keys
4. Click "Create Key"
5. Name it: "MindScroll"
6. Copy the API key (starts with `sk-or-v1-`)
7. Add to `.env`:
   ```env
   openrouter_API_KEY=sk-or-v1-your_key_here
   ```

**Verify it works:**
```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer sk-or-v1-your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}]}'
```

**Rate Limits:** Free tier - 100 requests/day  
**Cost:** Free tier available ✅

---

#### 3. SightEngine API (Image Moderation)

**Steps:**
1. Visit: https://www.sightengine.com/
2. Sign up (free tier)
3. Verify email
4. Go to: Dashboard → "API Credentials" or "Settings"
5. Copy:
   - **User ID** (numeric, e.g., `311012903`)
   - **API Secret** (alphanumeric)
6. Add to `.env`:
   ```env
   SIGHTENGINE_USER=your_user_id
   SIGHTENGINE_SECRET=your_api_secret
   ```

**Verify it works:**
```bash
curl "https://api.sightengine.com/1.0/check.json" \
  -F "media=https://example.com/image.jpg" \
  -F "models=nudity" \
  -F "api_user=your_user_id" \
  -F "api_secret=your_api_secret"
```

**Rate Limits:** Free tier - up to 500 checks/month  
**Cost:** Free tier available ✅

---

## 📝 Complete .env Template

**File Path:** `mindscroll/backend/.env`

```env
# ═══════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════
MONGODB_URI=mongodb://localhost:27017/mindscroll

# ═══════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════
# Generate new one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a

# ═══════════════════════════════════════════════════════
# AI & MODERATION SERVICES
# ═══════════════════════════════════════════════════════

# HuggingFace API Key (Text Analysis)
# Get from: https://huggingface.co/settings/tokens
# Format: hf_xxxxx...
AI_API_KEY=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

# OpenRouter API Key (Vision/Image Analysis)
# Get from: https://openrouter.ai/keys
# Format: sk-or-v1-xxxxx...
openrouter_API_KEY=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

# SightEngine User ID (Numeric) - for NSFW detection
# Get from: https://www.sightengine.com/dashboard
SIGHTENGINE_USER=311012903

# SightEngine API Secret (Alphanumeric) - for NSFW detection
# Get from: https://www.sightengine.com/dashboard
SIGHTENGINE_SECRET=9RziUQJq43iiWffwXXbqCpphSiZAsdZH

# ═══════════════════════════════════════════════════════
# SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════

# Server port (change if 5000 is in use)
PORT=5000

# Environment (development or production)
NODE_ENV=development

# Frontend URL for CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🔐 Security Notes

### Before Production Deployment

1. **Generate new JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Replace the value in `.env`

2. **Create your own API keys** - Never use shared keys in production

3. **Never commit `.env` file:**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

4. **Use environment variables on hosting platforms:**
   - AWS/Azure/Heroku have built-in secret management
   - Never paste keys in code repositories

5. **Rotate keys periodically** (quarterly recommended)

---

## ✅ Verification Checklist

After adding keys to `.env`, verify each one works:

### 1. Check File Exists
```bash
ls mindscroll/backend/.env
# Should show: .env
```

### 2. Check File Content (NO ERRORS)
```bash
cat mindscroll/backend/.env
# Should show all 8 variables filled in
```

### 3. Start Backend and Check Logs
```bash
cd mindscroll/backend
node server.js
```

**Look for these messages (means API keys are working):**
```
✓ Server listening on port 5000
✓ MongoDB connected successfully
✓ HuggingFace API key validated
✓ OpenRouter API key validated
✓ SightEngine API credentials validated
✓ All moderation services initialized
```

### 4. Test Each API Key Individually

**Test HuggingFace:**
```bash
curl -X POST "https://api-inference.huggingface.co/models/facebook/bart-large-mnli" \
  -H "Authorization: Bearer hf_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"inputs":"This is educational content"}'
```
✅ Should return classification scores

**Test OpenRouter:**
```bash
curl "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer sk-or-v1-YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}]}'
```
✅ Should return chat response

**Test SightEngine:**
```bash
curl "https://api.sightengine.com/1.0/check.json" \
  -F "media=https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg" \
  -F "models=nudity" \
  -F "api_user=YOUR_USER_ID" \
  -F "api_secret=YOUR_SECRET"
```
✅ Should return moderation results

---

## 🐛 Troubleshooting API Keys

### Error: "Invalid API Key"

**Solution:**
1. Double-check the key is copied completely
2. No extra spaces before/after
3. API key hasn't expired (check provider account)
4. Restart backend after fixing

### Error: "Rate limit exceeded"

**Solution:**
1. If using free tier, you've hit the limit
2. Upgrade to paid tier or wait for limit reset
3. Use a different API key

### Backend says "API validation failed"

**Solution:**
1. Remove the key and restart - backend will show which API is invalid
2. Re-check the key on provider's website
3. Generate a new key

### NSFW Detection not working

**Solution:**
1. Check `SIGHTENGINE_USER` is numeric
2. Check `SIGHTENGINE_SECRET` is alphanumeric
3. Verify no extra spaces in `.env`
4. Test key directly at: https://www.sightengine.com/docs

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Cost When Exceeded |
|---------|-----------|-------------------|
| HuggingFace | Unlimited (rate limited) | $9/month |
| OpenRouter | 100 requests/day | $0.0001/request |
| SightEngine | 500 checks/month | $0.001/check |
| MongoDB | 512MB storage | $0.50 GB/month |
| **Total** | **FREE** | ~$50/month at scale |

✅ All services have free tiers suitable for testing!

---

## 🚀 Setup Command Sequence

Complete setup in order:

```bash
# 1. Create backend environment file
cd mindscroll/backend

# 2. Create .env file with all keys
# On Windows (PowerShell):
@"
MONGODB_URI=mongodb://localhost:27017/mindscroll
JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a
AI_API_KEY=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
openrouter_API_KEY=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
SIGHTENGINE_USER=311012903
SIGHTENGINE_SECRET=9RziUQJq43iiWffwXXbqCpphSiZAsdZH
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
"@ | Out-File -Encoding utf8 .env

# On macOS/Linux:
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/mindscroll
JWT_SECRET=9136db1e269a6140e72c627fe32cc7b49473a6a876bef2ad4016d2860e4bc4b6d0e30f567491095080265683d5b374fd1b5d37a8bf1a6712920afd04ab681f2a
AI_API_KEY=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
openrouter_API_KEY=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
SIGHTENGINE_USER=311012903
SIGHTENGINE_SECRET=9RziUQJq43iiWffwXXbqCpphSiZAsdZH
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
EOF

# 3. Start backend
node server.js

# 4. Check logs for "All moderation services initialized"
# ✓ If successful, continue

# 5. In new terminal, install and start frontend
cd mindscroll/frontend
npm install
npm start

# 6. Open browser
# http://localhost:3000
```

---

## 📧 Support

If API keys aren't working:

1. **Check provider status pages:**
   - HuggingFace: https://huggingface.co/status
   - OpenRouter: https://status.openrouter.ai/
   - SightEngine: https://www.sightengine.com/status

2. **Look at backend console logs** - they show specific errors

3. **Verify `.env` file** - common issue is extra spaces or missing values

4. **Try the provided test keys first** - if those work, your setup is correct

---

**Ready to set up? Follow COMPLETE_SETUP_GUIDE.md for full instructions!** 🚀
