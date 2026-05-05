/**
 * OpenRouter Vision Service - FREE VISION MODELS FOR IMAGE CLASSIFICATION
 * Uses OpenRouter free tier vision models for educational classification
 * Models: nousresearch/nous-hermes-2-vision-7b (free tier available)
 * Classifies images as: Educational or Non-Educational (Meme/Distraction)
 */

const https = require('https');

class OpenRouterVisionService {
  constructor(openRouterKey) {
    this.apiKey = openRouterKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
    
    // Using free tier vision models from OpenRouter
    this.freeModels = {
      vision: 'nousresearch/nous-hermes-2-vision-7b', // Free vision model for image analysis
      textAnalysis: 'meta-llama/llama-2-7b' // For fallback text analysis
    };
  }

  /**
   * Convert image buffer to base64
   */
  bufferToBase64(buffer) {
    return buffer.toString('base64');
  }

  /**
   * Call OpenRouter Vision API for image classification
   * Classifies images as educational or non-educational (meme/distraction)
   */
  async classifyImageEducational(imageBase64) {
    if (!imageBase64) {
      throw new Error('Image base64 data required');
    }

    const prompt = `Analyze this image and classify it as EDUCATIONAL or NON-EDUCATIONAL.

EDUCATIONAL content INCLUDES: 
- Teaching/instruction (person teaching, explaining, lecturing, demonstrating)
- Classroom scenes, lectures, presentations
- Technical diagrams, formulas, equations, code
- Textbooks, educational materials, learning resources
- Science experiments, demonstrations, how-to guides, tutorials
- Educational infographics, charts, data visualizations
- Research materials, academic content
- Any content designed for instruction/learning

NON-EDUCATIONAL content INCLUDES:
- Memes, joke images, random distractions
- Entertainment-only content, funny pictures without learning value
- Social media posts for engagement only (selfies, lifestyle, "look at me")
- Random personal photos without educational context

IMPORTANT: If someone is TEACHING, EXPLAINING, DEMONSTRATING, or INSTRUCTING anything, it's EDUCATIONAL.

Respond with ONLY a JSON object (no markdown, no code blocks):
{
  "classification": "EDUCATIONAL" or "NON-EDUCATIONAL",
  "confidence": 0 to 1,
  "content_type": "brief description (e.g., 'person teaching', 'lecture', 'demonstration')",
  "reason": "short explanation",
  "detected_elements": ["list of key elements"]
}`;

    return this.callOpenRouterVision(imageBase64, prompt, 'classification');
  }

  /**
   * Call OpenRouter Vision API
   */
  callOpenRouterVision(imageBase64, prompt, analysisType = 'general') {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model: this.freeModels.vision,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'MindScroll-Educational-Classification'
        }
      };

      console.log(`🔄 OpenRouter Vision API call (${analysisType})...`);

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.error) {
              reject(new Error(`OpenRouter error: ${parsed.error.message}`));
            } else if (parsed.choices && parsed.choices[0]) {
              const responseText = parsed.choices[0].message.content;
              
              // Parse JSON response
              let analysisResult;
              try {
                // Extract JSON from response (handle markdown code blocks if present)
                let jsonStr = responseText;
                if (responseText.includes('```')) {
                  jsonStr = responseText.split('```')[1].replace('json\n', '').trim();
                }
                analysisResult = JSON.parse(jsonStr);
                
                console.log(`✓ OpenRouter Analysis Complete:`);
                console.log(`  Classification: ${analysisResult.classification}`);
                console.log(`  Confidence: ${analysisResult.confidence}`);
                
                resolve(analysisResult);
              } catch (parseErr) {
                reject(new Error(`Failed to parse OpenRouter response: ${parseErr.message}\nResponse: ${responseText}`));
              }
            } else {
              reject(new Error('Invalid OpenRouter response structure'));
            }
          } catch (e) {
            reject(new Error(`Failed to parse OpenRouter response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`OpenRouter request failed: ${err.message}`));
      });

      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('OpenRouter request timeout (60s)'));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Convert classification to educational score (0-100)
   */
  classificationToScore(classification, confidence) {
    if (classification === 'EDUCATIONAL') {
      return Math.round(confidence * 100);
    } else {
      return Math.round((1 - confidence) * 100);
    }
  }
}

module.exports = OpenRouterVisionService;
