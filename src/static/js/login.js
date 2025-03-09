import { getURL, getRequest, postRequest } from './utils.js';

// API endpoints
const LOGIN_URL = getURL() + '/api/login/';
const REGISTER_URL = getURL() + '/api/register/';

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

		const username = loginUsername.value;
		const password = loginPassword.value;

		if (!username || !password) {
			alert('Please enter both username and password');
			return;
		}

		try {
			const response = await postRequest(LOGIN_URL, {
				username: username,
				password: password
			});

			// Redirect to lobby or game
			window.location.href = '/';
		} catch (error) {
			console.error('Login error:', error.message);
			alert(error.message);
		}
	});

	// Registration form submission
	registerForm.addEventListener('submit', async function(e) {
		e.preventDefault();

		const username = registerUsername.value;
		const password = registerPassword.value;
		const confirm = confirmPassword.value;
		const image = profileImage.files[0];

		// Validate form
		if (!username || !password) {
			alert('Please provide both username and password');
			return;
		}

		if (password !== confirm) {
			alert('Passwords do not match');
			return;
		}

		try {
			const response = await postRequest(REGISTER_URL, {
				username: username,
				email: null,
				password: password
			});

			tabButtons[0].click();
		} catch (error) {
			console.error('Registration error:', error);
			alert(error.message);
		}
	});
});