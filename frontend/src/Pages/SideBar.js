
import React , { useState } from 'react';
import './SideBar.css';
import ImageLoader from '../tool/imageLoad.js'

const apiUrl = 'https://localhost:5000/Profile'

const profileIcon = () => {
  return (
    <div className='profileIcon'>
      < ImageLoader apiUrl={apiUrl} />
    </div>
  );
}


const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  if (!isOpen) {
    return (
      <div className="sidebar-container">
      <button className="toggle-button" onClick={toggleSidebar}>
        {isOpen ? 'Close' : 'Open'} Menu
      </button>
      </div>
    )
  }
  return (
    <div className="sidebar-container">
      <button className="toggle-button" onClick={toggleSidebar}>
        {isOpen ? 'Close' : 'Open'} Menu
      </button>
      <div className={`sidebar `}>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="Game">Game</a></li>
          <li><a href="ProfilePage">ProfilePage</a></li>
        </ul>
        
      </div>
    </div>
  );
};

export default SideBar;
