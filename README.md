# duels.io
A browser-based multiplayer 1v1 arena game

## How to Run Locally

### What you need
- Node.js (make sure it's installed and up to date)
- npm (comes bundled with Node)

### Installation & Setup
1. Clone the repository: `git clone https://github.com`
2. Go to server directory and install the required dependencies to fire up the backend server:
   ```bash
   cd server && npm install
   ```
3. Start the game server:
   ```bash
   npm start
   ```
4. Open a second/split terminal and jump into the client directory. From there, install the dependencies and start the development server using the Vite development environment:
   ```bash
   cd client && npm install && npm run dev
   ```
5. Open `http://localhost:5173` and you're ready to play
