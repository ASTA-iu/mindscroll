
# MindScroll - Educational Social Media Platform

MindScroll is an AI-powered social media platform that automatically filters content to ensure only educational material is shared. Posts (text, images, videos) are analyzed using machine learning to score educational value and block entertainment, memes, and non-educational content.

---

## 🎯 Key Features

### Core Features
✅ User registration & JWT authentication  
✅ Social feed with comments, likes, follows  
✅ Create posts with text, images, or videos  
✅ User profiles with bio and follow system  

### AI Moderation
✅ **Automatic educational scoring** (0-100%)  
✅ **Multi-modal analysis** (text + image + video)  
✅ **Real-time rejection feedback** with detailed analysis  
✅ **Context-aware content filtering** (blocks memes & entertainment)  
✅ **NSFW & violence detection**  
✅ **Semantic tag generation** (10+ topic categories)  

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, React Router v6, Axios, CSS3 |
| **Backend** | Node.js, Express.js 4.18, MongoDB, JWT |
| **AI/ML** | Hugging Face (BART, ViT), Tesseract.js (OCR), FFmpeg |
| **Moderation** | Custom keyword scoring + HF models |

---

## 🧹 Recently Cleaned Up

Removed 25+ test files, redundant documentation, and temporary folders to keep the repository clean and focused.  
**New:** Clean project structure with comprehensive documentation.  
📋 See [CLEANUP.md](CLEANUP.md) for detailed cleanup summary

---

## 📖 Documentation

**Start here based on your needs:**

| Document | Purpose |
|----------|---------|
| [**QUICK_START.md**](QUICK_START.md) | ⚡ Get running in 5 minutes (recommended first) |
| [**DEPLOYMENT.md**](DEPLOYMENT.md) | 📦 Full setup for any computer with troubleshooting |
| [**TRANSFER_GUIDE.md**](TRANSFER_GUIDE.md) | 🖥️ How to transfer code to a different PC |
| [**API_SETUP.md**](API_SETUP.md) | 🔑 Configure API keys & databases |
| [**PROJECT_THESIS.md**](PROJECT_THESIS.md) | 📚 Complete technical documentation |

---

## 🚀 Quick Start

**Get MindScroll running in 5 minutes:**

```bash
# 1. Clone project
git clone <your-repo-url>
cd mindscroll

# 2. Setup backend
cd backend
npm install
# Create .env with your API keys (see API_SETUP.md)

# 3. Setup frontend
cd ../frontend
npm install

# 4. Start services (use 2 terminals)
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm start

# 5. Open http://localhost:3000
```

**Need more details?** → [See QUICK_START.md](QUICK_START.md)
```
MONGODB_URI=mongodb://localhost:27017/mindscroll
AI_API_KEY=your_huggingface_api_key_here
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Start Services
**Terminal 1:**
```bash
cd backend
npm start
```
**Terminal 2:**
```bash
cd frontend
npm start
```

### 6. Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🌐 Running on a Different Computer
1. Clone the repo and repeat steps above
2. Make sure to set up `.env` in both backend and frontend (copy your Hugging Face API key)
3. If using MongoDB Atlas, update `MONGODB_URI` accordingly
4. Open ports 3000 (frontend) and 5000 (backend) if accessing remotely

---

## 🧠 AI Moderation Details
- Uses Hugging Face BART for text, ViT for images, and frame extraction for videos
- Blocks posts with non-educational content or <1% educational value
- See `/docs/AI_MODERATION.md` and `/docs/AI_FILTERING.md` for full details

---

## 📄 Documentation
- `README.md` (this file)
- `SETUP.md` (detailed setup)
- `QUICKSTART.md` (reference guide)
- `FEATURES.md` (feature roadmap)
- `docs/AI_MODERATION.md` (AI moderation logic)
- `docs/AI_FILTERING.md` (AI filtering details)

---

## 🆘 Troubleshooting
- If moderation fails, check your Hugging Face API key and backend logs
- For code linting, add ESLint config or use Prettier for formatting

---

**Maintained by your development team.**

```bash
cd ../frontend
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. MongoDB Setup

**Local MongoDB:**
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Cloud MongoDB (MongoDB Atlas):**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string and add to `.env`

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Server will run on `http://localhost:5000`

### Start Frontend Development Server

In another terminal:

```bash
cd frontend
npm start
```

Frontend will open at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get feed (paginated)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/posts/user/:userId` - Get user's posts

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments/post/:postId` - Get post comments
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/follow` - Follow user
- `POST /api/users/:id/unfollow` - Unfollow user

## 🤖 AI Content Filtering System

The AI filtering system uses Hugging Face's BART model for zero-shot text classification and ViT for image classification.

### How It Works

1. **Text Analysis**: Classifies content into categories (educational, entertainment, opinion, etc.)
2. **Image Analysis**: Detects educational indicators in images
3. **Score Calculation**: Combines text and image analysis for overall educational score
4. **Decision Making**:
   - Score ≥ 75: APPROVE (Auto-publish)
   - Score 50-75: APPROVE_WITH_REVIEW (Publish with warning)
   - Score 30-50: FLAG_FOR_REVIEW (Manual review needed)
   - Score < 30: REMOVE (Rejected)

### Configuration

Scores and thresholds can be adjusted in `backend/utils/aiFilter.js`

## 📝 Creating a Post

1. Login to your account
2. In the feed, use the "Create Post" card
3. Enter your educational content (text and/or image)
4. Add tags to categorize your content
5. Click "Post"
6. Wait for AI analysis (usually 2-5 seconds)
7. If approved, your post appears in the feed

## 🎨 Frontend Architecture

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── CreatePost.js
│   │   ├── PostCard.js
│   │   ├── CommentSection.js
│   │   └── PrivateRoute.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── Feed.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── Auth.css
│   │   ├── Navbar.css
│   │   ├── Feed.css
│   │   ├── CreatePost.css
│   │   ├── PostCard.css
│   │   ├── CommentSection.css
│   │   └── App.css
│   ├── App.js
│   └── index.js
└── package.json
```

## 🔧 Backend Architecture

```
backend/
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── routes/
│   ├── auth.js
│   ├── posts.js
│   ├── comments.js
│   └── users.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── utils/
│   └── aiFilter.js
├── server.js
├── package.json
└── .env
```

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- SQL/NoSQL injection prevention
- XSS protection

## 💾 Database Schema

### Users
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  bio: String,
  profileImage: String,
  followers: [ObjectId],
  following: [ObjectId],
  createdAt: Date
}
```

### Posts
```javascript
{
  author: ObjectId,
  content: String,
  image: String,
  imageUrl: String,
  educationalScore: Number (0-100),
  isEducational: Boolean,
  aiAnalysisResult: String (JSON),
  likes: [ObjectId],
  likeCount: Number,
  commentCount: Number,
  tags: [String],
  flagged: Boolean,
  createdAt: Date
}
```

### Comments
```javascript
{
  post: ObjectId,
  author: ObjectId,
  content: String,
  likes: [ObjectId],
  likeCount: Number,
  createdAt: Date
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network access if using Atlas

### API Not Responding
- Ensure backend is running on port 5000
- Check CORS_ORIGIN matches frontend URL
- Verify JWT_SECRET is set

### AI Analysis Not Working
- Verify Hugging Face API key is valid
- Check API rate limits
- Ensure internet connection

### Frontend Not Connecting to Backend
- Verify REACT_APP_API_URL is correct
- Check that backend is running
- Clear browser cache and reload

## 📖 Development Notes

### Adding New Features

1. **New API Endpoint**: Create route in backend, add to frontend API service
2. **New Page**: Create component in frontend, add route to App.js
3. **Database Changes**: Update model, create migration if needed

### Testing

For production, consider adding:
- Jest for unit testing
- React Testing Library for component testing
- Supertest for API testing

## 🚀 Deployment

### Deploy Backend (Heroku example)
```bash
cd backend
heroku create mindscroll-api
git push heroku main
```

### Deploy Frontend (Netlify example)
```bash
cd frontend
npm run build
# Deploy build/ folder to Netlify
```

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues and questions, open a GitHub issue or contact the development team.

---

**Start sharing educational content today!** 📚✨
