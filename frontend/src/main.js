import router from './router.js';
import './styles.css';

import user from './User.js';
import sidebar from './components/Sidebar/Sidebar.js';

document.addEventListener('DOMContentLoaded', async () => {
	await user.init();

	if (user.authenticated) {
		router.navigate(window.location.pathname);
	} else {
		console.warn('Token not found, redirecting to login');
		router.navigate('/login');
	}
});
