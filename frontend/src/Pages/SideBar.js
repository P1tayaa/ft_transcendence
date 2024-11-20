
import React , { useState } from 'react';
import './SideBar.css';

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
          <li><a href="ProfilePage">ProfilePage</a></li>
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
