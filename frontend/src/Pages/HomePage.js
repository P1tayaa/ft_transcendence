
import SideBar from './SideBar.js';

function Wellcome() {
  return (
  <div className="WellcomeInfo">
     <h1>Welcome to the Pong Multiplayer Site!</h1>
     <p>Here, you can play Pong with your friends in real-time. Stay tuned for updates!</p>
    </div>
  )
}

function StartGameButton() {
  return (
  <div className="StartGameButton">
      <ul><a href="GameQueu#Simple">Simple Pong Queu</a></ul>
      <ul><a href="GameQueu#Mode1">Mode 1 Pong Queu</a></ul>
      <ul><a href="GameQueu#Mode2">Mode 2 Pong Queu</a></ul>
  </div>
  )
}


function HomePage() {
  return (
    <div className="HomePage">
        <SideBar />
        <Wellcome />
       <StartGameButton /> 
    </div>

  );
}


export default HomePage; 
