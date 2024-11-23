import React , { useState } from 'react';
import './ProfilePage.css';
import SideBar from './SideBar.js';


export const people = [{
  id: 0,
  name: 'Creola Katherine Johnson',
  last_message: 'spaceflight calculations',
}, {
  id: 1,
  name: 'Mario José Molina-Pasquel Henríquez',
  last_message: 'discovery of Arctic ozone hole',
}, {
  id: 2,
  name: 'Mohammad Abdus Salam',
  last_message: 'electromagnetism theory',
}, {
  id: 3,
  name: 'Percy Lavon Julian',
  last_message: 'pioneering cortisone drugs, steroids and birth control pills',
}, {
  id: 4,
  name: 'Subrahmanyan Chandrasekhar',
  last_message: 'white dwarf star mass calculations',
}];


function MyProfile() {
  return (
    <div className="MyProfile">
      <img src="profile-pic.png" alt="Profile Picture" width="150" height="150"></img>
      <p><strong>Username:</strong> Gamer123</p>
      <p><strong>Number of Friends:</strong> 45</p>
      <p><strong>Wins:</strong> 30</p>
      <p><strong>Losses:</strong> 15</p>
    </div>
  );
}



function FriendList({ onFriendSelect }) {
  const [friends, setFriends] = useState(people);

  return (
    <div className="FriendList">
      {friends.map((friend) => (
        <button
          key={friend.id} // Provide a unique key for each list item
          onClick={() => onFriendSelect(friend.id)}
        >
          {friend.name}
        </button>
      ))}
    </div>
  );
}

function SocialPart() {
  const [isOpen, setIsOpen] = useState(false);
  const [curFriendID, setCurFriendID] = useState(null);

  const handleFriendSelect = (friendId) => {
    setCurFriendID(friendId);
    setIsOpen(true);
  };

  return (
    <div className="SocialPart">
      <FriendList onFriendSelect={handleFriendSelect} />
      {isOpen && <Chat friendId={curFriendID} />}
    </div>
  );
}

function Chat({ friendId }) {
  return (
    <div className="Chat">
      <p>Chatting with friend ID: {friendId}</p>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="ProfilePage">
        <SideBar />
        <MyProfile />
      <SocialPart />
    </div>

  );
}


export default ProfilePage; 
