
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    errorMessage.textContent = "";

    const formData = new FormData(loginForm);
    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("../api/register/", { // Replace "/api/login" with your actual backend endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Login failed. Please check your credentials and try again.");
      }

      const result = await response.json();

      if (result.success) {
        window.location.href = "/dashboard";
      } else {
        throw new Error(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.color = "red";
    }
  });
});
