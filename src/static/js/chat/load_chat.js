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
    this.url = "../api/get_chat_data/"
  }

  async fetchConversationsList(url) {
    try {
      console.log("test")
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'  // Important for auth

      }); console.log(response.json())
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations list:', error);
      return [];
    }
  }




  async fetchConversationDetails(url, conversationId) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',  // Important for auth
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });
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
    const url = '../api/get_chat_data/'; // Replace with your API endpoint
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
    const url = '../api/get_chat_data/'; // Replace with your API endpoint
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
    console.log("init class")
    const url = '../api/get_chat_data/'; // Replace with your API endpoint
    const conversations = await this.fetchConversationsList(url);
    this.populateConversationsList(conversations);
    setInterval(() => this.updateNewMessages(), 1000); // Check for new messages every second
  }
}







async function getChatData(chatId = null) {
  try {
    const url = chatId ? `/api/chat/${chatId}/` : '/api/chat/';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',  // Important for sending cookies
      headers: {
        'X-CSRFToken': getCsrfToken()
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Chat data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching chat data:', error);
    throw error;
  }
}

// Helper function to get CSRF token
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
}



async function getChatData(chatId = null) {
  const authResponse = await fetch("../api/get_chat_data", {
    method: 'GET',
    credentials: 'include',  // Important for sending cookies
    headers: {
      'X-CSRFToken': getCsrfToken()
    }
  });
  // Check login status first
  // const authResponse = await fetch('../api/get_chat_data/', { method: 'GET', credentials: 'include' });
  const chatData = await authResponse.json();
  console.log('response:', authResponse);
  console.log('Auth status:', chatData);
  if (Array.isArray(chatData) && chatData.length === 0) {
    console.log('No chats found');
    // You might want to update your UI here to show "No chats yet" message
  } else if (chatData.message === "No chats found") {
    console.log(chatData.message);
    // Handle the explicit "no chats" message
  }

  // Then get chat data
  // console.log('Chat data:', chatData);
  // console.error('User not authenticated');

}

getChatData();


// const chatPage = new ChatPage('conversations', 'chat-content');
// chatPage.initialize();
console.log("you exist?")
