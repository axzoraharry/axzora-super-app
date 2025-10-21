/**
 * Avatar Controller - 3D Animated Mr. Happy Avatar with Expressions and Lip Sync
 * Axzora Super App - AI Avatar System
 */

class AvatarController {
    constructor() {
        this.isInitialized = false;
        this.avatar = document.getElementById('avatar');
        this.leftEye = document.getElementById('leftEye');
        this.rightEye = document.getElementById('rightEye');
        this.mouth = document.getElementById('mouth');
        this.face = document.getElementById('face');
        
        // Animation states
        this.currentExpression = 'neutral';
        this.isBlinking = false;
        this.isSpeaking = false;
        this.eyeDirection = { x: 0, y: 0 };
        this.blinkInterval = null;
        this.speakingAnimation = null;
        this.expressionTimeout = null;
        
        // Avatar data
        this.avatarData = {
            mood: 'happy',
            energy: 100,
            attention: 'center',
            lastInteraction: null,
            expressionHistory: ['neutral']
        };
        
        // Expression configurations
        this.expressions = {
            neutral: {
                mouth: { width: '20px', height: '8px', borderRadius: '50%', background: 'var(--accent-pink)' },
                eyes: { transform: 'scale(1)', background: 'var(--primary-blue)' },
                eyebrows: { top: '25%' },
                duration: 0
            },
            happy: {
                mouth: { width: '30px', height: '15px', borderRadius: '15px 15px 50px 50px', background: 'var(--success-green)' },
                eyes: { transform: 'scale(1.1)', background: 'var(--primary-blue)' },
                eyebrows: { top: '20%' },
                duration: 2000
            },
            surprised: {
                mouth: { width: '15px', height: '15px', borderRadius: '50%', background: 'var(--warning-yellow)' },
                eyes: { transform: 'scale(1.3)', background: 'var(--primary-blue)' },
                eyebrows: { top: '15%' },
                duration: 3000
            },
            thinking: {
                mouth: { width: '25px', height: '6px', borderRadius: '50%', background: 'var(--accent-pink)' },
                eyes: { transform: 'scale(0.9)', background: 'var(--primary-blue)' },
                eyebrows: { top: '22%' },
                duration: 1500
            },
            speaking: {
                mouth: { width: '25px', height: '12px', borderRadius: '25px', background: 'var(--accent-pink)' },
                eyes: { transform: 'scale(1)', background: 'var(--primary-blue)' },
                eyebrows: { top: '25%' },
                duration: 0
            },
            listening: {
                mouth: { width: '18px', height: '6px', borderRadius: '50%', background: 'var(--accent-pink)' },
                eyes: { transform: 'scale(1.05)', background: 'var(--success-green)' },
                eyebrows: { top: '23%' },
                duration: 0
            },
            processing: {
                mouth: { width: '22px', height: '8px', borderRadius: '50%', background: 'var(--warning-yellow)' },
                eyes: { transform: 'scale(1)', background: 'var(--warning-yellow)' },
                eyebrows: { top: '25%' },
                duration: 0
            }
        };
        
        // Lip sync patterns for phonemes
        this.lipSyncPatterns = {
            'a': { width: '25px', height: '20px', borderRadius: '50%' },
            'e': { width: '28px', height: '15px', borderRadius: '30px' },
            'i': { width: '15px', height: '8px', borderRadius: '20px' },
            'o': { width: '20px', height: '20px', borderRadius: '50%' },
            'u': { width: '12px', height: '12px', borderRadius: '50%' },
            'consonant': { width: '22px', height: '6px', borderRadius: '50%' },
            'silence': { width: '20px', height: '4px', borderRadius: '50%' }
        };
        
        // Animation timing
        this.timings = {
            blink: 200,
            expression: 500,
            eyeMovement: 300,
            lipSync: 100,
            idle: 3000
        };
        
        this.initialize();
    }

    initialize() {
        console.log('🤖 Initializing Mr. Happy avatar...');
        
        try {
            this.setupEventListeners();
            this.startIdleAnimations();
            this.setExpression('happy'); // Default happy expression
            
            console.log('✅ Avatar controller initialized successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Avatar controller initialization failed:', error);
        }
    }

    setupEventListeners() {
        // Listen for biometric events
        window.addEventListener('user-authenticated', (event) => {
            this.handleUserAuthenticated(event.detail);
        });
        
        // Listen for voice events
        window.addEventListener('voice-command', (event) => {
            this.handleVoiceCommand(event.detail);
        });
        
        // Listen for avatar speech events
        window.addEventListener('avatar-speak', (event) => {
            this.startSpeaking(event.detail);
        });
        
        // Listen for biometric data updates
        if (window.biometricMonitor) {
            // Sync eye movement with user's eye movement
            setInterval(() => {
                const biometricData = window.biometricMonitor.getCurrentBiometricData();
                if (biometricData.eyeMovement !== 'not detected') {
                    this.updateEyeDirection(biometricData.eyeMovement);
                }
                
                // Sync expressions with user expressions
                if (biometricData.expression !== this.currentExpression) {
                    this.reactToUserExpression(biometricData.expression);
                }
            }, 500);
        }
        
        // Listen for voice activity
        if (window.voiceProcessor) {
            setInterval(() => {
                const voiceData = window.voiceProcessor.getCurrentVoiceData();
                if (voiceData.isActive && !this.isSpeaking) {
                    this.setExpression('listening');
                } else if (!voiceData.isActive && !this.isSpeaking && this.currentExpression === 'listening') {
                    this.setExpression('neutral');
                }
            }, 200);
        }
        
        // Mouse interaction for eye tracking
        document.addEventListener('mousemove', (event) => {
            this.trackMouse(event);
        });
        
        // Click interaction
        this.avatar?.addEventListener('click', () => {
            this.handleAvatarClick();
        });
    }

    handleUserAuthenticated(user) {
        console.log('👋 User authenticated, greeting user');
        this.setExpression('happy');
        
        // Welcome animation
        setTimeout(() => {
            this.performWelcomeAnimation();
        }, 500);
    }

    handleVoiceCommand(command) {
        console.log('🎤 Voice command received:', command);
        
        // React to different command types
        switch (command.type) {
            case 'greeting':
                this.setExpression('happy');
                this.performWaveAnimation();
                break;
                
            case 'help':
                this.setExpression('thinking');
                break;
                
            case 'mint':
            case 'burn':
            case 'transfer':
                this.setExpression('processing');
                break;
                
            case 'biometric':
                this.setExpression('surprised');
                break;
                
            case 'wake':
                this.performWakeUpAnimation();
                break;
                
            case 'sleep':
                this.performSleepAnimation();
                break;
                
            default:
                this.setExpression('thinking');
        }
    }

    setExpression(expressionName, duration = null) {
        if (!this.expressions[expressionName] || this.currentExpression === expressionName) return;
        
        console.log('😊 Setting expression:', expressionName);
        
        const expression = this.expressions[expressionName];
        const animationDuration = duration || expression.duration || this.timings.expression;
        
        // Apply mouth changes
        if (this.mouth && expression.mouth) {
            Object.assign(this.mouth.style, expression.mouth);
        }
        
        // Apply eye changes
        if (this.leftEye && this.rightEye && expression.eyes) {
            Object.assign(this.leftEye.style, expression.eyes);
            Object.assign(this.rightEye.style, expression.eyes);
        }
        
        // Apply eyebrow changes (if elements exist)
        const leftEyebrow = document.getElementById('leftEyebrow');
        const rightEyebrow = document.getElementById('rightEyebrow');
        if (leftEyebrow && rightEyebrow && expression.eyebrows) {
            Object.assign(leftEyebrow.style, expression.eyebrows);
            Object.assign(rightEyebrow.style, expression.eyebrows);
        }
        
        this.currentExpression = expressionName;
        this.avatarData.lastInteraction = new Date();
        
        // Add to expression history
        this.avatarData.expressionHistory.push(expressionName);
        if (this.avatarData.expressionHistory.length > 10) {
            this.avatarData.expressionHistory.shift();
        }
        
        // Trigger avatar animation class
        this.avatar?.classList.add(`expression-${expressionName}`);
        
        // Reset to neutral after duration (unless it's a permanent state)
        if (animationDuration > 0) {
            if (this.expressionTimeout) {
                clearTimeout(this.expressionTimeout);
            }
            
            this.expressionTimeout = setTimeout(() => {
                if (this.currentExpression === expressionName) {
                    this.setExpression('neutral');
                }
                this.avatar?.classList.remove(`expression-${expressionName}`);
            }, animationDuration);
        }
    }

    reactToUserExpression(userExpression) {
        // Mirror or react to user's expression
        switch (userExpression) {
            case 'happy':
                this.setExpression('happy', 2000);
                break;
            case 'sad':
                this.setExpression('thinking', 1500);
                break;
            case 'surprised':
                this.setExpression('surprised', 2000);
                break;
            default:
                // Stay neutral for unknown expressions
                break;
        }
    }

    updateEyeDirection(direction) {
        if (!this.leftEye || !this.rightEye) return;
        
        let eyeX = 0, eyeY = 0;
        
        // Parse direction string into coordinates
        switch (direction) {
            case 'looking left':
                eyeX = -2;
                break;
            case 'looking right':
                eyeX = 2;
                break;
            case 'looking up':
                eyeY = -2;
                break;
            case 'looking down':
                eyeY = 2;
                break;
            case 'center':
            default:
                eyeX = 0;
                eyeY = 0;
        }
        
        // Apply eye movement with smooth transition
        const transform = `translate(${eyeX}px, ${eyeY}px)`;
        
        this.leftEye.style.transform = transform;
        this.rightEye.style.transform = transform;
        
        this.eyeDirection = { x: eyeX, y: eyeY };
    }

    trackMouse(event) {
        if (!this.avatar || this.isSpeaking) return;
        
        const rect = this.avatar.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate relative mouse position
        const deltaX = (event.clientX - centerX) / rect.width;
        const deltaY = (event.clientY - centerY) / rect.height;
        
        // Limit eye movement range
        const maxMovement = 3;
        const eyeX = Math.max(-maxMovement, Math.min(maxMovement, deltaX * 10));
        const eyeY = Math.max(-maxMovement, Math.min(maxMovement, deltaY * 10));
        
        // Apply smooth eye movement
        if (this.leftEye && this.rightEye) {
            const transform = `translate(${eyeX}px, ${eyeY}px)`;
            
            this.leftEye.style.transition = 'transform 0.3s ease';
            this.rightEye.style.transition = 'transform 0.3s ease';
            
            this.leftEye.style.transform = transform;
            this.rightEye.style.transform = transform;
        }
    }

    startBlinking() {
        if (this.blinkInterval) return;
        
        // Random blink interval between 2-6 seconds
        const blinkFrequency = 2000 + Math.random() * 4000;
        
        this.blinkInterval = setInterval(() => {
            this.blink();
        }, blinkFrequency);
    }

    stopBlinking() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
    }

    blink() {
        if (this.isBlinking || !this.leftEye || !this.rightEye) return;
        
        this.isBlinking = true;
        
        // Add blink class for CSS animation
        this.leftEye.classList.add('blink');
        this.rightEye.classList.add('blink');
        
        setTimeout(() => {
            this.leftEye.classList.remove('blink');
            this.rightEye.classList.remove('blink');
            this.isBlinking = false;
        }, this.timings.blink);
    }

    startSpeaking(speechData) {
        if (!speechData || this.isSpeaking) return;
        
        console.log('🗣️ Avatar started speaking:', speechData.text);
        
        this.isSpeaking = true;
        this.setExpression('speaking');
        
        // Perform lip sync animation
        this.performLipSync(speechData.text, speechData.duration || speechData.text.length * 100);
    }

    stopSpeaking() {
        if (!this.isSpeaking) return;
        
        console.log('🤐 Avatar stopped speaking');
        
        this.isSpeaking = false;
        
        if (this.speakingAnimation) {
            clearInterval(this.speakingAnimation);
            this.speakingAnimation = null;
        }
        
        // Return to neutral expression
        this.setExpression('neutral');
    }

    performLipSync(text, duration) {
        if (!this.mouth || !text) return;
        
        // Simple phoneme-based lip sync
        const words = text.toLowerCase().split(' ');
        const totalWords = words.length;
        const wordDuration = duration / totalWords;
        
        let wordIndex = 0;
        
        this.speakingAnimation = setInterval(() => {
            if (wordIndex >= totalWords) {
                this.stopSpeaking();
                return;
            }
            
            const word = words[wordIndex];
            const phoneme = this.getPhonemeForWord(word);
            const pattern = this.lipSyncPatterns[phoneme] || this.lipSyncPatterns['consonant'];
            
            // Apply lip sync pattern
            Object.assign(this.mouth.style, pattern);
            
            wordIndex++;
        }, wordDuration);
    }

    getPhonemeForWord(word) {
        // Simplified phoneme detection based on vowels
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const primaryVowel = word.split('').find(char => vowels.includes(char));
        
        return primaryVowel || 'consonant';
    }

    performWelcomeAnimation() {
        // Sequence of expressions for welcome
        this.setExpression('happy', 1000);
        
        setTimeout(() => {
            this.performWaveAnimation();
        }, 500);
    }

    performWaveAnimation() {
        // Add wave animation class
        this.avatar?.classList.add('wave-animation');
        
        setTimeout(() => {
            this.avatar?.classList.remove('wave-animation');
        }, 2000);
    }

    performWakeUpAnimation() {
        // Simulate waking up
        this.setExpression('surprised', 1000);
        
        setTimeout(() => {
            this.setExpression('happy', 2000);
        }, 1000);
    }

    performSleepAnimation() {
        // Simulate going to sleep
        this.setExpression('thinking', 1000);
        
        setTimeout(() => {
            this.setExpression('neutral');
            
            // Slow blinking effect
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.blink();
                }, i * 800);
            }
        }, 1000);
    }

    handleAvatarClick() {
        console.log('👆 Avatar clicked');
        
        // Cycle through expressions
        const expressions = ['happy', 'surprised', 'thinking'];
        const currentIndex = expressions.indexOf(this.currentExpression);
        const nextExpression = expressions[(currentIndex + 1) % expressions.length];
        
        this.setExpression(nextExpression, 2000);
        
        // Add click animation
        this.avatar?.classList.add('click-animation');
        
        setTimeout(() => {
            this.avatar?.classList.remove('click-animation');
        }, 500);
    }

    startIdleAnimations() {
        // Start blinking
        this.startBlinking();
        
        // Random idle expressions
        const idleExpressions = ['thinking', 'happy', 'neutral'];
        
        setInterval(() => {
            if (!this.isSpeaking && this.currentExpression === 'neutral') {
                const randomExpression = idleExpressions[Math.floor(Math.random() * idleExpressions.length)];
                this.setExpression(randomExpression, 1500);
            }
        }, 10000); // Every 10 seconds
        
        // Random eye movements when idle
        setInterval(() => {
            if (!this.isSpeaking && Math.random() > 0.7) {
                const directions = ['looking left', 'looking right', 'center'];
                const randomDirection = directions[Math.floor(Math.random() * directions.length)];
                this.updateEyeDirection(randomDirection);
            }
        }, 3000); // Every 3 seconds
    }

    updateMood(mood) {
        this.avatarData.mood = mood;
        
        // Adjust default expressions based on mood
        switch (mood) {
            case 'excited':
                this.setExpression('happy', 3000);
                break;
            case 'focused':
                this.setExpression('thinking', 2000);
                break;
            case 'relaxed':
                this.setExpression('neutral');
                break;
            default:
                this.setExpression('happy');
        }
        
        console.log('😊 Avatar mood updated:', mood);
    }

    updateEnergy(level) {
        this.avatarData.energy = Math.max(0, Math.min(100, level));
        
        // Adjust animation speed based on energy
        const energyFactor = this.avatarData.energy / 100;
        const animationSpeed = 0.5 + (energyFactor * 0.5); // 0.5x to 1x speed
        
        if (this.avatar) {
            this.avatar.style.animationDuration = `${3 / animationSpeed}s`;
        }
        
        console.log('⚡ Avatar energy updated:', level);
    }

    // Public API methods
    getCurrentExpression() {
        return this.currentExpression;
    }

    getAvatarData() {
        return { ...this.avatarData };
    }

    forceExpression(expression, duration = 2000) {
        this.setExpression(expression, duration);
    }

    resetToNeutral() {
        this.setExpression('neutral');
    }

    isCurrentlySpeaking() {
        return this.isSpeaking;
    }

    addCustomExpression(name, config) {
        this.expressions[name] = config;
        console.log('➕ Custom expression added:', name);
    }

    removeCustomExpression(name) {
        if (this.expressions[name] && name !== 'neutral') {
            delete this.expressions[name];
            console.log('➖ Custom expression removed:', name);
        }
    }

    getAvailableExpressions() {
        return Object.keys(this.expressions);
    }
}

// Initialize avatar controller
window.avatarController = new AvatarController();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarController;
}