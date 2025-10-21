/**
 * Voice Processor - Advanced Voice Recognition, Commands, and Audio Processing
 * Axzora Super App - Voice Interface System
 */

class VoiceProcessor {
    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.voiceVisualizerCanvas = document.getElementById('voiceVisualizer');
        this.voiceCtx = this.voiceVisualizerCanvas?.getContext('2d');
        this.animationFrame = null;
        
        // Voice data storage
        this.voiceData = {
            isActive: false,
            volume: 0,
            frequency: 0,
            confidence: 0,
            command: null,
            lastCommand: null,
            commandHistory: []
        };

        // Voice commands mapping
        this.commandMap = {
            // Navigation
            'go to dashboard': () => this.executeCommand('navigate', { target: 'dashboard' }),
            'open wallet': () => this.executeCommand('navigate', { target: 'wallet' }),
            'show balance': () => this.executeCommand('show', { target: 'balance' }),
            'show transactions': () => this.executeCommand('show', { target: 'transactions' }),
            
            // Token operations
            'mint tokens': () => this.executeCommand('mint', {}),
            'mint happy tokens': () => this.executeCommand('mint', {}),
            'burn tokens': () => this.executeCommand('burn', {}),
            'transfer tokens': () => this.executeCommand('transfer', {}),
            'send money': () => this.executeCommand('transfer', {}),
            
            // UPI operations
            'make payment': () => this.executeCommand('upi', { action: 'pay' }),
            'scan qr code': () => this.executeCommand('upi', { action: 'scan' }),
            'generate qr': () => this.executeCommand('upi', { action: 'generate' }),
            'pay with upi': () => this.executeCommand('upi', { action: 'pay' }),
            
            // Biometric operations
            'authenticate': () => this.executeCommand('biometric', { action: 'authenticate' }),
            'verify identity': () => this.executeCommand('biometric', { action: 'verify' }),
            'start tracking': () => this.executeCommand('biometric', { action: 'start' }),
            'stop tracking': () => this.executeCommand('biometric', { action: 'stop' }),
            
            // System commands
            'hello mr happy': () => this.executeCommand('greeting', { type: 'hello' }),
            'wake up': () => this.executeCommand('wake', {}),
            'sleep mode': () => this.executeCommand('sleep', {}),
            'help': () => this.executeCommand('help', {}),
            'what can you do': () => this.executeCommand('help', {}),
            'stop listening': () => this.executeCommand('stop', {})
        };

        // Voice settings
        this.voiceSettings = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            maxAlternatives: 3,
            confidenceThreshold: 0.6,
            voiceRate: 1.0,
            voicePitch: 1.0,
            voiceVolume: 0.8
        };

        // Audio visualization settings
        this.visualizerSettings = {
            fftSize: 256,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            frequencyBinCount: 128
        };

        this.initialize();
    }

    async initialize() {
        try {
            console.log('🎤 Initializing voice processor...');
            
            // Initialize Speech Recognition
            if ('webkitSpeechRecognition' in window) {
                this.speechRecognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                this.speechRecognition = new SpeechRecognition();
            } else {
                throw new Error('Speech recognition not supported');
            }
            
            this.setupSpeechRecognition();
            await this.setupAudioContext();
            
            console.log('✅ Voice processor initialized successfully');
            this.isInitialized = true;
            this.updateStatus('voice', true);
            
        } catch (error) {
            console.error('❌ Voice processor initialization failed:', error);
            this.showVoiceError();
            this.updateStatus('voice', false);
        }
    }

    setupSpeechRecognition() {
        if (!this.speechRecognition) return;
        
        // Configure speech recognition
        this.speechRecognition.continuous = this.voiceSettings.continuous;
        this.speechRecognition.interimResults = this.voiceSettings.interimResults;
        this.speechRecognition.maxAlternatives = this.voiceSettings.maxAlternatives;
        this.speechRecognition.lang = this.voiceSettings.language;
        
        // Event handlers
        this.speechRecognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isListening = true;
            this.updateListeningUI(true);
        };
        
        this.speechRecognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            this.isListening = false;
            this.updateListeningUI(false);
        };
        
        this.speechRecognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.handleVoiceError(event.error);
        };
        
        this.speechRecognition.onresult = (event) => {
            this.processSpeechResult(event);
        };
    }

    async setupAudioContext() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.visualizerSettings.fftSize;
            this.analyser.smoothingTimeConstant = this.visualizerSettings.smoothingTimeConstant;
            this.analyser.minDecibels = this.visualizerSettings.minDecibels;
            this.analyser.maxDecibels = this.visualizerSettings.maxDecibels;
            
            // Connect nodes
            this.microphone.connect(this.analyser);
            
            // Start audio visualization
            this.startAudioVisualization();
            
            console.log('✅ Audio context setup complete');
            
        } catch (error) {
            console.error('❌ Audio context setup failed:', error);
            throw error;
        }
    }

    startListening() {
        if (!this.isInitialized || this.isListening) return;
        
        try {
            console.log('🎯 Starting voice recognition...');
            this.speechRecognition.start();
        } catch (error) {
            console.error('❌ Failed to start voice recognition:', error);
        }
    }

    stopListening() {
        if (!this.isListening) return;
        
        try {
            console.log('⏹️ Stopping voice recognition...');
            this.speechRecognition.stop();
        } catch (error) {
            console.error('❌ Failed to stop voice recognition:', error);
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    processSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript.toLowerCase().trim();
            const confidence = result[0].confidence || 0;
            
            if (result.isFinal) {
                finalTranscript += transcript;
                
                // Update voice data
                this.voiceData.confidence = Math.round(confidence * 100);
                this.voiceData.lastCommand = transcript;
                
                console.log('🎤 Final transcript:', transcript, 'Confidence:', confidence);
                
                // Process command if confidence is high enough
                if (confidence >= this.voiceSettings.confidenceThreshold) {
                    this.processVoiceCommand(transcript);
                } else {
                    console.warn('⚠️ Low confidence, ignoring command');
                    this.showFeedback('Command confidence too low', 'warning');
                }
                
            } else {
                interimTranscript += transcript;
                this.voiceData.command = transcript;
            }
        }
        
        // Update UI with current transcript
        this.updateTranscriptUI(finalTranscript || interimTranscript);
    }

    processVoiceCommand(transcript) {
        const command = transcript.toLowerCase().trim();
        
        // Add to command history
        this.voiceData.commandHistory.push({
            command: command,
            timestamp: new Date(),
            confidence: this.voiceData.confidence
        });
        
        // Keep only last 10 commands
        if (this.voiceData.commandHistory.length > 10) {
            this.voiceData.commandHistory.shift();
        }
        
        // Check for Mr. Happy wake word or general conversation
        if (command.includes('mr happy') || command.includes('hey happy') || command.includes('hello mr happy')) {
            console.log('🎤 Mr. Happy wake word detected, activating voice and routing to assistant');
            
            // Start listening mode
            if (!this.isListening) {
                this.startListening();
            }
            
            // Route to Mr. Happy with the full command
            this.executeCommand('mr-happy-conversation', { text: command, transcript });
            return;
        }
        
        // For any other voice input, also route to Mr. Happy if he's available
        if (window.mrHappy) {
            console.log('🎤 Routing voice command to Mr. Happy:', command);
            this.executeCommand('mr-happy-conversation', { text: command, transcript });
            return;
        }
        
        // Fallback to old system for backwards compatibility
        // Find matching command
        let matchedCommand = null;
        let bestMatch = 0;
        
        for (const [key, handler] of Object.entries(this.commandMap)) {
            const similarity = this.calculateSimilarity(command, key);
            if (similarity > bestMatch && similarity > 0.7) { // 70% similarity threshold
                bestMatch = similarity;
                matchedCommand = { key, handler, similarity };
            }
        }
        
        if (matchedCommand) {
            console.log('🎯 Command matched:', matchedCommand.key, 'Similarity:', matchedCommand.similarity);
            this.showFeedback(`Command: ${matchedCommand.key}`, 'success');
            
            // Execute command
            try {
                matchedCommand.handler();
            } catch (error) {
                console.error('❌ Command execution failed:', error);
                this.showFeedback('Command execution failed', 'error');
            }
        } else {
            console.log('❓ No command matched for:', command);
            this.showFeedback(`Unrecognized command: ${command}`, 'info');
            this.handleUnknownCommand(command);
        }
    }

    executeCommand(type, params = {}) {
        console.log('🎯 Executing command:', type, params);
        
        // Add visual feedback
        this.triggerCommandAnimation();
        
        // Dispatch command event to other systems
        const event = new CustomEvent('voice-command', {
            detail: { type, params, timestamp: new Date() }
        });
        window.dispatchEvent(event);
        
        // Handle specific command types
        switch (type) {
            case 'greeting':
                this.speak('Hello! How can I assist you today?');
                break;
                
            case 'help':
                this.speak('I can help you with payments, token operations, authentication, and navigation. What would you like to do?');
                break;
                
            case 'navigate':
                this.speak(`Navigating to ${params.target}`);
                break;
                
            case 'mint':
                this.speak('Opening token minting interface');
                break;
                
            case 'burn':
                this.speak('Opening token burning interface');
                break;
                
            case 'transfer':
                this.speak('Opening transfer interface');
                break;
                
            case 'upi':
                this.speak(`Initiating UPI ${params.action} operation`);
                break;
                
            case 'biometric':
                this.speak(`${params.action} biometric authentication`);
                break;
                
            case 'wake':
                this.speak('I am awake and ready to assist you');
                break;
                
            case 'sleep':
                this.speak('Entering sleep mode. Say wake up to reactivate');
                this.stopListening();
                break;
                
            case 'stop':
                this.speak('Stopping voice recognition');
                this.stopListening();
                break;
                
            case 'mr-happy-conversation':
                // Route to Mr. Happy for conversation
                if (window.mrHappy) {
                    window.mrHappy.handleVoiceCommand(params);
                } else {
                    this.speak('Mr. Happy is not available right now');
                }
                break;
                
            default:
                this.speak('Command received but not yet implemented');
        }
    }

    handleUnknownCommand(command) {
        // Try to suggest similar commands
        const suggestions = this.getSuggestedCommands(command);
        
        if (suggestions.length > 0) {
            const suggestion = suggestions[0];
            this.speak(`Did you mean: ${suggestion}?`);
        } else {
            this.speak("I didn't understand that command. Say 'help' to see available commands.");
        }
    }

    getSuggestedCommands(input) {
        const commands = Object.keys(this.commandMap);
        const suggestions = [];
        
        for (const command of commands) {
            const similarity = this.calculateSimilarity(input, command);
            if (similarity > 0.4) { // 40% similarity for suggestions
                suggestions.push({ command, similarity });
            }
        }
        
        return suggestions
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(s => s.command);
    }

    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const distance = matrix[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        
        return 1 - (distance / maxLength);
    }

    speak(text, options = {}) {
        if (this.isSpeaking) {
            this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = options.rate || this.voiceSettings.voiceRate;
        utterance.pitch = options.pitch || this.voiceSettings.voicePitch;
        utterance.volume = options.volume || this.voiceSettings.voiceVolume;
        utterance.lang = options.lang || this.voiceSettings.language;
        
        // Select preferred voice
        const voices = this.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.lang === utterance.lang && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang === utterance.lang);
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speech synthesis started:', text);
            this.isSpeaking = true;
            this.updateSpeakingUI(true);
            this.triggerAvatarSpeech(text);
        };
        
        utterance.onend = () => {
            console.log('🔊 Speech synthesis ended');
            this.isSpeaking = false;
            this.updateSpeakingUI(false);
        };
        
        utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateSpeakingUI(false);
        };
        
        // Speak the text
        this.speechSynthesis.speak(utterance);
    }

    startAudioVisualization() {
        if (!this.analyser || !this.voiceCtx) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            this.voiceData.volume = Math.round((average / 255) * 100);
            this.voiceData.isActive = average > 10; // Voice activity threshold
            
            // Draw visualization
            this.drawVoiceVisualization(dataArray, bufferLength);
            
            // Update UI
            this.updateVoiceUI();
        };
        
        draw();
    }

    drawVoiceVisualization(dataArray, bufferLength) {
        if (!this.voiceCtx || !this.voiceVisualizerCanvas) return;
        
        const canvas = this.voiceVisualizerCanvas;
        const ctx = this.voiceCtx;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw frequency bars
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#00D4FF');
        gradient.addColorStop(0.5, '#0095FF');
        gradient.addColorStop(1, '#0051D5');
        
        ctx.fillStyle = gradient;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * height;
            
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        // Draw waveform overlay
        this.drawWaveform(dataArray, bufferLength);
    }

    drawWaveform(dataArray, bufferLength) {
        const canvas = this.voiceVisualizerCanvas;
        const ctx = this.voiceCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FD79A8';
        ctx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }

    updateVoiceUI() {
        // Update volume indicator
        const volumeEl = document.getElementById('voiceVolume');
        if (volumeEl) {
            volumeEl.textContent = `${this.voiceData.volume}%`;
            volumeEl.style.color = this.getVolumeColor(this.voiceData.volume);
        }
        
        // Update voice activity indicator
        const activityEl = document.getElementById('voiceActivity');
        if (activityEl) {
            activityEl.textContent = this.voiceData.isActive ? 'Active' : 'Inactive';
            activityEl.classList.toggle('active', this.voiceData.isActive);
        }
    }

    updateListeningUI(isListening) {
        const micButton = document.getElementById('micButton');
        const commandDisplay = document.getElementById('currentCommand');
        
        if (micButton) {
            micButton.classList.toggle('listening', isListening);
            micButton.title = isListening ? 'Stop listening' : 'Start listening';
        }
        
        if (commandDisplay && !isListening) {
            commandDisplay.textContent = 'Say a command...';
        }
    }

    updateSpeakingUI(isSpeaking) {
        const avatar = document.getElementById('avatar');
        if (avatar) {
            avatar.classList.toggle('speaking', isSpeaking);
        }
    }

    updateTranscriptUI(transcript) {
        const commandDisplay = document.getElementById('currentCommand');
        if (commandDisplay) {
            commandDisplay.textContent = transcript || 'Listening...';
        }
    }

    triggerCommandAnimation() {
        const commandInterface = document.getElementById('commandInterface');
        if (commandInterface) {
            commandInterface.classList.add('command-triggered');
            setTimeout(() => {
                commandInterface.classList.remove('command-triggered');
            }, 1000);
        }
    }

    triggerAvatarSpeech(text) {
        // Trigger lip sync animation on Mr. Happy avatar
        const event = new CustomEvent('avatar-speak', {
            detail: { text, duration: text.length * 100 }
        });
        window.dispatchEvent(event);
    }

    handleVoiceError(error) {
        let message = 'Voice recognition error';
        
        switch (error) {
            case 'no-speech':
                message = 'No speech detected';
                break;
            case 'audio-capture':
                message = 'Audio capture failed';
                break;
            case 'not-allowed':
                message = 'Microphone access denied';
                break;
            case 'network':
                message = 'Network error during recognition';
                break;
            default:
                message = `Voice error: ${error}`;
        }
        
        console.error('❌', message);
        this.showFeedback(message, 'error');
    }

    showVoiceError() {
        const voiceSection = document.querySelector('.voice-controls');
        if (voiceSection) {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b; background: rgba(255,107,107,0.1); border-radius: 10px; margin: 10px 0;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">🎤</div>
                    <div>Voice recognition unavailable</div>
                    <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 5px;">Check microphone permissions</div>
                </div>
            `;
            voiceSection.appendChild(errorDiv);
        }
    }

    showFeedback(message, type = 'info') {
        // Create and show notification
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            timestamp: new Date()
        };
        
        const event = new CustomEvent('show-notification', { detail: notification });
        window.dispatchEvent(event);
    }

    updateStatus(system, isActive) {
        const statusEl = document.getElementById(`${system}Status`);
        if (statusEl) {
            const dot = statusEl.querySelector('.status-dot');
            if (dot) {
                dot.classList.toggle('active', isActive);
                dot.classList.toggle('inactive', !isActive);
            }
        }
    }

    getVolumeColor(volume) {
        if (volume > 60) return '#00B894'; // High volume - green
        if (volume > 30) return '#00D4FF'; // Medium volume - blue
        return '#FD79A8'; // Low volume - pink
    }

    // Public API methods
    getCurrentVoiceData() {
        return { ...this.voiceData };
    }

    isCurrentlyListening() {
        return this.isListening;
    }

    isCurrentlySpeaking() {
        return this.isSpeaking;
    }

    addCustomCommand(command, handler) {
        this.commandMap[command.toLowerCase()] = handler;
        console.log('➕ Custom command added:', command);
    }

    removeCustomCommand(command) {
        delete this.commandMap[command.toLowerCase()];
        console.log('➖ Custom command removed:', command);
    }

    getAvailableCommands() {
        return Object.keys(this.commandMap);
    }

    setVoiceSettings(settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
        console.log('⚙️ Voice settings updated:', settings);
    }
}

// Initialize voice processor
window.voiceProcessor = new VoiceProcessor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceProcessor;
}