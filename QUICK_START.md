# MindScroll - Quick Start (5 Minutes)

**Start MindScroll in 5 minutes with these simple steps.**

---

## 📋 What You Need

- Node.js v14+ ([Download](https://nodejs.org/))
- MongoDB local or [Atlas cloud](https://www.mongodb.com/cloud/atlas)
- HuggingFace API Key ([Get free key](https://huggingface.co/settings/tokens))

---

## 🚀 Installation

### 1️⃣ Download/Clone Project
```bash
git clone <repo-url>
cd mindscroll
```

### 2️⃣ Backend Initialization (2 min)
```bash
cd backend
npm install
```

Create `.env` file in `backend` folder:
```env
MONGODB_URI=mongodb://localhost:27017/mindscroll
HUGGING_FACE_API_KEY=your_key_here
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 3️⃣ Frontend Initialization (2 min)
```bash
cd ../frontend
npm install
```

---

## ▶️ Run Application

**Open 2 terminal windows:**

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Expect: `Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Expect: `http://localhost:3000`

---

## ✅ Verify It Works

1. Open browser → http://localhost:3000
2. Register new account
3. Create a post with text + image
4. AI analyzes and shows educational score

---

## 🌍 On a Different Computer?

Follow same steps above. Just update `.env` if using MongoDB Atlas:
```env
# Copy from MongoDB Atlas → Connect → Connection String
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindscroll
```

---

## ❌ Stuck?

- **Port already in use?** Change PORT in `.env`
- **MongoDB connection failed?** Check `.env` and ensure MongoDB is running
- **API key invalid?** Get new token from https://huggingface.co/settings/tokens

**For detailed setup:** See [DEPLOYMENT.md](DEPLOYMENT.md)
