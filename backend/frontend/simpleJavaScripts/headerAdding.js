
const url = 'http://localhost:5173/';

const headerContent = `
<header>
    <h1>Welcome to Matchmaking Pong</h1>
    <nav>
        <ul>
            <li><a href="${url}">Home</a></li>
            <li><a href="${url}pages/profile.html">My Profile</a></li>
            <li><a href="${url}pages/chat.html">Chat</a></li>
            <li><a href="${url}pages/gameplay.html">Gameplay</a></li>
            <li><a href="${url}pages/friendList.html">Friend</a></li>
        </ul>
    </nav>
</header>
`;

function addHeader() {
    document.body.insertAdjacentHTML('afterbegin', headerContent);
}

addHeader();
