import { getCSRFToken } from '../utils.js';

console.log("Please exist");
const LOGOUT_URL = '../api/logout/';
const LOGOUT_REDIRECT_URL = '../login';

const RECENT_SCORE_URL = '../api/score/recent';
const HIGHSCORE_URL = '../api/score/highscore';
const GET_FRIENDS_URL = '../api/get_friends/';
const csrfToken = getCSRFToken();


async function logout() {
  console.log("button_pressed");
  try {

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const response = await fetch(LOGOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({})
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to logout');
    }

    window.location.href = LOGOUT_REDIRECT_URL;
  } catch (error) {
    console.error('Error: An error occurred. Please try again.', error);
  }

};



// Function to fetch recent matches
async function fetchRecentMatches() {
  try {
    const response = await fetch(RECENT_SCORE_URL, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching recent matches: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      displayMatches(data, '.recent-match-list');
    } else {
      console.error('Failed to load recent matches:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to display recent matches in the .match-list div
function displayMatches(matches, class_html) {
  const matchListDiv = document.querySelector(class_html);
  if (!matchListDiv) {
    console.error(`Container with selector "${matchListDiv}" not found.`);
    return;
  }

  matchListDiv.innerHTML = ''; // Clear any existing content

  if (matches.success === false) {
    matchListDiv.innerHTML = '<p>' + matches.error + '</p>';
    return;
  }

  const ul = document.createElement('ul');
  console.log(matches.score)
  if (matches.score == 0) {

  } else {
    // this is not working and need to be more tested
    matches.score.forEach(match => {
      const li = document.createElement('li');
      li.textContent = `Match ID: ${match.match_id}, Score: ${match.score}, Date: ${match.date}`;
      ul.appendChild(li);
    });


  }
  matchListDiv.appendChild(ul);
}

// Function to fetch high scores
async function fetchHighScores() {
  try {
    const response = await fetch(HIGHSCORE_URL, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching high scores: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      displayMatches(data, '.highscore-match-list');
    } else {
      console.error('Failed to load high scores:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to fetch and display friend list
async function fetchFriends() {
  try {
    const response = await fetch(GET_FRIENDS_URL, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching friends: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      displayFriends(data.friends);
    } else {
      console.error('Failed to load friends:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to display friends in the .friend-list div
function displayFriends(friends) {
  const friendListDiv = document.querySelector('.friend-list');
  friendListDiv.innerHTML = ''; // Clear existing content

  if (friends.length === 0) {
    friendListDiv.innerHTML = '<p>No friends found.</p>';
    return;
  }

  const ul = document.createElement('ul');

  friends.forEach(friend => {
    const li = document.createElement('li');
    li.textContent = `Username: ${friend.username} (ID: ${friend.user_id})`;
    ul.appendChild(li);
  });

  friendListDiv.appendChild(ul);
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logoutButton");
  console.log("Test");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  } else {
    console.error('Logout button not found in the DOM.');
  }

  fetchRecentMatches();

  fetchHighScores();

  fetchFriends();
});



