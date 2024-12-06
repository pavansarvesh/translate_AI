import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

class TanglishTranslator {
  constructor() {
    this.API_KEY = 'AIzaSyBOqdaNPMceVxMolYYLF31J7AfF-20FbCI';
    this.genAI = new GoogleGenerativeAI(this.API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-latest',
    });
    this.uploadedFile = null;

    // Learning Storage
    this.translationMemory = this.loadTranslationMemory();
    this.pdfContexts = this.loadPDFContexts();

    this.initializeElements();
    this.attachEventListeners();
  }

  // Local Storage Management
  loadTranslationMemory() {
    const memory = localStorage.getItem('tanglishTranslationMemory');
    return memory
      ? JSON.parse(memory)
      : {
          corrections: [],
          successfulTranslations: [],
        };
  }

  saveTranslationMemory() {
    localStorage.setItem(
      'tanglishTranslationMemory',
      JSON.stringify(this.translationMemory)
    );
  }

  loadPDFContexts() {
    const contexts = localStorage.getItem('tanglishPDFContexts');
    return contexts ? JSON.parse(contexts) : [];
  }

  savePDFContexts() {
    localStorage.setItem(
      'tanglishPDFContexts',
      JSON.stringify(this.pdfContexts)
    );
  }

  initializeElements() {
    this.fileInput = document.getElementById('pdfUpload');
    this.filePreview = document.getElementById('filePreview');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendBtn');
    this.chatMessages = document.getElementById('chatMessages');
    this.correctionInput = document.getElementById('correctionInput');
    this.submitCorrectionBtn = document.getElementById('submitCorrectionBtn');
    this.currentTranslation = null;
  }

  attachEventListeners() {
    this.fileInput.addEventListener('change', () => this.handleFileUpload());
    this.sendButton.addEventListener('click', () => this.translateToTanglish());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.translateToTanglish();
    });
    this.submitCorrectionBtn.addEventListener('click', () =>
      this.handleTranslationCorrection()
    );
  }

  async handleTranslationCorrection() {
    const correction = this.correctionInput.value.trim();
    if (!correction || !this.currentTranslation) return;

    // Store the correction
    this.translationMemory.corrections.push({
      original: this.currentTranslation.original,
      aiTranslation: this.currentTranslation.aiTranslation,
      humanCorrection: correction,
      timestamp: new Date().toISOString(),
    });

    // Save to local storage
    this.saveTranslationMemory();

    // Add correction message
    this.addChatMessage('System', `Correction learned: "${correction}"`);

    // Clear correction input
    this.correctionInput.value = '';

    // Try to learn from the correction
    await this.learnFromCorrection(correction);
  }

  async learnFromCorrection(correction) {
    try {
      // Prepare a learning prompt
      const learningPrompt = `A translation was corrected.
                    Original English: "${this.currentTranslation.original}"
                    AI's Translation: "${this.currentTranslation.aiTranslation}"
                    Human Correction: "${correction}"

                    Analyze the differences and improve your translation capabilities for future inputs.`;

      // Generate learning insights
      const result = await this.model.generateContent(learningPrompt);
      const learningInsights = result.response.text();

      // Store learning insights
      this.translationMemory.successfulTranslations.push({
        original: this.currentTranslation.original,
        correctedTranslation: correction,
        learningInsights: learningInsights,
      });

      // Save updated memory
      this.saveTranslationMemory();

      // Optionally display insights
      this.addChatMessage('System', `Learning Insights: ${learningInsights}`);
    } catch (error) {
      console.error('Learning Error:', error);
    }
  }

  handleFileUpload() {
    const file = this.fileInput.files[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files');
      this.fileInput.value = '';
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
      this.uploadedFile = {
        name: file.name,
        content: e.target.result.split(',')[1], // base64 content
        uploadedAt: new Date().toISOString(),
      };

      // Update file preview
      this.filePreview.innerHTML = `
                        <div class="file-preview">
                            <strong>Uploaded PDF:</strong> ${file.name}<br>
                            <strong>Ready for Tanglish Translation</strong>
                        </div>
                    `;

      // Analyze and store PDF context
      await this.analyzePDF();
    };
    reader.readAsDataURL(file);
  }

  async analyzePDF() {
    if (!this.uploadedFile) {
      this.addChatMessage('System', 'Please upload a PDF first.');
      return;
    }

    try {
      const loadingMessage = this.addChatMessage('System', 'Analyzing PDF...');

      // Prepare initial analysis prompt
      const analysisPrompt = `Analyze this PDF and extract key insights about English to Tanglish translation.
                    Identify translation patterns, linguistic nuances, and context-specific translation rules.`;

      // Generate content with PDF
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: this.uploadedFile.content,
          },
        },
        analysisPrompt,
      ]);

      // Extract analysis results
      const pdfContext = {
        fileName: this.uploadedFile.name,
        uploadedAt: this.uploadedFile.uploadedAt,
        analysisInsights: result.response.text(),
      };

      // Store PDF context
      this.pdfContexts.push(pdfContext);
      this.savePDFContexts();

      // Remove loading message
      this.chatMessages.removeChild(loadingMessage);

      // Add analysis result
      this.addChatMessage('AI', 'PDF analyzed and context stored.');
    } catch (error) {
      console.error('PDF Analysis Error:', error);
      this.addChatMessage('System', `Analysis Error: ${error.message}`);
    }
  }

  async translateToTanglish() {
    const englishText = this.chatInput.value.trim();
    if (!englishText) return;

    // Add user message
    this.addChatMessage('You', englishText);
    this.chatInput.value = '';

    try {
      // Show loading
      const loadingMessage = this.addChatMessage('System', 'Translating...');

      // Incorporate learned corrections in translation
      let translationPrompt = this.buildTranslationPrompt(englishText);

      // Generate Tanglish translation
      const result = await this.model.generateContent([translationPrompt]);

      // Remove loading message
      this.chatMessages.removeChild(loadingMessage);

      // Add translation
      const tanglishTranslation = result.response.text();
      this.addChatMessage('AI', `Tanglish: ${tanglishTranslation}`);

      // Store current translation for potential correction
      this.currentTranslation = {
        original: englishText,
        aiTranslation: tanglishTranslation,
      };
    } catch (error) {
      console.error('Translation Error:', error);
      this.addChatMessage('System', `Translation Error: ${error.message}`);
    }
  }

  buildTranslationPrompt(englishText) {
    let translationPrompt = `Translate the following English text to Tanglish. Use the most accurate and contextually appropriate translation.`;

    // Add recent corrections as context
    if (this.translationMemory.corrections.length > 0) {
      const recentCorrections = this.translationMemory.corrections
        .slice(-3) // Take last 3 corrections
        .map(
          (correction) =>
            `Original: ${correction.original}
                             AI Translation: ${correction.aiTranslation}
                             Correct Translation: ${correction.humanCorrection}`
        )
        .join('\n\n');

      translationPrompt += `\n\nConsider these recent translation corrections:\n${recentCorrections}`;
    }

    translationPrompt += `\n\nEnglish: "${englishText}"\nTanglish Translation:`;

    return translationPrompt;
  }

  addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender.toLowerCase());
    messageElement.innerHTML = `
                    <strong>${sender}:</strong>
                    <span>${message}</span>
                `;
    this.chatMessages.appendChild(messageElement);

    // Scroll to bottom of chat
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    return messageElement;
  }
}

window.addEventListener('load', () => new TanglishTranslator());
