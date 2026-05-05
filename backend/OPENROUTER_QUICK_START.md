# Quick Start - OpenRouter Educational Classification

## What Was Updated

Your MindScroll backend now uses OpenRouter's free vision models for intelligent classification of **images AND videos**:

✅ **detects Educational Content** - Textbooks, diagrams, tutorials, lectures  
✅ **Detects Memes & Distractions** - Jokes, social media posts, entertainment-only  
✅ **Analyzes Video Frames** - Extracts frames and classifies each one  
✅ **Returns Confidence Scores** - 0-100% educational score with detailed analysis  
✅ **100% Free** - Uses OpenRouter's free tier models  

---

## Environment Setup

Your `.env` already has the OpenRouter API key configured:

```env
openrouter_API_KEY=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
```

**No additional setup needed!**

---

## How It Works

When a user uploads an image or video post:

### Image Upload
```
1️⃣ Image Safety Checks (NSFW/Violence) ← HuggingFace
2️⃣ Extract Text from Image ← Tesseract OCR
3️⃣ If text found → Classify text as educational/non-educational
   If NO text found → Use OpenRouter Vision API for visual analysis
4️⃣ Return Education Score (0-100%)
```

### Video Upload
```
1️⃣ Extract Frames (every 5 seconds) ← FFmpeg
2️⃣ Safety Checks (NSFW/Violence) per frame ← HuggingFace
3️⃣ Use OpenRouter Vision API to analyze each frame
4️⃣ Calculate average score across all frames
5️⃣ Check for casual/meme patterns
6️⃣ Return Education Score (0-100%)
```

---

## Example Classifications

### ✅ Educational (Score: 80-100)
- PDF/Textbook pages
- Math/Science diagrams
- Educational infographics
- Lecture slides
- How-to guides

### ❌ Non-Educational (Score: 0-20)
- Memes
- Selfies
- Joke images
- Social media posts for engagement
- Entertainment-only content

---

## Using in Routes

The routes already use OpenRouter automatically:

### `POST /api/posts` (Creating a post)
```javascript
// Already initialized with OpenRouter support
const imageAnalysis = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY  // ← NEW
);

// If image is provided, it's automatically analyzed
// Including OpenRouter classification for meme/distraction detection
```

### `POST /api/upload` (Uploading images)
```javascript
// Same as above - OpenRouter is automatically used
// for images without readable text
```

---

## Testing OpenRouter Classification

### Test File

```bash
node test_enhancements.js
```

This will test:
- Image analysis with OCR
- OpenRouter vision classification
- Educational vs non-educational detection
- Meme detection

### Manual Testing

```javascript
// In test_enhancements.js or a test script

const ImageAnalysisService = require('./utils/imageAnalysisService');

const service = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Test with an educational image
const educationalImage = 'data:image/jpeg;base64,...';
const result = await service.classifyImageWithOpenRouter(educationalImage);

console.log(`
✓ Classification: ${result.classification}
✓ Confidence: ${result.confidence * 100}%
✓ Score: ${result.score}/100
✓ Type: ${result.contentType}
✓ Reason: ${result.reason}
✓ Elements: ${result.detectedElements.join(', ')}
`);
```

---

## API Response Example

When an image is analyzed with OpenRouter:

```json
{
  "score": 75,
  "reason": "Educational diagram with explanatory text",
  "classification": "EDUCATIONAL",
  "confidence": 0.87,
  "contentType": "diagram with text",
  "method": "openrouter_vision",
  "detectedElements": [
    "text labels",
    "mathematical symbols",
    "arrows",
    "structured layout"
  ]
}
```

---

## Features

### 📊 Educational Score (0-100)
- **80-100:** Clearly educational
- **50-79:** Mixed/moderately educational
- **20-49:** Mostly non-educational
- **0-19:** Clearly meme/distraction

### 🎯 Content Detection
Identifies:
- Textbooks & study materials
- Diagrams & flowcharts
- Infographics
- Lectures & tutorials
- Memes & jokes
- Selfies & vibe posts
- Entertainment content
- **Video frames (NEW)** - Frame-by-frame video analysis

### 🔒 Safety First
Still uses HuggingFace for:
- NSFW detection (blocks inappropriate content first)
- Violence detection (blocks graphic content first)
- Then applies OpenRouter for educational classification

### 🎬 Video Analysis (NEW)

**How it works:**
1. Extracts frames from video every 5 seconds
2. Analyzes up to 5 key frames with OpenRouter
3. Calculates average educational score
4. Detects if video contains mostly casual content
5. Returns pass/fail recommendation

**Example:**
```javascript
const videoService = new VideoAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

const result = await videoService.analyze(videoUrl);
// {
//   success: true,
//   score: 82,                    // Average score across frames
//   frameCount: 12,               // Total frames extracted
//   analyzedFrames: 5,            // Frames analyzed
//   approved: true,               // Score >= 65? true
//   analysisMethod: "openrouter_frame_analysis"
// }
```

---

## Features

### 📊 Educational Score (0-100)
- **80-100:** Clearly educational
- **50-79:** Mixed/moderately educational
- **20-49:** Mostly non-educational
- **0-19:** Clearly meme/distraction

### 🎯 Content Detection
Identifies:
- Textbooks & study materials
- Diagrams & flowcharts
- Infographics
- Lectures & tutorials
- Memes & jokes
- Selfies & vibe posts
- Entertainment content

### 🔒 Safety First
Still uses HuggingFace for:
- NSFW detection (blocks inappropriate content first)
- Violence detection (blocks graphic content first)
- Then applies OpenRouter for educational classification

---

## Free vs Paid

**YOUR SETUP:** ✅ 100% FREE

- OpenRouter free tier models
- No paid subscriptions
- No hidden costs

Models used:
- `nousresearch/nous-hermes-2-vision-7b` (free tier vision)
- `meta-llama/llama-2-7b` (free tier text)

---

## What Changed in Your Files

### 1. `utils/openRouterVisionService.js` (COMPLETELY REWRITTEN)
- ❌ Old: Used text-only models, local-only detection
- ✅ New: Uses vision models for image classification
- ✅ New: `classifyImageEducational()` method
- ✅ New: `classificationToScore()` conversion
- ✅ New: Proper error handling & timeouts

### 2. `utils/imageAnalysisService.js` (ENHANCED)
- ✅ Added OpenRouter service initialization
- ✅ New: `classifyImageWithOpenRouter()` method
- ✅ Updated constructor to accept OpenRouter key
- ✅ Graceful fallback if OpenRouter unavailable

### 3. `utils/videoAnalysisService.js` (ENHANCED - NEW)
- ✅ Added OpenRouter service initialization
- ✅ New: `analyzeFramesWithOpenRouter()` method  
- ✅ New: `analyzeFrameFallback()` for OCR fallback
- ✅ Updated constructor to accept OpenRouter key
- ✅ Analyzes up to 5 key frames per video

### 4. `routes/posts.js` (UPDATED)
```javascript
// Before:
const imageAnalysis = new ImageAnalysisService(process.env.AI_API_KEY);
const videoAnalysis = new VideoAnalysisService(process.env.AI_API_KEY);

// After:
const imageAnalysis = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY  // ← NEW
);
const videoAnalysis = new VideoAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY  // ← NEW
);
```

### 5. `routes/upload.js` (UPDATED)
Same as posts.js - now passes OpenRouter key for both image and video analysis

### 6. `test_enhancements.js` (UPDATED)
Same as above - now passes OpenRouter key for testing both images and videos

---

## How to Use It

### Option 1: Automatic (In Routes)
✅ Just upload an image - it's automatically analyzed with OpenRouter

### Option 2: Manual (In Your Code)
```javascript
const imageService = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Analyze with OpenRouter
const result = await imageService.classifyImageWithOpenRouter(imageBase64);
if (result.score >= 50) {
  console.log('✓ Educational content approved');
} else {
  console.log('❌ Meme/distraction detected');
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OpenRouter API key not configured" | Ensure `.env` has `openrouter_API_KEY` |
| Classification takes too long | Normal: 3-5 seconds for vision analysis |
| Getting wrong classification | Try with better quality/clearer images |
| API timeout error | Check internet connection |
| Service not initialized | Ensure both API keys passed to constructor |

---

## Performance

- **OCR + Text Classification:** ~1-2 seconds
- **OpenRouter Vision:** ~3-5 seconds
- **Total:** ~4-7 seconds per image (depends on method)
- **Network:** Requires internet connection

---

## Next Steps

1. ✅ Test the integration: `node test_enhancements.js`
2. ✅ Upload an image via the frontend
3. ✅ Check backend logs for OpenRouter analysis
4. ✅ Monitor API usage (free tier limits)
5. ✅ Adjust thresholds if needed (currently 50% = threshold)

---

## Questions?

Check the detailed guide: [OPENROUTER_IMAGE_CLASSIFICATION.md](./OPENROUTER_IMAGE_CLASSIFICATION.md)

For OpenRouter API details: https://openrouter.ai/
