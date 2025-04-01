import api from '../../api.js';
import router from '../../router.js';

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
			await api.login(username, password);

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

			await api.register(formData);

			router.navigate('/');
		} catch (error) {
			console.error('Registration error:', error.message);
			alert(error.message);
		}
	});
}

export default onLoad;