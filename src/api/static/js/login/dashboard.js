/*
{
  "profile": {
    "username": "YourUsername",
      "image": "https://example.com/profile.jpg"
  },
  "recentMatches": [
    {
      "opponent": "Player123",
      "result": "Win",
      "score": "3-2",
      "thumbnail": "https://example.com/match1.jpg"
    },
    {
      "opponent": "Player456",
      "result": "Lose",
      "score": "1-3",
      "thumbnail": "https://example.com/match2.jpg"
    }
  ],
    "friends": [
      { "name": "Friend1", "avatar": "https://example.com/friend1.jpg" },
      { "name": "Friend2", "avatar": "https://example.com/friend2.jpg" }
    ]
}

*/



document.addEventListener("DOMContentLoaded", async () => {
  const dashboardContainer = document.querySelector(".dashboard-container");

  try {
    // Fetch data from the backend
    const response = await fetch("/api/dashboard"); // Replace with your actual backend endpoint
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data.");
    }

    const data = await response.json();

    // Populate profile
    const profileHTML = `
      <div class="profile">
        <img src="${data.profile.image || 'https://via.placeholder.com/60'}" alt="Profile Picture">
        <div>
          <h2>${data.profile.username}</h2>
          <p>Welcome back!</p>
        </div>
      </div>
      <div>
        <button>Logout</button>
      </div>
    `;
    dashboardContainer.querySelector(".header").innerHTML = profileHTML;

    // Populate recent matches
    const matchList = dashboardContainer.querySelector(".match-list");
    matchList.innerHTML = ""; // Clear existing content

    data.recentMatches.forEach((match) => {
      const matchHTML = `
        <div class="match-item">
          <img src="${match.thumbnail || 'https://via.placeholder.com/40'}" alt="Match Thumbnail">
          <div class="match-details">
            <p>Match vs ${match.opponent}</p>
            <p>Result: <strong>${match.result}</strong></p>
            <p>Score: ${match.score}</p>
          </div>
        </div>
      `;
      matchList.insertAdjacentHTML("beforeend", matchHTML);
    });

    // Populate friend list
    const friendList = dashboardContainer.querySelector(".friend-list");
    friendList.innerHTML = ""; // Clear existing content

    data.friends.forEach((friend) => {
      const friendHTML = `
        <div class="friend-item">
          <img src="${friend.avatar || 'https://via.placeholder.com/40'}" alt="Friend Avatar">
          <p>${friend.name}</p>
        </div>
      `;
      friendList.insertAdjacentHTML("beforeend", friendHTML);
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    dashboardContainer.innerHTML = `<p style="color: red;">Failed to load dashboard data. Please try again later.</p>`;
  }
});
