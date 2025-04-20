# ft_transcendence

A modern web-based multiplayer Pong game with advanced features and additional modules.

## 📋 Project Overview

ft_transcendence is a web application centered around the classic game of Pong, enhanced with modern features like user accounts, tournaments, matchmaking, and much more. This project showcases a comprehensive full-stack development approach, integrating multiple technologies to create a seamless user experience.

## 🎮 Features

- **Classic Pong Game**: Experience the original arcade sensation with modern enhancements
- **User Accounts**: Create profiles, add friends and personalize your experience
- **Tournament System**: Organize and participate in competitive tournaments
- **Real-time Multiplayer**: Play against friends or random opponents online
- **Chat System**: Communicate with other players

## 🧩 Implemented Modules

### Major Modules

1. **Django Backend Framework**: 
   - Robust server-side architecture using Django
   - API endpoints for frontend communication
   - Efficient data processing and game logic

2. **Standard User Management**: 
   - Secure user registration and authentication
   - Unique display names
   - Profile customization with avatars
   - Friend system with online status tracking
   - Match history tracking

3. **Remote Players**:
   - Play Pong with users on different devices
   - Optimized for network stability
   - Lag compensation mechanisms
   - Graceful disconnection handling

4. **Multiplayers (4 Player)**:
   - Extended Pong gameplay for up to 4 players simultaneously
   - Square board with each player controlling one side
   - Balanced gameplay mechanics
   - Special rules for multi-player tournaments

5. **Live Chat**:
   - Direct messaging between users
   - User blocking functionality
   - Game invitations through chat
   - Tournament notifications
   - Profile access through chat interface

6. **AI Opponent**:
   - Challenge an AI player when human opponents aren't available
   - AI simulates human-like behavior with realistic limitations
   - Strategic decision-making for engaging gameplay

7. **3D Game (ThreeJS)**:
   - Enhanced visual experience using ThreeJS/WebGL
   - 3D rendering of the classic Pong game
   - Immersive gameplay with advanced graphics
   - Modern visual effects and animations

8. **Server-Side Pong**:
   - Game logic implemented on the server
   - Reduced cheating possibilities
   - Consistent gameplay experience
   - API for game state manipulation

### Minor Modules

1. **PostgreSQL Database**:
   - Reliable and efficient data storage
   - Complex relationship handling
   - Optimized queries for performance
   - Data integrity and consistency

2. **Game Customization Options**:
   - Power-ups and special abilities
   - Various maps and game modes

3. **Browser Compatibility**:
   - Support for multiple web browsers
   - Consistent user experience across different browsers

## 🛠️ Tech Stack

- **Database**: PostgreSQL
- **Backend**: Django (Python)
- **Real-time Communication**: WebSockets with redis
- **Frontend**: JavaScript with vanilla JS
- **Webserver**: Nginx
- **3D Graphics**: ThreeJS/WebGL
- **Containerization**: Docker

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Modern web browser (Chrome recommended, with support for other browsers)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/p1tayaa/ft_transcendence.git
   cd ft_transcendence
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   Open your browser and navigate to `https://localhost`

## 🎮 Game Modes

- **Classic 2-Player Pong**: The traditional Pong experience, online or local
- **4-Player Mode**: Square board with each player on one side, online or local
- **AI Challenge**: Test your skills against our intelligent AI opponent

## 🔐 Security Features

- Hashed passwords
- Protection against SQL injections and XSS attacks
- HTTPS connections for all communications
- Form validation for all user inputs
- Secure user authentication

## 👥 Contributors

- [Ole](https://github.com/olebol)
- [P1tayaa](https://github.com/p1tayaa)
- [Omathot](https://github.com/omathot)
