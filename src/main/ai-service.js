const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { app } = require('electron');
const https = require('https');

// node-llama-cpp needs to be dynamically imported (ESM module)
let getLlama;
let LlamaChatSession;
let llamaInstance = null;
let llamaModuleLoaded = false;

/**
 * Load the node-llama-cpp module dynamically
 */
async function loadLlamaModule() {
    if (llamaModuleLoaded) return;

    try {
        const llamaModule = await import('node-llama-cpp');
        getLlama = llamaModule.getLlama;
        LlamaChatSession = llamaModule.LlamaChatSession;
        llamaModuleLoaded = true;
        console.log('node-llama-cpp module loaded successfully');
    } catch (error) {
        console.error('Failed to load node-llama-cpp:', error);
        throw error;
    }
}

// Configuration
const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
const MODEL_FILENAME = 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

// Paths
const modelsDir = path.join(app.getPath('userData'), 'models');
const modelPath = path.join(modelsDir, MODEL_FILENAME);
const storiesDir = path.join(app.getPath('userData'), 'generated_stories');

// AI State
let model = null;
let context = null;
let session = null;
let isInitialized = false;
let isDownloading = false;

// System prompt for child-appropriate storytelling (simplified for v3)
const SYSTEM_PROMPT = `You are a creative, kind, and educational storyteller for children aged 1-9. 
Your goal is to write short, engaging stories (max 200 words) that teach a specific character value.
- Vocabulary: Use simple words suitable for a 5-year-old.
- Values: Focus on honesty, integrity, or digital safety.
- Tone: Joyful, encouraging, and safe.
- Structure: Clear beginning, a small challenge, and a positive resolution.
- No violence, scary content, or inappropriate themes.
- Use names and values provided by the user.`;

/**
 * Ensure directories exist
 */
async function ensureDirectories() {
    try {
        await fs.mkdir(modelsDir, { recursive: true });
        await fs.mkdir(storiesDir, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

const EXPECTED_MODEL_SIZE = 668788096; // TinyLlama Q4_K_M exact size in bytes as reported by HF moon cache

/**
 * Check if model exists and is complete
 */
function modelExists() {
    if (!fsSync.existsSync(modelPath)) return false;

    try {
        const stats = fsSync.statSync(modelPath);
        const exists = stats.size >= EXPECTED_MODEL_SIZE;

        if (!exists) {
            console.log(`Model file found but incomplete. Found: ${stats.size} bytes, Expected: ${EXPECTED_MODEL_SIZE} bytes`);
        }

        return exists;
    } catch (error) {
        return false;
    }
}

/**
 * Get model file size
 */
async function getModelSize() {
    try {
        const stats = await fs.stat(modelPath);
        return stats.size;
    } catch {
        return 0;
    }
}

/**
const http = require('http');

/**
 * Download the TinyLlama model from HuggingFace with resume support and retries
 * @param {Function} progressCallback - Callback for download progress
 */
async function downloadModel(progressCallback) {
    if (isDownloading) {
        throw new Error('Download already in progress');
    }

    await ensureDirectories();
    isDownloading = true;

    const MAX_RETRIES = 10;
    let retryCount = 0;

    const attemptDownload = async () => {
        const currentSize = await getModelSize();

        return new Promise((resolve, reject) => {
            const startDownload = (url, startByte) => {
                console.log(`Starting download (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}): ${url} (Resuming from ${startByte} bytes)`);

                const urlObj = new URL(url);
                const client = urlObj.protocol === 'https:' ? https : http;

                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Mwema Desktop App)',
                        ...(startByte > 0 ? { 'Range': `bytes=${startByte}-` } : {})
                    },
                    timeout: 120000 // 120 second timeout for unstable connections
                };

                const req = client.get(url, options, (res) => {
                    // Handle redirects
                    if (res.statusCode === 302 || res.statusCode === 301 || res.statusCode === 307 || res.statusCode === 308) {
                        const nextUrl = new URL(res.headers.location, url).toString();
                        console.log(`Redirecting to: ${nextUrl}`);
                        startDownload(nextUrl, startByte);
                        return;
                    }

                    // Handle already finished
                    if (res.statusCode === 416) {
                        console.log('Model already complete (416)');
                        resolve({ success: true, message: 'Model already complete' });
                        return;
                    }

                    if (res.statusCode !== 200 && res.statusCode !== 206) {
                        const errorMsg = `Server responded with ${res.statusCode} ${res.statusMessage || ''}`;
                        console.error('Download server error:', errorMsg);
                        reject(new Error(errorMsg));
                        return;
                    }

                    const contentLength = parseInt(res.headers['content-length'], 10) || 0;
                    const totalBytes = contentLength + startByte;

                    const file = fsSync.createWriteStream(modelPath, { flags: startByte > 0 ? 'a' : 'w' });
                    let downloadedBytes = startByte;

                    res.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                        file.write(chunk);

                        const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
                        progressCallback?.({
                            percent,
                            downloaded: downloadedBytes,
                            total: totalBytes
                        });
                    });

                    res.on('end', () => {
                        file.end();
                        if (totalBytes > 0 && downloadedBytes < totalBytes) {
                            reject(new Error('Download interrupted - content length mismatch'));
                        } else {
                            console.log('Download finished successfully');
                            resolve({
                                success: true,
                                message: 'Model ready!',
                                size: downloadedBytes
                            });
                        }
                    });

                    res.on('error', (error) => {
                        file.close();
                        reject(new Error(`Stream error: ${error.message}`));
                    });
                });

                req.on('error', (error) => {
                    // Extract better message from AggregateError or others
                    let msg = error.message;
                    if (error.errors && Array.isArray(error.errors)) {
                        msg = error.errors.map(e => e.message || e.code).join(', ');
                    }
                    if (!msg) msg = error.code || 'Network error';
                    reject(new Error(msg));
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Connection timed out'));
                });
            };

            startDownload(MODEL_URL, currentSize);
        });
    };

    const runWithRetry = async () => {
        try {
            const result = await attemptDownload();
            isDownloading = false;
            return result;
        } catch (error) {
            console.error(`Download attempt ${retryCount + 1} failed:`, error.message);

            if (retryCount < MAX_RETRIES) {
                retryCount++;
                // Exponential backoff capped at 30 seconds
                const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
                console.log(`Retrying (${retryCount}/${MAX_RETRIES}) in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                return runWithRetry();
            } else {
                isDownloading = false;
                throw error;
            }
        }
    };

    return runWithRetry();
}

/**
 * Initialize the LLaMA model
 */
async function initializeModel() {
    if (isInitialized) {
        return { success: true, message: 'Model already initialized' };
    }

    if (!modelExists()) {
        throw new Error('Model file not found or incomplete. Please download it first.');
    }

    try {
        // Load the llama module first if not already loaded
        if (!llamaModuleLoaded) {
            console.log('Loading node-llama-cpp module...');
            await loadLlamaModule();
        }

        console.log('Creating llama instance...');
        if (!llamaInstance) {
            llamaInstance = await getLlama();
        }

        console.log('Loading TinyLlama model from:', modelPath);

        try {
            model = await llamaInstance.loadModel({
                modelPath,
                gpuLayers: 0 // Force CPU to resolve "unexpectedly reached end of file" GPU issues
            });

            console.log('Creating context...');
            context = await model.createContext();

            console.log('Creating chat session...');
            session = new LlamaChatSession({
                contextSequence: context.getSequence(),
                systemPrompt: SYSTEM_PROMPT
            });

            isInitialized = true;
            console.log('Model initialized successfully');

            return { success: true, message: 'Model initialized successfully' };
        } catch (loadError) {
            console.error('LLaMA load error details:', loadError);
            const errorMessage = loadError.message || String(loadError);

            // Check for corruption signatures
            const isCorrupted = errorMessage.includes('corrupted') ||
                errorMessage.includes('out of bounds') ||
                errorMessage.includes('reached end of file') ||
                errorMessage.includes('Failed to load model'); // Common wrapper for corruption

            if (isCorrupted) {
                return {
                    success: false,
                    error: 'MODEL_CORRUPTED',
                    message: 'The downloaded AI model file appears to be corrupted or incomplete. This can happen due to network interruptions.'
                };
            }
            throw loadError;
        }
    } catch (error) {
        console.error('Model initialization error:', error);
        return {
            success: false,
            error: error.message || 'Unknown initialization error'
        };
    }
}

/**
 * Generate a story based on child name, value and language
 * @param {string} childName - Name of the child
 * @param {string} value - Character value to teach (e.g., "Honesty", "Integrity")
 * @param {string} language - Language to write in (e.g., "English", "Swahili", "French")
 */
async function generateStory(childName, value, language = 'English') {
    if (!isInitialized) {
        throw new Error('Model not initialized. Please initialize first.');
    }

    try {
        const userPrompt = `Write a short story (max 200 words) about a character named ${childName} who learns about ${value}. 
        CRITICAL: This story MUST be written in the ${language} language.
        Make it fun, simple, and educational for young children.`;

        console.log(`Generating story in ${language} for:`, childName, '-', value);

        // Generate story using the LLaMA model
        const storyText = await session.prompt(userPrompt, {
            maxTokens: 300,
            temperature: 0.7,
            topP: 0.9,
        });

        // Save the story
        const storyId = Date.now();
        const storyData = {
            id: storyId,
            childName,
            value,
            language,
            content: storyText.trim(),
            date: new Date().toISOString(),
        };

        const storyFilePath = path.join(storiesDir, `story_${storyId}.json`);
        await fs.writeFile(storyFilePath, JSON.stringify(storyData, null, 2));

        console.log('Story generated and saved:', storyId);
        return storyData;
    } catch (error) {
        console.error('Story generation error:', error);
        throw new Error(`Failed to generate story: ${error.message}`);
    }
}

/**
 * Get all saved stories
 */
async function getSavedStories() {
    try {
        await ensureDirectories();
        const files = await fs.readdir(storiesDir);
        const storyFiles = files.filter(f => f.startsWith('story_') && f.endsWith('.json'));

        const stories = [];
        for (const file of storyFiles) {
            const filePath = path.join(storiesDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            stories.push(JSON.parse(content));
        }

        // Sort by date, newest first
        stories.sort((a, b) => new Date(b.date) - new Date(a.date));
        return stories;
    } catch (error) {
        console.error('Error reading saved stories:', error);
        return [];
    }
}

/**
 * Delete a story by ID
 */
async function deleteStory(storyId) {
    try {
        const storyFilePath = path.join(storiesDir, `story_${storyId}.json`);
        await fs.unlink(storyFilePath);
        return { success: true, message: 'Story deleted' };
    } catch (error) {
        console.error('Error deleting story:', error);
        throw new Error(`Failed to delete story: ${error.message}`);
    }
}

/**
 * Delete the model file (used for repair)
 */
async function deleteModel() {
    try {
        if (modelExists()) {
            fsSync.unlinkSync(modelPath);
        }
        isInitialized = false;
        model = null;
        context = null;
        session = null;
        return { success: true, message: 'Model deleted successfully' };
    } catch (error) {
        console.error('Error deleting model:', error);
        throw new Error(`Failed to delete model: ${error.message}`);
    }
}

/**
 * Get model status
 */
async function getModelStatus() {
    const exists = modelExists();
    const size = exists ? await getModelSize() : (fsSync.existsSync(modelPath) ? await getModelSize() : 0);

    return {
        exists,
        expectedSize: EXPECTED_MODEL_SIZE,
        initialized: isInitialized,
        downloading: isDownloading,
        path: modelPath,
        size,
        ready: exists && isInitialized
    };
}

/**
 * Initialize AI service on app startup
 */
async function initializeAI() {
    try {
        await ensureDirectories();

        // Pre-load the llama module so it's ready when needed
        console.log('Pre-loading node-llama-cpp module...');
        await loadLlamaModule();

        if (modelExists()) {
            console.log('Model found, initializing...');
            await initializeModel();
        } else {
            console.log('Model not found. User will need to download it.');
        }
    } catch (error) {
        console.error('AI initialization error:', error);
        // Don't throw -allow app to start even if AI fails
    }
}

module.exports = {
    initializeAI,
    downloadModel,
    initializeModel,
    deleteModel,
    generateStory,
    getSavedStories,
    deleteStory,
    getModelStatus,
    modelExists,
};
