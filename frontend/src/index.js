import React , { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';


import Page404 from './Pages/404Page.js';
import HomePage from './Pages/HomePage.js';
import ProfilePage from './Pages/ProfilePage.js';
import GamePage from './Pages/GamePage.js';

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ProfilePage" element={<ProfilePage />} />
     <Route path="/Game" element={<GamePage />} />
      <Route path="*" element={<Page404 />} />
    </Routes>
</BrowserRouter>

   );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
