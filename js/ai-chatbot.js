/**
 * EcoVators AI Chatbot for Agricultural Advice
 * Provides farmers with sustainable farming tips and answers questions
 */

const AIChatbot = {
    // Initialize the chatbot
    init: function() {
        this.createChatbotUI();
        this.setupEventListeners();
        console.log('AI Chatbot initialized');
    },

    // Create the chatbot UI
    createChatbotUI: function() {
        const chatbotHTML = `
            <div class="chatbot-container">
                <div class="chatbot-header">
                    <h3><i class="fas fa-robot"></i> EcoBot Assistant</h3>
                    <button class="chatbot-toggle"><i class="fas fa-minus"></i></button>
                </div>
                <div class="chatbot-body">
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="message bot-message">
                            <div class="message-content">
                                Hello! I'm EcoBot, your sustainable farming assistant. How can I help you today?
                            </div>
                            <div class="message-time">Just now</div>
                        </div>
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chatbot-input-field" placeholder="Ask about sustainable farming...">
                        <button id="chatbot-send"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
            <button class="chatbot-button" id="open-chatbot">
                <i class="fas fa-robot"></i>
            </button>
        `;

        // Append chatbot to the body
        const chatbotContainer = document.createElement('div');
        chatbotContainer.innerHTML = chatbotHTML;
        document.body.appendChild(chatbotContainer);

        // Add CSS for the chatbot
        const chatbotStyles = document.createElement('style');
        chatbotStyles.textContent = `
            .chatbot-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #4CAF50;
                color: white;
                border: none;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s ease;
            }
            
            .chatbot-button:hover {
                transform: scale(1.1);
                background-color: #388E3C;
            }
            
            .chatbot-container {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 350px;
                height: 450px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            .chatbot-container.active {
                display: flex;
            }
            
            .chatbot-header {
                padding: 15px;
                background-color: #4CAF50;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chatbot-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .chatbot-toggle {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
            }
            
            .chatbot-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 15px;
                overflow: hidden;
            }
            
            .chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .message {
                margin-bottom: 15px;
                max-width: 80%;
            }
            
            .user-message {
                margin-left: auto;
                text-align: right;
            }
            
            .bot-message {
                margin-right: auto;
            }
            
            .message-content {
                padding: 10px 15px;
                border-radius: 18px;
                display: inline-block;
                word-break: break-word;
            }
            
            .user-message .message-content {
                background-color: #E3F2FD;
                color: #0D47A1;
            }
            
            .bot-message .message-content {
                background-color: #F1F1F1;
                color: #333;
            }
            
            .message-time {
                font-size: 11px;
                color: #999;
                margin-top: 5px;
            }
            
            .chatbot-input {
                display: flex;
                margin-top: 15px;
                border-top: 1px solid #eee;
                padding-top: 15px;
            }
            
            .chatbot-input input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
            }
            
            .chatbot-input button {
                background-color: #4CAF50;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-left: 10px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            .chatbot-input button:hover {
                background-color: #388E3C;
            }
            
            @media (max-width: 480px) {
                .chatbot-container {
                    width: 90%;
                    right: 5%;
                    left: 5%;
                    bottom: 80px;
                }
            }
        `;
        document.head.appendChild(chatbotStyles);
    },

    // Set up event listeners for chatbot interactions
    setupEventListeners: function() {
        // Open chatbot
        document.getElementById('open-chatbot').addEventListener('click', () => {
            document.querySelector('.chatbot-container').classList.add('active');
            document.getElementById('open-chatbot').style.display = 'none';
        });

        // Toggle chatbot minimize
        document.querySelector('.chatbot-toggle').addEventListener('click', () => {
            document.querySelector('.chatbot-container').classList.remove('active');
            document.getElementById('open-chatbot').style.display = 'flex';
        });

        // Send message
        document.getElementById('chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter key
        document.getElementById('chatbot-input-field').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    },

    // Send a message to the chatbot
    sendMessage: function() {
        const inputField = document.getElementById('chatbot-input-field');
        const message = inputField.value.trim();
        
        if (message === '') return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input field
        inputField.value = '';
        
        // Process the message and get a response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 1000);
    },

    // Add a message to the chat
    addMessage: function(message, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // Generate a response based on the user's message
    generateResponse: function(message) {
        message = message.toLowerCase();
        
        // Simple rule-based responses
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! How can I help with your farming questions today?";
        }
        
        if (message.includes('thank')) {
            return "You're welcome! Feel free to ask if you have more questions.";
        }
        
        // Farming-related responses
        if (message.includes('pest') || message.includes('insect')) {
            return "For sustainable pest management, consider companion planting with marigolds or neem-based solutions. Would you like specific recommendations for your crops?";
        }
        
        if (message.includes('water') || message.includes('irrigation')) {
            return "Efficient water management is crucial for sustainable farming. Consider drip irrigation, mulching, and rainwater harvesting. These can reduce water usage by up to 60%.";
        }
        
        if (message.includes('fertilizer') || message.includes('nutrient') || message.includes('soil')) {
            return "For soil health, consider using compost, vermicompost, or green manures. These natural fertilizers improve soil structure and microbial activity while reducing chemical dependency.";
        }
        
        if (message.includes('crop rotation') || message.includes('rotate')) {
            return "Crop rotation is excellent for soil health! It helps break pest cycles and balances soil nutrients. Try rotating legumes with grains for best results.";
        }
        
        if (message.includes('organic') || message.includes('certification')) {
            return "Organic certification typically requires 3 years of chemical-free farming. The process involves documentation, inspections, and following specific standards. Would you like more details?";
        }
        
        if (message.includes('climate') || message.includes('weather')) {
            return "Climate-resilient farming practices include using drought-resistant varieties, diversifying crops, and implementing agroforestry. These approaches can help mitigate climate change impacts.";
        }
        
        if (message.includes('market') || message.includes('sell') || message.includes('price')) {
            return "For better market access, consider joining a Farmer Producer Organization (FPO) or exploring direct-to-consumer models like Community Supported Agriculture (CSA).";
        }
        
        // Default response
        return "That's an interesting question about sustainable farming. While I'm still learning, I recommend checking the Resources section for detailed information on this topic. Would you like to know about water conservation, organic pest management, or soil health instead?";
    }
};

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    AIChatbot.init();
});