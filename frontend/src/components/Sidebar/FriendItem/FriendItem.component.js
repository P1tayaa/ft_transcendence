import FriendItemOnLoad from './FriendItem.onLoad.js';
import './FriendItem.css';

const FriendItem = (friend) => {
	const render = () => {
		return `
			<li class="friend-item">
				<div class="friend-avatar-container">
					<img data-field="avatar" src="${friend.avatar}" alt="${friend.username}'s avatar" class="friend-avatar">
					<span data-field="status" class="status-indicator"></span>
				</div>
				<span data-field="username" class="username">${friend.username}</span>
			</li>
		`;
	}

	const onLoad = FriendItemOnLoad;

	return { render, onLoad };
};

export default FriendItem;