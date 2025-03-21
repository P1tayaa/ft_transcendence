import AuthOnLoad from './Auth.onLoad.js';
import './Auth.css';

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

	const onLoad = AuthOnLoad;

	return { render, onLoad };
}

export default Authenticate;
