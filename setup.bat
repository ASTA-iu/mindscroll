@echo off
REM MindScroll Quick Start for Windows

ECHO.
ECHO ========================================
ECHO MindScroll - Educational Social Media
ECHO ========================================
ECHO.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    ECHO ERROR: Node.js is not installed!
    ECHO Please install Node.js from https://nodejs.org/
    PAUSE
    EXIT /B 1
)

ECHO ✓ Node.js found: 
node --version

REM Backend Setup
ECHO.
ECHO [1] Setting up BACKEND...
cd backend

ECHO Installing dependencies...
call npm install

IF NOT EXIST .env (
    ECHO.
    ECHO Creating .env file (REMEMBER TO EDIT IT!)
    (
        ECHO MONGODB_URI=mongodb://localhost:27017/mindscroll
        ECHO JWT_SECRET=mindscroll_secret_key_2024
        ECHO AI_API_KEY=hf_YOUR_HUGGINGFACE_TOKEN_HERE
        ECHO PORT=5000
        ECHO CORS_ORIGIN=http://localhost:3000
        ECHO NODE_ENV=development
    ) > .env
    ECHO ⚠️  IMPORTANT: Edit .env with your Hugging Face API key!
)

cd ..

REM Frontend Setup
ECHO.
ECHO [2] Setting up FRONTEND...
cd frontend

ECHO Installing dependencies...
call npm install

IF NOT EXIST .env (
    ECHO.
    ECHO Creating .env file...
    (
        ECHO REACT_APP_API_URL=http://localhost:5000/api
    ) > .env
    ECHO ✓ Frontend .env created
)

cd ..

ECHO.
ECHO ========================================
ECHO SETUP COMPLETE!
ECHO ========================================
ECHO.
ECHO To start the application:
ECHO.
ECHO Terminal 1 - Start MongoDB:
ECHO   mongod
ECHO.
ECHO Terminal 2 - Start Backend:
ECHO   cd backend
ECHO   npm run dev
ECHO.
ECHO Terminal 3 - Start Frontend:
ECHO   cd frontend
ECHO   npm start
ECHO.
ECHO Then visit http://localhost:3000
ECHO.
PAUSE
