import React , { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';
import logo from './logo.svg';
import './App.css';
import SideBar from './SideBar.js';


function Home() {
  return (
    <div className="App">
    <SideBar />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function Blogs() {
  return (
    <div className="Blogs">
<SideBar />
       <h1>
        Blog
        </h1>
    </div>
  );
}

function Contact() {
  return (
    <div className="Contact">
<SideBar />
       <h1>
        Blog
        </h1>
    </div>
  );
}

function NotFound() {
  return (
    <div className="Blogs">
    <SideBar />
       <h1>
        NoPage 
        </h1>
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<Blogs />} />
      <Route path="/settings" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
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
