const say = require('say');
const { spawn } = require('child_process');

// TTS State
let isSpeaking = false;
let currentVoice = null;
let linuxProcess = null;

const isLinux = process.platform === 'linux';

/**
 * Get available system voices
 * @returns {Promise<Array>} List of available voices
 */
function getAvailableVoices() {
    if (isLinux) {
        // Return a curated list of common espeak languages for the UI
        return Promise.resolve([
            { id: 'en', name: 'English (Default)', lang: 'en' },
            { id: 'en-us', name: 'English (American)', lang: 'en-us' },
            { id: 'en-gb', name: 'English (British)', lang: 'en-gb' },
            { id: 'sw', name: 'Swahili', lang: 'sw' },
            { id: 'fr-fr', name: 'French', lang: 'fr-fr' },
            { id: 'es', name: 'Spanish', lang: 'es' },
            { id: 'de', name: 'German', lang: 'de' },
            { id: 'hi', name: 'Hindi', lang: 'hi' },
            { id: 'zh', name: 'Mandarin', lang: 'zh' }
        ]);
    }

    return new Promise((resolve) => {
        say.getInstalledVoices((err, voices) => {
            if (err) {
                console.error('Error getting voices:', err);
                resolve([]);
            } else {
                // Map system voices to a consistent format
                resolve(voices ? voices.map(v => ({ id: v, name: v, lang: '' })) : []);
            }
        });
    });
}

/**
 * Speak text using system TTS
 * @param {string} text - Text to speak
 * @param {Object} options - TTS options
 * @param {number} options.speed - Speech speed (0.5 - 2.0, default 1.0)
 * @param {string} options.voice - Voice name (optional)
 */
function speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
        if (isSpeaking) {
            stopSpeaking();
        }

        const speed = options.speed || 1.0;
        const voice = options.voice || currentVoice;

        isSpeaking = true;

        if (isLinux) {
            console.log(`Using native espeak for Linux TTS (Voice: ${voice}, Speed: ${speed})`);

            const espeakParams = [];

            // Speed: espeak -s is words per minute. Default is 175.
            const espeakSpeed = Math.round(175 * speed);
            espeakParams.push('-s', espeakSpeed.toString());

            // Voice/Language: espeak -v
            if (voice) {
                espeakParams.push('-v', voice);
            }

            espeakParams.push(text);

            linuxProcess = spawn('espeak', espeakParams);

            linuxProcess.on('close', (code) => {
                isSpeaking = false;
                linuxProcess = null;
                if (code === 0 || code === null) {
                    resolve();
                } else {
                    reject(new Error(`espeak exited with code ${code}`));
                }
            });

            linuxProcess.on('error', (err) => {
                isSpeaking = false;
                linuxProcess = null;
                if (err.code === 'ENOENT') {
                    reject(new Error('espeak not found. Please run: sudo apt-get install espeak'));
                } else {
                    reject(err);
                }
            });
        } else {
            say.speak(text, voice, speed, (err) => {
                isSpeaking = false;
                if (err) {
                    console.error('TTS Error:', err);
                    reject(new Error(`TTS failed: ${err.message}`));
                } else {
                    resolve();
                }
            });
        }
    });
}

/**
 * Stop current speech
 */
function stopSpeaking() {
    if (isSpeaking) {
        if (isLinux && linuxProcess) {
            linuxProcess.kill();
            linuxProcess = null;
        } else {
            say.stop();
        }
        isSpeaking = false;
    }
}

/**
 * Check if currently speaking
 */
function isTTSSpeaking() {
    return isSpeaking;
}

/**
 * Set default voice
 */
function setDefaultVoice(voiceName) {
    currentVoice = voiceName;
}

/**
 * Initialize TTS service
 */
async function initializeTTS() {
    try {
        const voices = await getAvailableVoices();

        if (isLinux) {
            currentVoice = null; // espeak uses default voice
            return { success: true, voices, defaultVoice: 'espeak' };
        }

        if (voices.length > 0) {
            console.log('Available TTS voices:', voices);
            const childFriendlyVoices = voices.filter(v =>
                v.toLowerCase().includes('female') ||
                v.toLowerCase().includes('samantha') ||
                v.toLowerCase().includes('karen')
            );

            if (childFriendlyVoices.length > 0) {
                currentVoice = childFriendlyVoices[0];
            } else {
                currentVoice = voices[0];
            }
        }

        return { success: true, voices, defaultVoice: currentVoice };
    } catch (error) {
        console.error('TTS initialization error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    initializeTTS,
    speakText,
    stopSpeaking,
    isTTSSpeaking,
    getAvailableVoices,
    setDefaultVoice,
};

