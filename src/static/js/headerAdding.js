import { getURL, postRequest } from './utils.js';

var url = getURL();

const headerContent = `
<header>
    <h1>Welcome to Matchmaking Pong</h1>
    <nav>
        <ul>
            <li><a href="${url}">Home</a></li>
            <li><a href="${url}pages/profile.html">My Profile</a></li>
            <li><a href="${url}pages/social.html">Social</a></li>
            <li><a href=${url}pages/lobby.html>Lobby</a></li>
            <li><a href="${url}pages/gameplay.html">Gameplay</a></li>
            <li><a href="${url}pages/friendList.html">Friend</a></li>
            <li><a href=${url}pages/login.html>Login</a></li>
            </ul>
      </nav>
  </header>
  `;

function addHeader() {
  document.body.insertAdjacentHTML('afterbegin', headerContent);
}

addHeader();
