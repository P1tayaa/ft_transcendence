const footerContent = `
    <footer>
        <p>&copy; 2024 Matchmaking Pong. All rights reserved.</p>
    </footer>
`;

function addFooter() {
    document.body.insertAdjacentHTML('beforeend', footerContent);
}

addFooter();
