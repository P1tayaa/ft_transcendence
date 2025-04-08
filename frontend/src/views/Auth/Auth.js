import './Auth.css';

import router from '../../router.js';
import api from '../../api.js';
import user from '../../User.js';


const Authenticate = () => {
	const render = () => {
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
						<input type="text" id="login-username" class="form-input" placeholder="Enter your username" required>
					</div>
					<div class="form-group">
						<label for="login-password">Password</label>
						<input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
					</div>
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
						<label for="register-username">Username</label>
						<input type="text" id="register-username" class="form-input" placeholder="Choose a username" required>
					</div>
					<div class="form-group">
						<label for="register-password">Password</label>
						<input type="password" id="register-password" class="form-input" placeholder="Create a password" required>
					</div>
					<div class="form-group">
						<label for="confirm-password">Confirm Password</label>
						<input type="password" id="confirm-password" class="form-input" placeholder="Confirm your password" required>
					</div>
					<button type="submit" class="submit-btn">Register</button>
				</form>
			</div>
		</div>
		`;
	}

	const onLoad = () => {
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
		const uploadIcon = document.getElementById('upload-icon');
		const imagePreviewContainer = document.getElementById('image-preview-container');
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
		imagePreviewContainer.addEventListener('click', function() {
			profileImage.click();
		});

		profileImage.addEventListener('change', function() {
			const image = this.files[0];
			if (image) {
				// Validate file size
				if (image.size > 1024 * 1024) {
					alert('File size exceeds 1MB');
					this.value = '';
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
				const response = await api.login(username, password);

				user.login(response.user, response.token);

				router.navigate('/');
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
				const formData = new FormData();
				formData.append('username', username);
				formData.append('password', password);
				if (image) {
					formData.append('profile_picture', image);
				}

				const response = await api.register(formData);

				user.login(response.user, response.token);

				router.navigate('/');
			} catch (error) {
				console.error('Registration error:', error.message);
				alert(error.message);
			}
		});
	}

	return { render, onLoad };
}

export default Authenticate;
