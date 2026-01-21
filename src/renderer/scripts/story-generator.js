// Story Generator Script

// Since nodeIntegration is true, we can use ipcRenderer directly
const { ipcRenderer } = require('electron');

let currentStory = null;

document.addEventListener('DOMContentLoaded', async () => {
    const childNameInput = document.getElementById('child-name');
    const valueSelect = document.getElementById('value-select');
    const generateBtn = document.getElementById('generate-btn');
    const generatorForm = document.getElementById('generator-form');
    const loadingSection = document.getElementById('loading-section');
    const storyDisplay = document.getElementById('story-display');
    const storyContent = document.getElementById('story-content');
    const downloadSection = document.getElementById('download-section');
    const downloadProgress = document.getElementById('download-progress');
    const downloadStatus = document.getElementById('download-status');

    // TTS Settings Controls
    const voiceSelect = document.getElementById('tts-voice-select');
    const speedRange = document.getElementById('tts-speed-range');
    const speedVal = document.getElementById('speed-val');

    // TTS Actions
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const generateNewBtn = document.getElementById('generate-new-btn');

    // Check model status on load
    await checkAndInitializeModel();
    // Initialize TTS voices
    await loadTTSVoices();

    // Speed range change handler
    speedRange.addEventListener('input', () => {
        const val = Math.round(speedRange.value * 100);
        speedVal.textContent = `${val}%`;
    });

    // Generate story button click
    generateBtn.addEventListener('click', handleGenerateStory);

    // TTS controls
    playBtn.addEventListener('click', () => {
        if (currentStory) {
            const speed = parseFloat(speedRange.value);
            const voice = voiceSelect.value;

            ipcRenderer.send('read-story', currentStory.content, { speed, voice });
            playBtn.style.display = 'none';
            stopBtn.style.display = 'flex';
        }
    });

    stopBtn.addEventListener('click', () => {
        ipcRenderer.send('stop-reading');
        stopBtn.style.display = 'none';
        playBtn.style.display = 'flex';
    });

    generateNewBtn.addEventListener('click', () => {
        storyDisplay.style.display = 'none';
        generatorForm.style.display = 'block';
        ipcRenderer.send('stop-reading');
        stopBtn.style.display = 'none';
        playBtn.style.display = 'flex';
    });

    // TTS event listeners
    ipcRenderer.on('tts-finished', () => {
        stopBtn.style.display = 'none';
        playBtn.style.display = 'flex';
    });

    ipcRenderer.on('tts-error', (event, error) => {
        console.error('TTS Error:', error);
        alert('Sorry, text-to-speech failed: ' + error);
        stopBtn.style.display = 'none';
        playBtn.style.display = 'flex';
    });

    /**
     * Load and populate available TTS voices
     */
    async function loadTTSVoices() {
        try {
            const result = await ipcRenderer.invoke('get-tts-voices');
            if (result && result.success) {
                voiceSelect.innerHTML = '';
                result.voices.forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.id;
                    option.textContent = voice.name;
                    voiceSelect.appendChild(option);
                });

                if (result.defaultVoice) {
                    voiceSelect.value = result.defaultVoice;
                }
            }
        } catch (error) {
            console.error('Error loading voices:', error);
            voiceSelect.innerHTML = '<option value="">Voices unavailable</option>';
        }
    }

    /**
     * Check if model is ready, download if needed
     */
    async function checkAndInitializeModel() {
        try {
            const status = await ipcRenderer.invoke('check-model-status');

            if (!status.exists) {
                // Model doesn't exist - user will see download prompt when they try to generate
                console.log('Model not found - will prompt for download on first story generation');
            } else if (!status.initialized) {
                // Model exists but not initialized
                console.log('Initializing model...');
                await ipcRenderer.invoke('initialize-model');
            }
        } catch (error) {
            console.error('Error checking model status:', error);
            // Don't block the UI with an alert - just log the error
            // User will see appropriate message when they try to generate a story
        }
    }

    /**
     * Download the AI model
     */
    async function downloadModel() {
        downloadSection.style.display = 'block';
        generatorForm.style.display = 'none';

        // Listen for progress updates
        ipcRenderer.on('download-progress', (event, progress) => {
            const percent = progress.percent || 0;
            downloadProgress.style.width = `${percent}%`;

            const downloaded = (progress.downloaded / 1024 / 1024).toFixed(1);
            const total = (progress.total / 1024 / 1024).toFixed(1);
            downloadStatus.textContent = `Downloaded: ${downloaded} MB / ${total} MB (${percent}%)`;
        });

        try {
            const result = await ipcRenderer.invoke('download-model');

            if (result.success) {
                downloadStatus.textContent = 'Download complete! Initializing...';

                // Initialize the model and check result
                const initResult = await ipcRenderer.invoke('initialize-model');

                if (initResult.success) {
                    downloadSection.style.display = 'none';
                    generatorForm.style.display = 'block';
                    alert('AI model ready! You can now generate stories.');
                } else {
                    if (initResult.error === 'MODEL_CORRUPTED') {
                        if (confirm('The model was downloaded but appears to be corrupted.\n\nWould you like to try repairing (re-downloading) it?')) {
                            await ipcRenderer.invoke('delete-model');
                            await downloadModel();
                            return;
                        }
                    }
                    throw new Error(initResult.error || 'Initialization failed after download');
                }
            } else {
                throw new Error(result.error || 'Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            downloadStatus.textContent = `Error: ${error.message}`;
            alert(`Failed to download AI model: ${error.message}\nPlease check your internet connection and try again.`);
        } finally {
            ipcRenderer.removeAllListeners('download-progress');
        }
    }

    /**
     * Generate a new story
     */
    async function handleGenerateStory() {
        const childName = childNameInput.value.trim();
        const value = valueSelect.value;

        // Validation
        if (!childName) {
            alert('Please enter your name!');
            childNameInput.focus();
            return;
        }

        if (!value) {
            alert('Please choose what you want to learn about!');
            valueSelect.focus();
            return;
        }

        // Check if model exists, if not download it first
        try {
            const status = await ipcRenderer.invoke('check-model-status');

            if (!status.exists) {
                // Start download
                await downloadModel();
                return; // After download, user can click generate again
            }

            if (!status.initialized) {
                // Initialize model
                console.log('Initializing model...');
                generatorForm.style.display = 'none';
                loadingSection.style.display = 'block';
                const initResult = await ipcRenderer.invoke('initialize-model');

                if (!initResult.success) {
                    if (initResult.error === 'MODEL_CORRUPTED') {
                        if (confirm(initResult.message + '\n\nWould you like to repair the AI now?')) {
                            // Delete corrupted model
                            await ipcRenderer.invoke('delete-model');
                            // Start fresh download
                            await downloadModel();
                            return;
                        }
                    }
                    throw new Error(initResult.error || 'Failed to initialize AI model');
                }

                loadingSection.style.display = 'none';
                generatorForm.style.display = 'block';
            }
        } catch (error) {
            console.error('Model check error:', error);
            alert('Error checking AI model. Please try again.');
            return;
        }

        // Show loading
        generatorForm.style.display = 'none';
        loadingSection.style.display = 'block';

        try {
            // Generate story
            const language = voiceSelect.options[voiceSelect.selectedIndex].text.split(' ')[0]; // Extract language name
            const voiceId = voiceSelect.value;

            const story = await ipcRenderer.invoke('generate-story', {
                childName,
                value,
                language
            });
            currentStory = story;

            // Display story
            storyContent.textContent = story.content;
            loadingSection.style.display = 'none';
            storyDisplay.style.display = 'block';

            // Reset TTS controls
            playBtn.style.display = 'flex';
            stopBtn.style.display = 'none';

            // Auto-scroll to story
            storyDisplay.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Story generation error:', error);
            loadingSection.style.display = 'none';
            generatorForm.style.display = 'block';
            alert(`Failed to generate story: ${error.message}\nPlease try again.`);
        }
    }
});
