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

function Chat() {
  return (
    <div className="Chat">
    </div>
  );
}

function FriendList() {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {

  }
  return (
    <div className="FriendList">
    </div>
  );
}


function ProfilePage() {
  return (
    <div className="ProfilePage">
        <SideBar />
        <MyProfile />
        <FriendList />
    </div>

  );
}


export default ProfilePage; 
