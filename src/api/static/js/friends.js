async function addFriend(username) {
    try {
        const response = await fetch('../api/add_friend/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({
                username: username
            })
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add friend');
        }
        
        document.getElementById('friendStatus').textContent = 'Friend added successfully!';
        document.getElementById('friendSearchInput').value = ''; // Clear input
        return data;
    } catch (error) {
        document.getElementById('friendStatus').textContent = 'Error: ' + error.message;
        console.error('Error adding friend:', error);
        throw error;
    }
}
// Add click event listener to the button
// document.getElementById('addFriendButton').addEventListener('click', async () => {
//     const username = document.getElementById('friendSearchInput').value.trim();
//     if (!username) {
//         document.getElementById('friendStatus').textContent = 'Please enter a username';
//         return;
//     }
    
//     try {
//         await addFriend(username);
//     } catch (error) {
//         // Error is already handled in addFriend function
//     }
// });
