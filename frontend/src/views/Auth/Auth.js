import './Auth.css';

import router from '../../router.js';
import api from '../../api.js';
import user from '../../User.js';

class Authenticate {
	constructor() {
		this.eventListeners = []; // Track event listeners for cleanup
	}

	render() {
		return `
		<div class="auth-card">
			<!-- Tab switcher -->
			<div class="tab-switcher">
				<button class="tab-btn active" data-tab="login">Login</button>
				<button class="tab-btn" data-tab="register">Register</button>
			</div>

			<!-- Login Form -->
			<div class="auth-form active" id="login-form">
				<h2>Welcome Back</h2>
				<form>
					<div class="form-group">
						<label for="login-username">Username</label>
						<input type="text" id="login-username" class="form-input" placeholder="Enter your username" maxlength="8" autocomplete="on" required>
					</div>
					<div class="form-group">
						<label for="login-password">Password</label>
						<input type="password" id="login-password" class="form-input" placeholder="Enter your password" autocomplete="on" required>
					</div>
					<div class="error-message" id="login-error"></div>
					<button type="submit" class="submit-btn">Login</button>
				</form>
			</div>

			<!-- Registration Form -->
			<div class="auth-form" id="register-form">
				<h2>Create Account</h2>
				<form enctype="multipart/form-data">
					<div class="form-group">
						<div class="image-upload-container">
							<div class="image-preview" id="image-preview-container">
								<i class="fa-solid fa-arrow-up-from-bracket" id="upload-icon"></i>
								<img src="" alt="Uploaded profile picture" id="image-preview">
							</div>
							<input type="file" class="file-input" accept="image/*" id="profile-image">
						</div>
					</div>
					<div class="form-group">
						<label for="register-username">Username (8 max)</label>
						<input type="text" id="register-username" class="form-input" placeholder="Choose a username" maxlength="8" autocomplete="on" required>
					</div>
					<div class="form-group">
						<label for="register-password">Password (8 min)</label>
						<input type="password" id="register-password" class="form-input" placeholder="Create a password" autocomplete="on" required>
					</div>
					<div class="form-group">
						<label for="confirm-password">Confirm Password</label>
						<input type="password" id="confirm-password" class="form-input" placeholder="Confirm your password" autocomplete="on" required>
					</div>
					<div class="error-message" id="register-error"></div>
					<button type="submit" class="submit-btn">Register</button>
				</form>
			</div>
		</div>
		`;
	}

	// Helper method to display error messages
	showError(formType, message) {
		const errorElement = document.getElementById(`${formType}-error`);
		errorElement.textContent = message;
		errorElement.style.display = 'block';
	}
	
	// Helper method to clear error messages
	clearError(formType) {
		const errorElement = document.getElementById(`${formType}-error`);
		errorElement.textContent = '';
		errorElement.style.display = 'none';
	}

	// Tab switching handler
	handleTabSwitch = (event) => {
		// Clear any displayed errors when switching tabs
		this.clearError('login');
		this.clearError('register');
		
		const tabButtons = document.querySelectorAll('.tab-btn');
		const authForms = document.querySelectorAll('.auth-form');
		
		// Update active tab button
		tabButtons.forEach(btn => btn.classList.remove('active'));
		event.target.classList.add('active');

		// Show corresponding form
		const tabName = event.target.getAttribute('data-tab');
		authForms.forEach(form => form.classList.remove('active'));

		if (tabName === 'login') {
			document.getElementById('login-form').classList.add('active');
		} else {
			document.getElementById('register-form').classList.add('active');
		}
	}

	// Image preview container click handler
	handleImagePreviewClick = () => {
		const profileImage = document.getElementById('profile-image');
		profileImage.click();
	}

	// Profile image change handler
	handleProfileImageChange = (event) => {
		const profileImage = event.target;
		const uploadIcon = document.getElementById('upload-icon');
		const imagePreview = document.getElementById('image-preview');
		
		const image = profileImage.files[0];
		if (image) {
			// Validate file size
			if (image.size > 1024 * 1024) {
				this.showError('register', 'File size exceeds 1MB');
				profileImage.value = '';
				return;
			}
	
			// Create preview
			const reader = new FileReader();
			reader.onload = function(event) {
				// Hide the icon and show the image
				uploadIcon.style.display = 'none';
				imagePreview.style.display = 'block';
				imagePreview.src = event.target.result;
			};
			reader.readAsDataURL(image);
		} else if (!imagePreview.src) {
			// If no file selected (user cancelled), show icon again
			uploadIcon.style.display = 'block';
			imagePreview.style.display = 'none';
		}
	}

	// Login form submission handler
	handleLoginSubmit = async (event) => {
		event.preventDefault();
		this.clearError('login');

		const loginUsername = document.getElementById('login-username');
		const loginPassword = document.getElementById('login-password');

		const username = loginUsername.value;
		const password = loginPassword.value;

		// Validate form
		if (!username) {
			this.showError('login', 'Username cannot be empty');
			return;
		}

		if (username.length > 8) {
			this.showError('login', 'Username cannot be longer than 8 characters');
			return;
		}

		if (!password) {
			this.showError('login', 'Please enter your password');
			return;
		}

		try {
			const response = await api.login(username, password);

			user.login(response.user, response.token);

			router.navigate('/');
		} catch (error) {
			console.error('Login error:', error.message);
			this.showError('login', error.message);
		}
	}

	// Registration form submission handler
	handleRegisterSubmit = async (event) => {
		event.preventDefault();
		this.clearError('register');

		const registerUsername = document.getElementById('register-username');
		const registerPassword = document.getElementById('register-password');
		const confirmPassword = document.getElementById('confirm-password');
		const profileImage = document.getElementById('profile-image');

		const username = registerUsername.value;
		const password = registerPassword.value;
		const confirm = confirmPassword.value;
		const image = profileImage.files[0];

		// Validate form
		if (!username) {
			this.showError('register', 'Username cannot be empty');
			return;
		}

		if (username.length > 8) {
			this.showError('register', 'Username cannot be longer than 8 characters');
			return;
		}

		if (!password) {
			this.showError('register', 'Please enter your password');
			return;
		}

		if (password.length < 8) {
			this.showError('register', 'Password must be at least 8 characters long');
			return;
		}

		if (password !== confirm) {
			this.showError('register', 'New password and confirmation do not match');
			return;
		}

		try {
			const formData = new FormData();
			formData.append('username', username);
			formData.append('password', password);
			if (image) {
				formData.append('avatar', image);
			}

			const response = await api.register(formData);

			user.login(response.user, response.token);

			router.navigate('/');
		} catch (error) {
			console.error('Registration error:', error.message);
			this.showError('register', error.message);
		}
	}

	onLoad() {
		// Clear event listeners array
		this.eventListeners = [];

		// Tab switching functionality
		const tabButtons = document.querySelectorAll('.tab-btn');
		tabButtons.forEach(button => {
			button.addEventListener('click', this.handleTabSwitch);
			this.eventListeners.push({ element: button, type: 'click', handler: this.handleTabSwitch });
		});

		// Image upload functionality
		const imagePreviewContainer = document.getElementById('image-preview-container');
		imagePreviewContainer.addEventListener('click', this.handleImagePreviewClick);
		this.eventListeners.push({ element: imagePreviewContainer, type: 'click', handler: this.handleImagePreviewClick });

		const profileImage = document.getElementById('profile-image');
		profileImage.addEventListener('change', this.handleProfileImageChange);
		this.eventListeners.push({ element: profileImage, type: 'change', handler: this.handleProfileImageChange });

		// Form submissions
		const loginForm = document.getElementById('login-form');
		loginForm.addEventListener('submit', this.handleLoginSubmit);
		this.eventListeners.push({ element: loginForm, type: 'submit', handler: this.handleLoginSubmit });

		const registerForm = document.getElementById('register-form');
		registerForm.addEventListener('submit', this.handleRegisterSubmit);
		this.eventListeners.push({ element: registerForm, type: 'submit', handler: this.handleRegisterSubmit });
	}

	onUnload() {
		// Clean up event listeners
		this.eventListeners.forEach(({ element, type, handler }) => {
			element.removeEventListener(type, handler);
		});
		this.eventListeners = [];
	}
}

// Create and export a single instance
export default new Authenticate();
