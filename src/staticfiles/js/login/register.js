function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.cookie.split('; ')
                        .find(row => row.startsWith('csrftoken='))
                        ?.split('=')[1];
}

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMessage = document.getElementById("errorMessage");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorMessage.textContent = "";
        
        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        try {
            const csrfToken = getCSRFToken();
            
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch("/api/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken
                },
                credentials: 'include',  // Important for SPA
                body: JSON.stringify({
                    username: username,
                    email: email || null,
                    password: password,
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                window.location.href = "/login";
            } else {
                errorMessage.textContent = result.message || "Registration failed. Please try again.";
                errorMessage.style.color = "red";
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.style.color = "red";
        }
    });
});
