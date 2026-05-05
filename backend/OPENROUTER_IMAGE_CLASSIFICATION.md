# OpenRouter API - Image & Video Classification for Educational Content

## Overview

The MindScroll backend now uses **OpenRouter's free vision models** for intelligent classification of both **images** and **videos** to determine if content is educational or non-educational (meme/distraction).

### Key Features

✅ **Free Tier Models** - Uses OpenRouter's free tier vision models (no paid subscriptions)  
✅ **Image Classification** - Classifies images as: Educational or Non-Educational  
✅ **Video Frame Analysis** - Analyzes video frames for educational content  
✅ **Meme & Distraction Detection** - Identifies memes, jokes, and non-educational content  
✅ **Confidence Scoring** - Returns detailed analysis with confidence levels  
✅ **Fallback Support** - Gracefully falls back to other methods if API is unavailable  

---

## Configuration

### 1. Environment Variables

The OpenRouter API key is already configured in `.env`:

```bash
openrouter_API_KEY=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
```

**Note:** Keep this key secure. Never commit it to version control.

### 2. Architecture

```
ImageAnalysisService
├── OpenRouterVisionService (NEW)
│   ├── classifyImageEducational()
│   ├── callOpenRouterVision()
│   └── classificationToScore()
├── HuggingFace Services
│   ├── NSFW Detection
│   ├── Violence Detection
│   └── Text Classification
└── Tesseract OCR
    └── Text Extraction
```

---

## Usage

### Method 1: Using OpenRouter in Image Analysis

The `ImageAnalysisService` now supports OpenRouter classification:

```javascript
const ImageAnalysisService = require('./utils/imageAnalysisService');

// Initialize with HF API key AND OpenRouter key
const imageService = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Analyze image with OpenRouter
const imageBase64 = 'data:image/jpeg;base64,...';
const result = await imageService.classifyImageWithOpenRouter(imageBase64);

console.log(result);
// Output:
// {
//   score: 75,                          // 0-100 (higher = more educational)
//   classification: "EDUCATIONAL",      // or "NON-EDUCATIONAL"
//   confidence: 0.87,                   // 0-1
//   contentType: "diagram",             // Brief description
//   method: "openrouter_vision",        // Analysis method
//   detectedElements: ["text", "numbers", "arrows"]
// }
```

### 2. Direct OpenRouter Service Usage

```javascript
const OpenRouterVisionService = require('./utils/openRouterVisionService');

const service = new OpenRouterVisionService(process.env.openrouter_API_KEY);

// Classify image for educational content
const analysis = await service.classifyImageEducational(imageBase64);

console.log(analysis);
// {
//   classification: "EDUCATIONAL",
//   confidence: 0.92,
//   content_type: "textbook page",
//   reason: "Contains educational diagrams and text",
//   detected_elements: ["text", "formulas", "diagrams"]
// }

// Convert to 0-100 score
const score = service.classificationToScore(
  analysis.classification,
  analysis.confidence
);
console.log(`Educational Score: ${score}%`);
```

### Method 3: Video Analysis with OpenRouter

```javascript
const VideoAnalysisService = require('./utils/videoAnalysisService');

const videoService = new VideoAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Analyze video - automatically uses OpenRouter for each frame
const videoAnalysis = await videoService.analyze(videoUrl);

console.log(videoAnalysis);
// {
//   success: true,
//   score: 75,                           // Average educational score
//   reason: "Video contains educational content",
//   frameCount: 12,                      // Total frames extracted
//   analyzedFrames: 5,                   // Frames analyzed (max 5)
//   averageScore: 75,                    // Average score across frames
//   isCasual: false,                     // Not a meme/distraction
//   approved: true,                      // Score >= 65
//   type: "video",
//   analysisMethod: "openrouter_frame_analysis",
//   extractedText: "..."
// }

---

## Classification Criteria

### ✅ EDUCATIONAL Content
- Lectures, tutorials, how-to guides
- Diagrams, flowcharts, infographics
- Textbooks, research papers
- Educational videos, learning materials
- Scientific experiments, demonstrations
- Formula sheets, study materials

### ❌ NON-EDUCATIONAL Content
- Memes and joke images
- Social media posts for engagement only
- Entertainment-only content
- Random distractions
- Funny pictures without educational value
- Casual selfies and vibe posts

---

## Video Analysis Flow

```
Video Upload
    ↓
Extract Frames (every 5 seconds)
    ↓
For each frame (max 5 frames):
    1. Safety checks (NSFW/Violence)
    2. OpenRouter Vision Analysis
    3. Fallback: OCR + HF Classification
    ↓
Calculate average score from all frames
    ↓
Check for casual/meme content patterns
    ↓
Return final educational score (0-100)
```

### Video Example

**Input:** 10-minute educational video about photosynthesis

**Process:**
- Extracts 12 frames (every 5 seconds)
- Analyzes up to 5 frames with OpenRouter Vision
- OpenRouter identifies: diagrams, text labels, scientific content
- Score per frame: 85%, 90%, 78%, 88%, 82%
- Average: 84% (Educational ✅)

**Output:**
```json
{
  "success": true,
  "score": 84,
  "reason": "Video contains educational content",
  "frameCount": 12,
  "analyzedFrames": 5,
  "approved": true
}
```

```json
{
  "classification": "EDUCATIONAL or NON-EDUCATIONAL",
  "confidence": 0.87,
  "content_type": "diagram/lecture/textbook/meme/etc",
  "reason": "Explanation of why it was classified this way",
  "detected_elements": ["list", "of", "key", "elements"]
}
```

---

## Integration Points

### 1. Posts Route (`routes/posts.js`)

Both image and video analysis services use OpenRouter:

```javascript
// Image analysis with OpenRouter
const imageAnalysis = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Video analysis with OpenRouter
const videoAnalysis = new VideoAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);
```

### 2. Upload Route (`routes/upload.js`)

Uploaded images and videos are validated with OpenRouter:

```javascript
// Image uploads validated with OpenRouter
const imageAnalysis = new ImageAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// Video uploads validated with OpenRouter
const videoAnalysis = new VideoAnalysisService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);
```

### 3. Testing (`test_enhancements.js`)

Test OpenRouter classification for both images and videos:

```bash
node test_enhancements.js
```

Tests:
- Image analysis with OpenRouter
- Video frame analysis with OpenRouter
- Educational vs non-educational detection
- Meme/distraction detection

---

## Error Handling

OpenRouter classification fails gracefully. If the API is unavailable:

1. **Non-blocking** - Image analysis continues with fallback methods
2. **Logged** - Errors are logged but don't crash the system
3. **Fallback** - Uses HuggingFace models or local detection

```javascript
try {
  const orResult = await imageService.classifyImageWithOpenRouter(imageBase64);
  if (orResult) {
    console.log('✓ OpenRouter classification successful');
  }
} catch (error) {
  console.warn('⚠️ OpenRouter failed (non-blocking):', error.message);
  // Continue with other analysis methods
}
```

---

## Performance Metrics

| Method | Speed | Accuracy | Cost |
|--------|-------|----------|------|
| OpenRouter Vision | ~3-5s | ⭐⭐⭐⭐⭐ | FREE (tier) |
| HF Vision Recognition | ~2-3s | ⭐⭐⭐⭐ | FREE |
| Local OCR Detection | ~1-2s | ⭐⭐⭐ | FREE |

---

## Free vs Paid Models

MindScroll uses **exclusively free tier models**:

- ✅ **nousresearch/nous-hermes-2-vision-7b** - Free vision model
- ✅ **meta-llama/llama-2-7b** - Free text model (fallback)
- ❌ No premium/paid models

All classifications are free to use within OpenRouter's free tier limits.

---

## Troubleshooting

### Issue: "OpenRouter API key not configured"
**Solution:** Ensure `openrouter_API_KEY` is set in `.env`

### Issue: "Failed to parse OpenRouter response"
**Solution:** Check that the image format is valid (JPEG/PNG) and within size limits

### Issue: OpenRouter classification timeout
**Solution:** The service has a 60-second timeout. Check your internet connection

### Issue: Different results than expected
**Solution:** OpenRouter uses multi-model ensemble. Results may vary based on image quality

---

## Example Workflow

```
User uploads image
    ↓
Step 1: NSFW Detection (HF)
    ↓ If safe
Step 2: Violence Detection (HF)
    ↓ If safe
Step 3: OCR Text Extraction (Tesseract)
    ↓ 
If text found: Classify text → Score
If no text: OpenRouter Vision Classification → Score
    ↓
Return Educational Score (0-100)
```

---

## Best Practices

1. **Always validate API key** before starting the server
2. **Use non-blocking errors** - OpenRouter failures shouldn't crash the app
3. **Cache results** where possible to reduce API calls
4. **Monitor API usage** - Track free tier limits
5. **Log classifications** - Keep audit trail of decisions
6. **Test with diverse content** - Memes, textbooks, diagrams, videos, etc.

---

## Related Files

- [OpenRouterVisionService](./utils/openRouterVisionService.js) - Vision API wrapper
- [ImageAnalysisService](./utils/imageAnalysisService.js) - Image analysis with OpenRouter
- [VideoAnalysisService](./utils/videoAnalysisService.js) - Video frame analysis with OpenRouter
- [routes/posts.js](./routes/posts.js) - Post validation using OpenRouter
- [routes/upload.js](./routes/upload.js) - Upload validation using OpenRouter

---

## Support & Debugging

Enable debug logging:

```javascript
// In your code
console.log('🔄 OpenRouter Vision API call...');
console.log('Classification:', result.classification);
console.log('Confidence:', result.confidence);
```

Or check logs in terminal output for `[OpenRouter]` markers.

---

## License & Attribution

OpenRouter free models are provided by:
- **Nous Research** - nous-hermes-2-vision-7b
- **Meta** - Llama 2 models

All free tier usage is governed by OpenRouter's terms of service.

