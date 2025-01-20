/*

/conversations-list
[
    {
        "id": "123",
        "user": "John Doe",
        "lastMessage": "Hey, how are you?",
        "lastMessageTime": "2025-01-19T15:34:00Z"
    },
    {
        "id": "124",
        "user": "Jane Smith",
        "lastMessage": "Thanks for the update!",
        "lastMessageTime": "2025-01-19T14:50:00Z"
    }
]



/conversation-details?id=123

{
    "conversationId": "123",
    "lastMessageTime": "2025-01-19T15:34:00Z",
    "messages": [
        {
            "time": "2025-01-19T15:30:00Z",
            "sender": "John Doe",
            "text": "Hi there!"
        },
        {
            "time": "2025-01-19T15:32:00Z",
            "sender": "You",
            "text": "Hello! How can I help you?"
        },
        {
            "time": "2025-01-19T15:34:00Z",
            "sender": "John Doe",
            "text": "Hey, how are you?"
        }
    ]
}


/new-messages?id=123&lastMessageTime=2025-01-19T15:34:00Z
[
    {
        "time": "2025-01-19T15:35:00Z",
        "sender": "John Doe",
        "text": "Just checking in!"
    },
    {
        "time": "2025-01-19T15:36:00Z",
        "sender": "You",
        "text": "I'm doing well, thanks for asking!"
    }
]


*/
class ChatPage {
  constructor(conversationsId, chatContentId) {
    this.conversationsElement = document.getElementById(conversationsId);
    this.chatContentElement = document.getElementById(chatContentId);
    this.currentConversationId = null;
    this.lastMessageTime = null;
  }

  async fetchConversationsList(url) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations list:', error);
      return [];
    }
  }

  async fetchConversationDetails(url, conversationId) {
    try {
      const response = await fetch(`${url}?id=${conversationId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return null;
    }
  }

  async fetchNewMessages(url, conversationId, lastMessageTime) {
    try {
      const response = await fetch(`${url}?id=${conversationId}&lastMessageTime=${lastMessageTime}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching new messages:', error);
      return [];
    }
  }

  populateConversationsList(conversations) {
    this.conversationsElement.innerHTML = '';
    conversations.forEach(conversation => {
      const conversationElement = document.createElement('div');
      conversationElement.classList.add('conversation');
      conversationElement.textContent = `${conversation.user} - ${conversation.lastMessage}`;
      conversationElement.addEventListener('click', () => {
        this.currentConversationId = conversation.id;
        this.loadConversationDetails();
      });
      this.conversationsElement.appendChild(conversationElement);
    });
  }

  async loadConversationDetails() {
    const url = 'https://api.example.com/conversation-details'; // Replace with your API endpoint
    const details = await this.fetchConversationDetails(url, this.currentConversationId);
    if (details) {
      this.chatContentElement.innerHTML = '';
      this.lastMessageTime = details.lastMessageTime;
      details.messages.forEach(message => {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${message.sender}:</strong> ${message.text}`;
        this.chatContentElement.appendChild(messageElement);
      });
    }
  }

  async updateNewMessages() {
    if (!this.currentConversationId || !this.lastMessageTime) return;
    const url = 'https://api.example.com/new-messages'; // Replace with your API endpoint
    const newMessages = await this.fetchNewMessages(url, this.currentConversationId, this.lastMessageTime);
    if (newMessages.length > 0) {
      newMessages.forEach(message => {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${message.sender}:</strong> ${message.text}`;
        this.chatContentElement.appendChild(messageElement);
      });
      this.lastMessageTime = newMessages[newMessages.length - 1].time;
    }
  }

  async initialize() {
    const url = 'https://api.example.com/conversations-list'; // Replace with your API endpoint
    const conversations = await this.fetchConversationsList(url);
    this.populateConversationsList(conversations);
    setInterval(() => this.updateNewMessages(), 1000); // Check for new messages every second
  }
}

const chatPage = new ChatPage('conversations', 'chat-content');
chatPage.initialize();
