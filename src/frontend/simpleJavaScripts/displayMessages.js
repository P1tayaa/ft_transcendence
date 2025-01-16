
document.addEventListener("DOMContentLoaded", () => {

  function displayConversation(jsonData) {
    try {
      // Get the container element to display the conversation
      const container = document.getElementById("chat-box");

      if (!container) {
        throw new Error("Container element with ID 'chat-box' not found.");
      }

      // Iterate through the exchanges and display them
      jsonData.exchange.forEach((entry) => {
        const messageElement = document.createElement("p");
        messageElement.innerHTML = `<strong>${entry.user}:</strong> ${entry.message}`;
        container.appendChild(messageElement);
      });
    } catch (error) {
      console.error("Error displaying JSON data:", error);
    }
  } const tempJson = {
    exchange: [
      { user: "User1", message: "Hi, how are you?" },
      { user: "User2", message: "I'm good, thanks! How about you?" },
      { user: "User1", message: "Doing well, thanks for asking!" },
    ],
  };


  displayConversation(tempJson);


});
