


document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.querySelector("input[type='text']");
  const sendButton = document.querySelector("button");
  const chatBox = document.getElementById("chat-box");

  let conversation = { exchange: [] };

  sendButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
      // Add message to the conversation JSON
      conversation.exchange.push({ user: "User1", message });

      // Display the message in the chat box
      const messageElement = document.createElement("p");
      messageElement.innerHTML = `<strong>User1:</strong> ${message}`;
      chatBox.appendChild(messageElement);

      // Clear the input
      chatInput.value = "";

      // Log the JSON (or save it somewhere)
      console.log(JSON.stringify(conversation, null, 2));
    }
  });
});
