import SidebarOnLoad from './Sidebar.onLoad.js';
import './Sidebar.css';

const Sidebar = () => {
	const render = () => {
		return `
		<!-- Social Side Panel -->
		<div class="sidebar" id="sidebar">
			<!-- Current User Profile -->
			<div class="user-profile" id="current-user-profile">
				<div class="avatar-container">
					<img src="" alt="Your Avatar" class="avatar" id="current-user-avatar">
					<span class="status-indicator online"></span>
				</div>
				<span class="username" id="current-user-name">Username</span>
			</div>
			
			<!-- Friend Search -->
			<div class="friend-search">
				<i class="fas fa-search"></i>
				<input type="text" placeholder="Search players..." id="friend-search-input">
			</div>
			
			<!-- Friends List -->
			<ul class="friends-list" id="friends-list">
				<!-- Friends will be added here dynamically -->
				
			</ul>
		</div>
		
		<!-- Friend Item Template -->
		<template id="friend-template">
			
		</template>
		`;
	}

	const onLoad = SidebarOnLoad;

	return { render, onLoad };
};

export default Sidebar;