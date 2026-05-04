/* ─────────────────────────────────────────────────
   ECG Arrhythmia Detector — Medical Chatbot Expert System
   ───────────────────────────────────────────────── */

const fab = document.getElementById('chatbot-fab');
const windowEl = document.getElementById('chatbot-window');
const closeBtn = document.getElementById('chatbot-close');
const messagesContainer = document.getElementById('chatbot-messages');
const inputField = document.getElementById('chatbot-text');
const sendBtn = document.getElementById('chatbot-send');
const suggestions = document.querySelectorAll('.chatbot-suggestions .chip');

let isChatOpen = false;
let isTyping = false;

// ── Medical Expert Knowledge Base ────────────────────────────────────
// Using regex rules to map user queries to rich, pre-programmed medical advice.
const KNOWLEDGE_BASE = [
  {
    pattern: /(medicine|medication|pills|drugs|tablets|prescribe)/i,
    response: `<strong>Arrhythmia Medications</strong><br>Treatment depends on the type of rhythm disorder. Common classifications include:<br><br>
    • <strong>Antiarrhythmics:</strong> (e.g., Amiodarone, Flecainide) to restore normal rhythm.<br>
    • <strong>Beta-Blockers:</strong> (e.g., Metoprolol) to slow down the heart rate.<br>
    • <strong>Calcium Channel Blockers:</strong> (e.g., Diltiazem) to relax blood vessels.<br>
    • <strong>Blood Thinners:</strong> (e.g., Warfarin, Rivaroxaban) to prevent stroke, especially in Atrial Fibrillation.<br><br>
    <em>Note: Never start or stop medication without consulting your cardiologist.</em>`
  },
  {
    pattern: /(exercise|workout|running|gym|activity)/i,
    response: `<strong>Safe Exercise Guidelines</strong><br>Exercise is crucial for heart health, but must be approached safely:<br><br>
    • <strong>Recommended:</strong> Low-impact aerobic exercises like brisk walking, light jogging, swimming, or cycling.<br>
    • <strong>To Avoid:</strong> Extreme weightlifting or high-intensity interval training (HIIT) unless cleared by a doctor.<br>
    • <strong>Rules:</strong> Always do a 10-minute warm-up and cool-down. Stop immediately if you feel dizzy, experience chest pain, or notice severe palpitations.`
  },
  {
    pattern: /(diet|food|eat|nutrition|meal)/i,
    response: `<strong>Cardiac Diet Plan</strong><br>A heart-healthy diet stabilizes electrolytes and prevents arterial blockages:<br><br>
    • <strong>The Mediterranean Diet:</strong> High in vegetables, whole grains, nuts, and olive oil.<br>
    • <strong>Limit Stimulants:</strong> Caffeine, alcohol, and excessive sugar can trigger arrhythmias and sudden palpitations.<br>
    • <strong>Key Minerals:</strong> Ensure adequate intake of Magnesium and Potassium (found in bananas, spinach, and avocados) as they regulate the heart's electrical signals.<br>
    • <strong>Reduce Sodium:</strong> Keep salt intake low to manage blood pressure.`
  },
  {
    pattern: /(cure|fix|stop|heal|surgery)/i,
    response: `<strong>Can Arrhythmia be Cured?</strong><br>Many arrhythmias can be completely cured or effectively managed:<br><br>
    • <strong>Catheter Ablation:</strong> A minimally invasive procedure that destroys the tiny areas of heart tissue causing the abnormal signals (often curing conditions like SVT).<br>
    • <strong>Pacemakers/ICDs:</strong> Devices implanted to instantly correct slow or dangerously fast rhythms.<br>
    • <strong>Cardioversion:</strong> Electrical shocks used to reset the heart into a normal sinus rhythm.`
  },
  {
    pattern: /(hello|hi|hey|help|morning)/i,
    response: `Hello! I am the ECG Medical Expert System. I can provide evidence-based suggestions regarding: <br><br>
    • 💊 Medicine<br>
    • 🏃 Exercise<br>
    • 🥗 Diet Plans<br>
    • ✨ Curative Procedures<br><br>
    What would you like to know?`
  }
];

const FALLBACK_RESPONSE = `I'm an offline medical expert trained specifically on <strong>Arrhythmia</strong>. Please ask me about medications, diet plans, safe exercises, or general treatments!`;

// ── UI Logic ─────────────────────────────────────────────────────────

function openChat() {
  if (!isChatOpen) toggleChat();
}

function toggleChat() {
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    windowEl.hidden = false;
    fab.style.transform = 'scale(0) translateY(20px)';
    
    if (messagesContainer.children.length === 0) {
      appendMessage("bot", `<strong>Welcome!</strong> I am your Cardiology Assistant. Need advice on medications, diet, or exercise for Arrhythmia?`);
    }
    inputField.focus();
  } else {
    windowEl.hidden = true;
    fab.style.transform = 'scale(1) translateY(0)';
  }
}

fab.addEventListener('click', toggleChat);
closeBtn.addEventListener('click', toggleChat);

// ── Global Context Bridge ────────────────────────────────────────────

window.triggerDiagnosisChat = function(diagnosisClass, confidence) {
  // Automatically open the chatbot smoothly
  setTimeout(() => {
    openChat();
    
    // Inject custom message based on the actual result
    showTyping();
    setTimeout(() => {
      removeTyping();
      let response = `I noticed the engine detected a <strong>${diagnosisClass}</strong> with ${confidence.toFixed(1)}% confidence. `;
      
      if (diagnosisClass.includes('Normal')) {
        response += `This is great news! Maintain your cardiac health with a balanced Mediterranean diet and regular light exercise. Avoid excessive caffeine to keep it this way.`;
      } else if (diagnosisClass.includes('Supraventricular')) {
        response += `SVT typically involves rapid heartbeats. Common treatments include vagal maneuvers, Beta-blockers, or Catheter Ablation. <br><br>Would you like to know more about safe exercises or medications for this?`;
      } else if (diagnosisClass.includes('Ventricular')) {
        response += `Ventricular arrhythmias are more serious and originate in the lower chambers. Medical supervision is required. Treatments often include Antiarrhythmics (like Amiodarone) or an ICD implant. <br><br>Would you like to review strict cardiac diets?`;
      } else {
        response += `This rhythm requires careful monitoring. I highly recommend consulting your physician. In the meantime, strict control of sodium and stimulants is advised.`;
      }
      
      appendMessage('bot', response);
    }, 1500);
  }, 500); // Wait 0.5s after results render before popping the chat
};

function appendMessage(sender, htmlContent) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${sender}`;
  bubble.innerHTML = htmlContent;
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTyping() {
  isTyping = true;
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  messagesContainer.appendChild(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTyping() {
  isTyping = false;
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function getBotResponse(text) {
  for (let rule of KNOWLEDGE_BASE) {
    if (rule.pattern.test(text)) {
      return rule.response;
    }
  }
  return FALLBACK_RESPONSE;
}

function processUserMessage(text) {
  if (!text.trim() || isTyping) return;
  
  // 1. Show user message
  appendMessage('user', text.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  inputField.value = '';
  
  // 2. Show typing indicator
  showTyping();
  
  // 3. Determine response and delay
  const responseHtml = getBotResponse(text);
  
  setTimeout(() => {
    removeTyping();
    appendMessage('bot', responseHtml);
  }, 1200 + Math.random() * 600); // 1.2s - 1.8s delay for realism
}

// ── Event Listeners ──────────────────────────────────────────────────

sendBtn.addEventListener('click', () => processUserMessage(inputField.value));
inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') processUserMessage(inputField.value);
});

suggestions.forEach(chip => {
  chip.addEventListener('click', () => {
    const topic = chip.getAttribute('data-topic');
    processUserMessage(topic);
  });
});
