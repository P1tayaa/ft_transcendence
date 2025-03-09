import { getRequest, postRequest } from './utils.js';

// API endpoints
const LOGIN_URL = 'http://localhost:8000/api/login/';
const REGISTER_URL = 'http://localhost:8000/api/register/';

document.addEventListener('DOMContentLoaded', function() {
	// Tab switching functionality
	const tabButtons = document.querySelectorAll('.tab-btn');
	const authForms = document.querySelectorAll('.auth-form');

	// Login form elements
	const loginForm = document.getElementById('login-form');
	const loginUsername = document.getElementById('login-username');
	const loginPassword = document.getElementById('login-password');

	// Registration form elements
	const registerForm = document.getElementById('register-form');
	const registerUsername = document.getElementById('register-username');
	const registerPassword = document.getElementById('register-password');
	const confirmPassword = document.getElementById('confirm-password');
	const profileImage = document.getElementById('profile-image');
	const imagePreview = document.getElementById('image-preview');

	// Initialize tab switching
	tabButtons.forEach(button => {
		button.addEventListener('click', function() {
			// Update active tab button
			tabButtons.forEach(btn => btn.classList.remove('active'));
			this.classList.add('active');

			// Show corresponding form
			const tabName = this.getAttribute('data-tab');
			authForms.forEach(form => form.classList.remove('active'));

			if (tabName === 'login') {
				document.getElementById('login-form').classList.add('active');
			} else {
				document.getElementById('register-form').classList.add('active');
			}
		});
	});

	// Profile image upload handling
	imagePreview.addEventListener('click', function() {
		profileImage.click();
	});

	profileImage.addEventListener('change', function() {
		const image = this.files[0];
		if (image) {
			if (image.size > 1024 * 1024) {
				alert('File size exceeds 1MB');
				this.value = '';
				return;
			}

			const reader = new FileReader();
			reader.onload = function(e) {
				imagePreview.src = e.target.result;
			};
			reader.readAsDataURL(image);
		}
	});

	// Login form submission
	loginForm.addEventListener('submit', async function(e) {
		e.preventDefault();

		if (!loginUsername.value || !loginPassword.value) {
			alert('Please enter both username and password');
			return;
		}

		try {
			const response = await postRequest(LOGIN_URL, {
				username: loginUsername.value,
				password: loginPassword.value
			});

			if (response.success) {
				// Store auth token if provided
				if (response.token) {
					localStorage.setItem('authToken', response.token);
				}

				// Redirect to lobby or game
				window.location.href = '/lobby';
			} else {
				alert(response.message || 'Login failed. Please check your credentials.');
			}
		} catch (error) {
			console.error('Login error:', error);
			alert('An error occurred during login. Please try again.');
		}
	});

	// Registration form submission
	registerForm.addEventListener('submit', async function(e) {
		e.preventDefault();

		// Validate form
		if (!registerUsername.value || !registerPassword.value) {
			alert('Please provide both username and password');
			return;
		}

		if (registerPassword.value !== confirmPassword.value) {
			alert('Passwords do not match');
			return;
		}

		// Create FormData for file upload
		const formData = new FormData();
		formData.append('username', registerUsername.value);
		formData.append('password', registerPassword.value);

		if (profileImage.files[0]) {
				formData.append('profile_image', profileImage.files[0]);
		}

		try {
			// Use fetch directly for FormData
			const response = await fetch(REGISTER_URL, {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (data.success) {
				alert('Registration successful! You can now log in.');
				// Switch to login tab
				tabButtons[0].click();
			} else {
				alert(data.message || 'Registration failed. Please try a different username.');
			}
		} catch (error) {
			console.error('Registration error:', error);
			alert('An error occurred during registration. Please try again.');
		}
	});
});