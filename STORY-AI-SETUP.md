# 🤖 Local AI Story Generator & TTS Setup

This feature adds an offline, privacy-focused AI story generator to Mwema. It uses the **TinyLlama-1.1B** model to generate personalized stories for children based on character values (Honesty, Integrity, etc.).

---

## 📋 Prerequisites

Before running the application, ensure you have the following system requirements met:

### 🐧 Linux (Recommended)
The TTS engine on Linux uses `espeak` for high reliability.
- **Ubuntu/Debian/Kali**:
  ```bash
  sudo apt-get update
  sudo apt-get install espeak
  ```
- **Fedora**:
  ```bash
  sudo dnf install espeak
  ```

### 🪟 Windows
Uses the native SAPI5 system voice.
- No additional installs required! It will use the default Windows voice.

### 🍎 macOS
Uses the native `say` command.
- No additional installs required! It will use the default macOS voice.

---

## 🚀 Installation & Setup

1. **Install Dependencies**:
   Run the following in the project root:
   ```bash
   npm install
   ```
   *Note: This will install `node-llama-cpp` for AI and `say` for TTS.*

2. **Run the App**:
   ```bash
   npm start
   ```

3. **First-Time AI Setup**:
   - Navigate to **"Create Story"**.
   - The app will automatically detect that the AI model is missing.
   - Click to start the download (~669 MB). This file will be saved to your local user config folder (`~/.config/Mwema App/models/` on Linux).
   - Once the download is complete, the AI will initialize.

---

## 🛠️ Configuration & Troubleshooting

### 1. Model Storage
The AI model (`tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`) is stored in:
- **Linux**: `~/.config/Mwema App/models/`
- **Windows**: `%AppData%\Mwema App\models\`
- **macOS**: `~/Library/Application Support/Mwema App/models/`

### 2. Slow Story Generation
The AI runs locally on your **CPU** to ensure maximum compatibility. Generation usually takes **15-30 seconds** depending on your processor. 

### 3. Voice is not playing (Linux)
If you click "Listen to Story" and nothing happens, ensure `espeak` is installed:
```bash
which espeak
```
If it returns nothing, follow the Linux install steps above.

### 4. Language Support
The AI is capable of generating stories in multiple languages (**English, Swahili, French, Spanish, etc.**). Select your preferred language in the "Story Language" dropdown before generating.

---

## 🤝 Feature Contributions
If you are contributing to this feature, please ensure that any changes to `src/main/ai-service.js` or `src/main/tts-service.js` maintain cross-platform compatibility.
