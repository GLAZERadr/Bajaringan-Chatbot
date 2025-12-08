/**
 * BARI Chatbot Widget
 * Floating Action Button with Auto-show Bubble
 * Version: 2.1.0
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    chatbotUrl: 'https://bajaringan-chatbot.vercel.app/chat',
    bariIconUrl: 'https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif',
    bariStaticIconUrl: 'https://bajaringan.com/wp-content/uploads/2025/12/BARI-scaled.png',
    bubbleDelay: 10000, // 10 seconds
    bubbleDuration: 3000, // 3 seconds
    bubbleText: 'Butuh hitung & cek atap? Klik Bari.',
    headerTitle: 'BARI',
    headerSubtitle: 'Asisten Atap & Baja Ringan'
  };

  // ============================================
  // STYLES
  // ============================================
  const styles = `
    /* Floating Action Button */
    .bari-fab {
      position: fixed !important;
      bottom: 140px !important;
      right: 30px !important;
      width: 80px !important;
      height: 80px !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      z-index: 9998 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: none !important;
      outline: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .bari-fab:hover {
      transform: scale(1.1) !important;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2)) !important;
    }

    .bari-fab:active {
      transform: scale(0.95) !important;
    }

    .bari-fab img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      pointer-events: none !important;
      display: block !important;
    }

    /* Pulse Animation */
    @keyframes bari-pulse {
      0% {
        filter: drop-shadow(0 0 0 rgba(253, 185, 19, 0));
      }
      50% {
        filter: drop-shadow(0 0 20px rgba(253, 185, 19, 0.6));
      }
      100% {
        filter: drop-shadow(0 0 0 rgba(253, 185, 19, 0));
      }
    }

    .bari-fab.pulse {
      animation: bari-pulse 2s ease-in-out infinite !important;
    }

    /* Speech Bubble */
    .bari-bubble {
      position: fixed;
      bottom: 235px;
      right: 30px;
      background: white;
      padding: 14px 18px 14px 16px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 240px;
      z-index: 9997;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .bari-bubble.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Bubble Arrow */
    .bari-bubble::after {
      content: '';
      position: absolute;
      bottom: -10px;
      right: 32px;
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .bari-bubble-text {
      margin: 0;
      padding-right: 24px;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      font-weight: 500;
    }

    .bari-bubble-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      transition: all 0.2s;
    }

    .bari-bubble-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .bari-bubble-close svg {
      width: 14px;
      height: 14px;
    }

    /* Modal Overlay */
    .bari-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .bari-modal-overlay.active {
      display: flex;
      opacity: 1;
    }

    /* Modal Container */
    .bari-modal {
      position: fixed;
      bottom: 235px;
      right: 30px;
      width: 420px;
      max-width: calc(100vw - 60px);
      height: 640px;
      max-height: calc(100vh - 255px);
      background: white;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(30px) scale(0.9);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bari-modal.active {
      display: flex;
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* Modal Header */
    .bari-modal-header {
      background: linear-gradient(135deg, #2E3A59 0%, #52689F 100%);
      color: white;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: none;
    }

    .bari-modal-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bari-modal-header-icon {
      width: 48px;
      height: 48px;
      background: transparent;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      box-shadow: none;
    }

    .bari-modal-header-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .bari-modal-header-text h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .bari-modal-header-text p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    .bari-modal-close {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
      transition: all 0.2s;
      flex-shrink: 0;
      padding: 8px;
    }

    .bari-modal-close:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.1);
    }

    .bari-modal-close svg {
      width: 24px;
      height: 24px;
      fill: white;
      stroke: white;
      stroke-width: 2;
    }

    /* Modal Body (iframe container) */
    .bari-modal-body {
      flex: 1;
      position: relative;
      background: #f9fafb;
      overflow: hidden;
      min-height: 0;
    }

    .bari-modal-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Loading State */
    .bari-modal-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      z-index: 1;
    }

    .bari-modal-loading.hidden {
      display: none;
    }

    .bari-spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #e5e7eb;
      border-top-color: #FDB913;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .bari-loading-text {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .bari-modal {
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 85vh !important;
        max-height: 85vh !important;
        border-radius: 20px 20px 0 0 !important;
      }

      .bari-fab {
        bottom: 120px !important;
        right: 20px !important;
        width: 68px !important;
        height: 68px !important;
      }

      .bari-bubble {
        bottom: 200px !important;
        right: 20px !important;
        max-width: calc(100vw - 120px);
      }

      .bari-bubble::after {
        right: 24px;
      }
    }

    @media (max-width: 480px) {
      .bari-modal {
        height: 90vh !important;
        max-height: 90vh !important;
      }

      .bari-fab {
        width: 62px !important;
        height: 62px !important;
        bottom: 100px !important;
        right: 16px !important;
      }

      .bari-bubble {
        bottom: 172px !important;
        right: 16px !important;
        max-width: calc(100vw - 100px);
        font-size: 13px;
      }
    }
  `;

  // ============================================
  // HTML TEMPLATE
  // ============================================
  const template = `
    <!-- Speech Bubble -->
    <div class="bari-bubble" id="bariBubble">
      <button class="bari-bubble-close" id="bariBubbleClose" aria-label="Close notification">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <p class="bari-bubble-text">${CONFIG.bubbleText}</p>
    </div>

    <!-- Floating Action Button -->
    <button class="bari-fab" id="bariChatbotFAB" aria-label="Open BARI Chatbot" title="Chat dengan BARI">
      <img src="${CONFIG.bariIconUrl}" alt="BARI Assistant" />
    </button>

    <!-- Modal Overlay -->
    <div class="bari-modal-overlay" id="bariModalOverlay"></div>

    <!-- Modal -->
    <div class="bari-modal" id="bariModal" role="dialog" aria-modal="true" aria-labelledby="bariModalTitle">
      <!-- Header -->
      <div class="bari-modal-header">
        <div class="bari-modal-header-content">
          <div class="bari-modal-header-icon">
            <img src="${CONFIG.bariStaticIconUrl}" alt="BARI" />
          </div>
          <div class="bari-modal-header-text">
            <h3 id="bariModalTitle">${CONFIG.headerTitle}</h3>
            <p>${CONFIG.headerSubtitle}</p>
          </div>
        </div>
        <button class="bari-modal-close" id="bariModalClose" aria-label="Close chatbot">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="bari-modal-body">
        <div class="bari-modal-loading" id="bariLoading">
          <div class="bari-spinner"></div>
          <p class="bari-loading-text">Memuat BARI...</p>
        </div>
        <iframe
          id="bariIframe"
          class="bari-modal-iframe"
          src=""
          allow="microphone; camera"
          title="BARI Chatbot Interface"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
      </div>
    </div>
  `;

  // ============================================
  // WIDGET CLASS
  // ============================================
  class BariChatbotWidget {
    constructor() {
      this.isOpen = false;
      this.isIframeLoaded = false;
      this.bubbleShown = false;
      this.bubbleTimer = null;
      this.bubbleHideTimer = null;
      this.activityTimer = null;

      this.init();
    }

    init() {
      // Inject CSS
      this.injectStyles();

      // Inject HTML
      this.injectHTML();

      // Get DOM elements
      this.cacheDOMElements();

      // Bind event listeners
      this.bindEvents();

      // Start bubble timer
      this.scheduleBubble();

      // Track user activity
      this.trackActivity();

      console.log('✅ BARI Chatbot Widget initialized');
    }

    injectStyles() {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    injectHTML() {
      const container = document.createElement('div');
      container.id = 'bariChatbotWidget';
      container.innerHTML = template;
      document.body.appendChild(container);
    }

    cacheDOMElements() {
      this.fab = document.getElementById('bariChatbotFAB');
      this.modal = document.getElementById('bariModal');
      this.overlay = document.getElementById('bariModalOverlay');
      this.closeBtn = document.getElementById('bariModalClose');
      this.iframe = document.getElementById('bariIframe');
      this.loading = document.getElementById('bariLoading');
      this.bubble = document.getElementById('bariBubble');
      this.bubbleCloseBtn = document.getElementById('bariBubbleClose');
    }

    bindEvents() {
      // FAB click
      this.fab.addEventListener('click', () => this.toggleModal());

      // Modal close
      this.closeBtn.addEventListener('click', () => this.closeModal());
      this.overlay.addEventListener('click', () => this.closeModal());

      // Bubble close
      this.bubbleCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeBubble();
      });

      // Iframe load
      this.iframe.addEventListener('load', () => {
        this.loading.classList.add('hidden');
        console.log('✅ Chatbot iframe loaded');
      });

      // Keyboard (ESC)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeModal();
        }
      });

      // PostMessage communication
      window.addEventListener('message', (event) => {
        if (event.origin !== 'https://bajaringan-chatbot.vercel.app') return;

        console.log('📨 Message from chatbot:', event.data);

        if (event.data.action === 'close') {
          this.closeModal();
        }
      });
    }

    // ============================================
    // BUBBLE METHODS
    // ============================================

    scheduleBubble() {
      if (this.bubbleTimer) {
        clearTimeout(this.bubbleTimer);
      }

      this.bubbleTimer = setTimeout(() => {
        if (!this.isOpen && !this.bubbleShown) {
          this.showBubble();
        }
      }, CONFIG.bubbleDelay);
    }

    showBubble() {
      this.bubble.classList.add('show');
      this.fab.classList.add('pulse');
      this.bubbleShown = true;

      console.log('💬 Bubble shown');

      // Auto-hide after duration
      this.bubbleHideTimer = setTimeout(() => {
        this.hideBubble();
      }, CONFIG.bubbleDuration);
    }

    hideBubble() {
      this.bubble.classList.remove('show');
      this.fab.classList.remove('pulse');

      if (this.bubbleHideTimer) {
        clearTimeout(this.bubbleHideTimer);
      }
    }

    closeBubble() {
      this.hideBubble();
      this.bubbleShown = true; // Mark as dismissed

      if (this.bubbleTimer) {
        clearTimeout(this.bubbleTimer);
      }

      console.log('❌ Bubble dismissed by user');
    }

    // ============================================
    // MODAL METHODS
    // ============================================

    openModal() {
      this.isOpen = true;
      this.modal.classList.add('active');
      this.overlay.classList.add('active');
      // Removed: document.body.style.overflow = 'hidden' to allow page scrolling

      // Hide bubble
      this.hideBubble();

      // Load iframe only once
      if (!this.isIframeLoaded) {
        this.iframe.src = CONFIG.chatbotUrl;
        this.isIframeLoaded = true;
        console.log('🔗 Loading chatbot URL:', CONFIG.chatbotUrl);
      }

      // Clear bubble timer
      if (this.bubbleTimer) {
        clearTimeout(this.bubbleTimer);
      }

      console.log('📂 Modal opened');
    }

    closeModal() {
      this.isOpen = false;
      this.modal.classList.remove('active');
      this.overlay.classList.remove('active');
      // Removed: document.body.style.overflow = '' (no longer needed)

      // Reset bubble shown flag
      this.bubbleShown = false;

      // Schedule next bubble
      this.scheduleBubble();

      console.log('📁 Modal closed');
    }

    toggleModal() {
      if (this.isOpen) {
        this.closeModal();
      } else {
        this.openModal();
      }
    }

    // ============================================
    // ACTIVITY TRACKING
    // ============================================

    trackActivity() {
      const resetTimer = () => {
        if (this.activityTimer) {
          clearTimeout(this.activityTimer);
        }

        // Reset bubble timer on activity
        if (this.bubbleTimer && !this.bubbleShown && !this.isOpen) {
          clearTimeout(this.bubbleTimer);
          this.scheduleBubble();
        }
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

      events.forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
      });
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function initWidget() {
    // Check if already initialized
    if (window.bariChatbotWidget) {
      console.warn('⚠️  BARI Chatbot Widget already initialized');
      return;
    }

    // Create widget instance
    window.bariChatbotWidget = new BariChatbotWidget();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();
