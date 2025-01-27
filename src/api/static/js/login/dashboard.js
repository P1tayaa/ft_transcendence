import { getCSRFToken } from '../utils.js';

console.log("Please exist");
const LOGOUT_URL = '../api/logout/';
const LOGOUT_REDIRECT_URL = '../login';

async function logout() {
  console.log("button_pressed");
  try {
    const csrfToken = getCSRFToken();

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

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logoutButton");
  console.log("Test");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  } else {
    console.error('Logout button not found in the DOM.');
  }

});
