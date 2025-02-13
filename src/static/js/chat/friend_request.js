
// Define API endpoints as constants
const SEARCH_USERS_URL = '../api/fetch_matching_usernames/';
const ADD_FRIEND_URL = '../api/add_friend/';
const REMOVE_FRIEND_URL = '../api/remove_friend/';
const FRIENDS_URL = '../api/get_friends/';


import { getCSRFToken } from '../utils.js';

document.addEventListener('DOMContentLoaded', () => {

  // Fetch friends and display them
  getFriends();


  const inputField = document.getElementById('friend-input');
  const seePossibleBtn = document.getElementById('see-possible-btn');

  seePossibleBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const username = inputField.value.trim();

    if (!username) {
      alert('Please enter a username to search for.');
      return;
    }

    try {
      const data = await fetchMatchingUsers(username);

      if (!data.success || data.count === 0) {
        alert(data.error || 'No matches found.');
        return;
      }

      displaySelection(data.results);

    } catch (error) {
      console.error('Error fetching matches:', error);
      alert('An error occurred while searching for friends.');
    }
  });

  async function fetchMatchingUsers(username) {
    const url = `${SEARCH_USERS_URL}?username=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    return await response.json();
  }

  function displaySelection(users) {
    let selectionDiv = document.getElementById('selection-div');
    if (selectionDiv) selectionDiv.remove();

    selectionDiv = document.createElement('div');
    selectionDiv.id = 'selection-div';

    const select = document.createElement('select');
    select.id = 'matches-select';

    const defaultOption = document.createElement('option');
    defaultOption.text = 'Select a user';
    defaultOption.value = '';
    select.appendChild(defaultOption);

    users.forEach(user => {
      const option = document.createElement('option');
      option.text = user.username;
      option.value = user.user_id;
      select.appendChild(option);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Add';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remove';

    selectionDiv.appendChild(select);
    selectionDiv.appendChild(confirmBtn);
    selectionDiv.appendChild(deleteBtn);
    document.querySelector('.friend_add').appendChild(selectionDiv);

    confirmBtn.addEventListener('click', async () => {
      const selectedUserID = select.value;
      if (!selectedUserID) {
        alert('Please select a user to add.');
        return;
      }

      try {
        const addSuccess = await addFriend(selectedUserID);
        if (addSuccess) {
          alert('Friend added successfully!');
          selectionDiv.remove();
          inputField.value = '';
        }
      } catch (error) {
        console.error('Error adding friend:', error);
        alert('An error occurred while adding the friend.');
      }
    });

    deleteBtn.addEventListener('click', async () => {
      const selectedUserID = select.value;
      if (!selectedUserID) {
        alert('Please select a user to add.');
        return;
      }

      try {
        const success = await removeFriend(selectedUserID);
        if (success) {
          alert('Friend removed successfully!');
          selectionDiv.remove();
          inputField.value = '';
        }
      } catch (error) {
        console.error('Error removing friend:', error);
        alert('An error occurred while removing the friend.');
      }
    });
  }

  async function removeFriend(friend_id) {
    const csrfToken = getCSRFToken();

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const response = await fetch(REMOVE_FRIEND_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      }, body: JSON.stringify({ friend_id: friend_id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove friend');
    }

    const data = await response.json();
    return data.success;
  }

  async function addFriend(friend_id) {
    const csrfToken = getCSRFToken();

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const response = await fetch(ADD_FRIEND_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      }, body: JSON.stringify({ friend_id: friend_id }),
    });

    if (!response.ok) {
      // Special case for "already friends"
        if (data.error && data.error.includes("Already friends with")) {
            alert(data.error);
            return false;
        }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add friend');
    }

    const data = await response.json();
    return data.success;
  }

  async function getFriends() {
    const csrfToken = getCSRFToken();

    const response = await fetch(FRIENDS_URL, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get friends');
    }

    const data = await response.json();
    console.log(data.friends);

    return data;
  }
});
