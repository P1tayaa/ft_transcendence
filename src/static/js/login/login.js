import { checkAuthStatus } from './checkAuth.js';
import { getCSRFToken } from '../utils.js';

(async () => {
  const isAuthenticated = await checkAuthStatus();
  if (isAuthenticated) {
    window.location.href = "/dashboard";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");


  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const csrfToken = getCSRFToken();

      if (!csrfToken) {
        throw new Error('CSRF token not found');
      }

      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Successful login
        window.location.href = "/dashboard";  // or wherever you want to redirect
      } else {
        // Failed login
        errorMessage.textContent = result.message || "Login failed. Please try again.";
        errorMessage.style.color = "red";
      }
    } catch (error) {
      console.error('Error:', error);
      errorMessage.textContent = "An error occurred. Please try again.";
      errorMessage.style.color = "red";
    }
  });
});
