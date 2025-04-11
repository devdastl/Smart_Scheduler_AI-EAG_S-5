/**
 * Voice Recognition Manager for NoteTaker
 * This uses the Web Speech API for speech-to-text functionality
 */

class VoiceRecognitionManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.voiceButton = document.getElementById('voice-input');
        this.textInput = document.getElementById('smart-input');
        this.initSpeechRecognition();
        this.addEventListeners();
    }

    /**
     * Initialize speech recognition
     */
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            this.voiceButton.style.display = 'none';
            return;
        }

        // Create speech recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // Handle results
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            // Get the current value of the textarea
            let currentText = this.textInput.value;
            
            // Check if it ends with a space
            const needsSpace = currentText.length > 0 && !currentText.endsWith(' ');

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Add final transcript to input
            if (finalTranscript !== '') {
                // Add a space between existing text and new text if needed
                if (needsSpace && currentText.length > 0) {
                    currentText += ' ';
                }
                
                // Append the final transcript
                this.textInput.value = currentText + finalTranscript;
            }
        };

        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
        };

        // Handle end of recognition
        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        if (!this.voiceButton) return;

        this.voiceButton.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
    }

    /**
     * Start listening for speech
     */
    startListening() {
        if (!this.recognition) return;

        try {
            this.recognition.start();
            this.isListening = true;
            this.updateButtonState();
            console.log('Voice recognition started');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }

    /**
     * Stop listening for speech
     */
    stopListening() {
        if (!this.recognition) return;

        try {
            this.recognition.stop();
            this.isListening = false;
            this.updateButtonState();
            console.log('Voice recognition stopped');
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }

    /**
     * Update the button state based on listening status
     */
    updateButtonState() {
        if (!this.voiceButton) return;

        if (this.isListening) {
            this.voiceButton.classList.add('active');
            this.voiceButton.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        } else {
            this.voiceButton.classList.remove('active');
            this.voiceButton.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        }
    }
}

// Initialize voice recognition when DOM is loaded
let voiceManager;
document.addEventListener('DOMContentLoaded', () => {
    voiceManager = new VoiceRecognitionManager();
}); 