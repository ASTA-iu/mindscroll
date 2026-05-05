#!/bin/bash

# MindScroll Quick Start for Mac/Linux

echo ""
echo "========================================"
echo "MindScroll - Educational Social Media"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found:"
node --version

# Backend Setup
echo ""
echo "[1] Setting up BACKEND..."
cd backend

echo "Installing dependencies..."
npm install

if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file (REMEMBER TO EDIT IT!)"
    cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/mindscroll
JWT_SECRET=mindscroll_secret_key_2024
AI_API_KEY=hf_YOUR_HUGGINGFACE_TOKEN_HERE
PORT=5000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
EOF
    echo "⚠️  IMPORTANT: Edit .env with your Hugging Face API key!"
fi

cd ..

# Frontend Setup
echo ""
echo "[2] Setting up FRONTEND..."
cd frontend

echo "Installing dependencies..."
npm install

if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF
    echo "✓ Frontend .env created"
fi

cd ..

echo ""
echo "========================================"
echo "SETUP COMPLETE!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Start MongoDB:"
echo "  mongod"
echo ""
echo "Terminal 2 - Start Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Start Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then visit http://localhost:3000"
echo ""
