import './Edit.css'

import api from '../../../api.js';


export default class EditProfileModal {
	constructor(profileData, onSaveCallback) {
		this.profileData = profileData;
		this.onSaveCallback = onSaveCallback;
		this.element = null;
		this.deleteAvatar = false;

		this.formData = new FormData();
	}

	show() {
		// Create a modal overlay for editing profile
		this.element = document.createElement('div');
		this.element.className = 'modal-overlay';

		const modalContent = document.createElement('div');
		modalContent.className = 'modal-content edit-profile-modal';

		modalContent.innerHTML = `
			<div class="modal-header">
				<h2>Edit Profile</h2>
				<button class="modal-close-btn" id="close-modal-btn">&times;</button>
			</div>
			<div class="modal-body">
				<div class="edit-profile-form">
					<div class="avatar-upload">
						<div class="avatar-preview" id="avatar-preview-container">
							<img src="${this.profileData.avatar || 'default-avatar.png'}" alt="Avatar Preview" id="avatar-preview">
						</div>
						<div class="avatar-buttons">
							<input type="file" id="avatar-upload" accept="image/*" style="display: none;">
							<button id="delete-avatar-btn" class="profile-btn block-btn">Delete Avatar</button>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group form-group-half">
							<label for="edit-username">Username (8 max)</label>
							<input type="text" id="edit-username" value="${this.profileData.username}" maxlength="8">
						</div>
						<div class="form-group form-group-half">
							<label for="current-password">Current Password</label>
							<input type="password" id="current-password">
						</div>
					</div>

					<div class="form-row">
						<div class="form-group form-group-half">
							<label for="new-password">New Password</label>
							<input type="password" id="new-password">
						</div>
						<div class="form-group form-group-half">
							<label for="confirm-password">Confirm New Password</label>
							<input type="password" id="confirm-password">
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button id="save-profile-btn" class="profile-btn action-btn">Save Changes</button>
			</div>
		`;

		this.element.appendChild(modalContent);
		document.body.appendChild(this.element);

		this.setupEventListeners();
	}

	setupEventListeners() {
		// Close modal functionality
		const closeModal = () => {
			this.close();
		};

		document.getElementById('close-modal-btn').addEventListener('click', closeModal);

		// Close modal when clicking outside the content
		this.element.addEventListener('click', (e) => {
			if (e.target === this.element) {
				closeModal();
			}
		});

		// Handle file input change for avatar preview
		const fileInput = document.getElementById('avatar-upload');
		const avatarPreview = document.getElementById('avatar-preview');
		const avatarContainer = document.getElementById('avatar-preview-container');

		// Make the avatar preview container clickable to open file dialog
		avatarContainer.addEventListener('click', () => {
			fileInput.click();
		});

		// Add delete avatar button handler
		document.getElementById('delete-avatar-btn').addEventListener('click', () => {
			// Set preview to default avatar
			avatarPreview.src = 'default-avatar.png';
			// Clear file input
			fileInput.value = '';
			// Set a flag to indicate avatar deletion
			this.deleteAvatar = true;
		});

		fileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					avatarPreview.src = e.target.result;
					// Reset delete flag if uploading a new avatar
					this.deleteAvatar = false;
				};
				reader.readAsDataURL(file);
			}
		});

		// Handle save button click
		document.getElementById('save-profile-btn').addEventListener('click', this.save.bind(this));
	}

	async save() {
		try {
			// Get form values
			const newUsername = document.getElementById('edit-username').value.trim();
			const fileInput = document.getElementById('avatar-upload');
			const avatarFile = fileInput.files[0];
			const currentPassword = document.getElementById('current-password').value;
			const newPassword = document.getElementById('new-password').value;
			const confirmPassword = document.getElementById('confirm-password').value;

			 // Reset formData for new submission
			this.formData = new FormData();
			
			// Process each field and track if any changes were made
			let hasChanges = false;
			
			// Process username updates
			if (this.updateUsername(newUsername)) {
				hasChanges = true;
			}
			
			// Process avatar updates
			if (this.updateAvatar(avatarFile)) {
				hasChanges = true;
			}
			
			// Process password updates
			if (this.updatePassword(currentPassword, newPassword, confirmPassword)) {
				hasChanges = true;
			}
			
			// Check if any changes were made
			if (!hasChanges) {
				alert('No changes to save');
				return;
			}

			// Update UI to show loading state
			const saveBtn = document.getElementById('save-profile-btn');
			saveBtn.textContent = 'Saving...';
			saveBtn.disabled = true;

			// Send the update request
			await api.updateProfile(this.formData);

			// Handle success
			if (typeof this.onSaveCallback === 'function') {
				await this.onSaveCallback();
			}

			// Close modal
			this.close();
		} catch (error) {
			console.error('Failed to update profile:', error);
			alert('Failed to update profile: ' + (error.message || 'Unknown error'));

			// Reset button state
			const saveBtn = document.getElementById('save-profile-btn');
			if (saveBtn) {
				saveBtn.textContent = 'Save Changes';
				saveBtn.disabled = false;
			}
		}
	}

	updateUsername(newUsername) {
		// Check if username has changed
		if (newUsername === this.profileData.username) {
			return false;
		}
		
		// Username validation
		if (!newUsername) {
			alert('Username cannot be empty');
			return false;
		}

		if (newUsername.length > 8) {
			alert('Username cannot be longer than 8 characters');
			return false;
		}
		
		// Add to formData if validation passes
		this.formData.append('new_username', newUsername);
		return true;
	}
	
	updateAvatar(avatarFile) {
		// Check if avatar has changed
		if (!avatarFile && !this.deleteAvatar) {
			return false;
		}
		
		// Add to formData based on whether we're uploading or deleting
		if (avatarFile) {
			this.formData.append('avatar', avatarFile);
		} else if (this.deleteAvatar) {
			this.formData.append('delete_avatar', 'true');
		}
		
		return true;
	}
	
	updatePassword(currentPassword, newPassword, confirmPassword) {
		// Check if password fields are filled
		if (!currentPassword && !newPassword && !confirmPassword) {
			return false;
		}
		
		// Password validation
		if (!currentPassword) {
			alert('Please enter your current password');
			return false;
		}

		if (!newPassword) {
			alert('Please enter your new password');
			return false;
		}

		if (newPassword !== confirmPassword) {
			alert('New password and confirmation do not match');
			return false;
		}

		if (newPassword.length < 8) {
			alert('New password must be at least 8 characters long');
			return false;
		}
		
		// Add to formData if validation passes
		this.formData.append('old_password', currentPassword);
		this.formData.append('new_password1', newPassword);
		this.formData.append('new_password2', confirmPassword);
		return true;
	}

	close() {
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	}
}
