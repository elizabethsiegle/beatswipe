import { DurableObjectNamespace, ExecutionContext } from '@cloudflare/workers-types';

export interface Env {
  GAME_SESSIONS: DurableObjectNamespace;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  __STATIC_CONTENT: { get: (key: string, type: 'text') => Promise<string> };
  AI: any;
}

export { GameSession } from './game_session';

const FOOTER_STYLE = `
    footer {
        position: fixed;
        bottom: 0;
        width: 100%;
        padding: 10px;
        background: rgba(48, 48, 48, 0.8);
        text-align: center;
        font-size: 14px;
        color: white;
    }
`;

const FOOTER_HTML = `
    <footer>
        made w/ ❤️ in san francisco🌁 w/ cloudflare workers ai 🤖 && durable objects
    </footer>
`;

const INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BeatSwipe Host</title>
    <style>
        :root {
            --neon-blue: #00f4fc;
            --neon-pink: #ff00ff;
            --neon-yellow: #ffff00;
        }

        body {
            background-color: #000;
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            text-shadow: 0 0 5px var(--neon-blue);
        }

        h1 {
            color: var(--neon-pink);
            text-align: center;
            text-transform: uppercase;
            animation: neonFlicker 1.5s infinite alternate;
            font-size: 2.5em;
            margin: 20px 0;
        }

        #game-container {
            border: 3px solid var(--neon-blue);
            box-shadow: 0 0 20px var(--neon-blue),
                       inset 0 0 20px var(--neon-blue);
            background: rgba(0, 0, 40, 0.3);
        }

        .player-score {
            color: var(--neon-yellow);
            text-shadow: 0 0 5px var(--neon-yellow);
            font-family: 'Press Start 2P', cursive;
        }

        button {
            background: #000;
            color: var(--neon-pink);
            border: 2px solid var(--neon-pink);
            padding: 15px 30px;
            font-family: 'Press Start 2P', cursive;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s;
            text-shadow: 0 0 5px var(--neon-pink);
            box-shadow: 0 0 10px var(--neon-pink);
        }

        button:hover {
            background: var(--neon-pink);
            color: #000;
            transform: scale(1.1);
        }

        @keyframes neonFlicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
                text-shadow: 
                    -0.2rem -0.2rem 1rem #fff,
                    0.2rem 0.2rem 1rem #fff,
                    0 0 2rem var(--neon-pink),
                    0 0 4rem var(--neon-pink),
                    0 0 6rem var(--neon-pink);
            }
            20%, 24%, 55% {
                text-shadow: none;
            }
        }

        #game-container {
            width: 100%;
            height: 70vh;
            background: #111;
            position: relative;
            overflow: hidden;
            border: 2px solid #333;
        }

        .player {
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            transition: all 0.1s ease;
            z-index: 10;
            transform: translate(-50%, -50%);
        }

        .emoji {
            position: absolute;
            font-size: 40px;
            transition: top 0.016s linear;
            user-select: none;
            transform: translate(-50%, -50%);
        }

        .explosion {
            position: absolute;
            font-size: 50px;
            animation: explode 0.5s ease-out forwards;
            z-index: 5;
            transform: translate(-50%, -50%);
        }

        @keyframes explode {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(2);
                opacity: 0;
            }
        }

        #score {
            position: fixed;
            top: 20px;
            right: 20px;
            font-size: 24px;
            font-family: monospace;
        }

        .cactus {
            position: absolute;
            font-size: 40px;
            transition: top 0.016s linear;
            user-select: none;
            transform: translate(-50%, -50%);
            filter: hue-rotate(120deg); /* Make them greenish */
        }

        .bad-explosion {
            position: absolute;
            font-size: 50px;
            animation: explode 0.5s ease-out forwards;
            z-index: 5;
            transform: translate(-50%, -50%);
            color: #ff0000;
        }

        #score.negative {
            color: #ff0000;
        }

        .player-container {
            position: absolute;
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -50%);
            z-index: 10;
        }

        .player {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-bottom: 25px;
        }

        .player-score {
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 14px;
            font-family: monospace;
            white-space: nowrap;
            position: relative;
            top: 20px;
        }

        .player-score.negative {
            color: #ff0000;
        }

        #timer {
            position: fixed;
            top: 20px;
            right: 20px;
            font-size: 24px;
            font-family: monospace;
            background: rgba(0, 0, 0, 0.7);
            padding: 5px 15px;
            border-radius: 10px;
            display: none;
        }

        #leaderboard {
            position: fixed;
            right: 20px;
            top: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            color: white;
        }

        ${FOOTER_STYLE}

        .nav-links {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 100;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 5px;
            margin-right: 10px;
        }
        .nav-links a:hover {
            background: rgba(0, 0, 0, 0.9);
        }

        .game-end-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            animation: fadeIn 0.5s ease-out;
        }

        .game-end-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            animation: slideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .final-score {
            font-size: 48px;
            margin: 20px 0;
            text-shadow: 0 0 10px #fff;
            animation: pulse 2s infinite;
        }

        .leaderboard-title {
            font-size: 24px;
            margin: 20px 0;
            color: #ffd700;
        }

        .leaderboard-entry {
            font-size: 18px;
            margin: 10px 0;
            opacity: 0;
            animation: fadeInUp 0.5s forwards;
        }

        .leaderboard-entry:nth-child(1) { animation-delay: 0.2s; color: gold; }
        .leaderboard-entry:nth-child(2) { animation-delay: 0.4s; color: silver; }
        .leaderboard-entry:nth-child(3) { animation-delay: 0.6s; color: #cd7f32; }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from {
                transform: translate(-50%, -60%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, -50%);
                opacity: 1;
            }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .play-again-btn {
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 18px;
            background: #4CAF50;
            border: none;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .play-again-btn:hover {
            background: #45a049;
            transform: scale(1.1);
        }
    </style>
    <script>
        let ws;
        const players = new Map();
        let nextColor = 0;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const emojis = ['🎵', '🎶', '🎸', '🥁', '🎹', '🎺', '🎻', '🎼'];
        const cacti = ['🌵', '🌵', '🌵'];
        let gameLoop = null;
        let gameTimer = null;
        const GAME_DURATION = 20;
        let timeLeft = GAME_DURATION;
        let gameStarted = false;

        function updateTimer() {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft + 's';
            if (timeLeft <= 0) {
                console.log('Game ended, submitting scores...');
                stopGame();
                
                // Clear any remaining emojis
                const container = document.getElementById('game-container');
                container.querySelectorAll('.emoji, .cactus').forEach(el => el.remove());
                
                // Submit all player scores
                const promises = Array.from(players.values()).map(player => 
                    fetch('/leaderboard', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: player.username,
                            score: player.score
                        })
                    })
                );

                // Wait for all scores to be submitted then redirect
                Promise.all(promises)
                    .then(() => {
                        console.log('All scores submitted');
                        window.location.href = '/leaderboard';
                    })
                    .catch(error => {
                        console.error('Error submitting scores:', error);
                        window.location.href = '/leaderboard';
                    });
            }
        }

        function updatePlayerCount() {
            const count = players.size;
            document.getElementById('player-count').textContent = 
                count + ' player' + (count === 1 ? '' : 's') + ' connected';
                
            // Update start button state
            document.getElementById('start-game-btn').disabled = count === 0 || gameStarted;
        }

        function startGame() {
            if (gameStarted || players.size === 0) return;
    
            gameStarted = true;
            document.getElementById('start-game-btn').disabled = true;
            document.getElementById('waiting-text').style.display = 'none';
            document.getElementById('timer').style.display = 'block';
            
            timeLeft = GAME_DURATION;
            updateTimer();
            
            // Only start intervals if game is explicitly started
            gameLoop = setInterval(() => {
                if (!gameStarted) {
                    clearInterval(gameLoop);
                    return;
                }
                updateGame();
            }, 16);
            
            gameTimer = setInterval(() => {
                if (!gameStarted) {
                    clearInterval(gameTimer);
                    return;
                }
                updateTimer();
            }, 1000);
            if (ws?.readyState === 1) {
                ws.send(JSON.stringify({ type: 'gameStart' }));
            }
        }

        function stopGame() {
            console.log('Stopping game...');
            if (gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }
        }

        function spawnEmoji(isCactus = false) {
            const container = document.getElementById('game-container');
            const emoji = document.createElement('div');
            emoji.className = isCactus ? 'cactus' : 'emoji';
            emoji.textContent = isCactus ? 
                cacti[Math.floor(Math.random() * cacti.length)] : 
                emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = (Math.random() * container.clientWidth) + 'px';
            emoji.style.top = '0px';
            container.appendChild(emoji);
            return emoji;
        }

        function createExplosion(x, y, isBad = false) {
            const explosion = document.createElement('div');
            explosion.className = isBad ? 'bad-explosion' : 'explosion';
            explosion.textContent = isBad ? '💀' : '💥';
            explosion.style.left = x + 'px';
            explosion.style.top = y + 'px';
            document.getElementById('game-container').appendChild(explosion);
            setTimeout(() => explosion.remove(), 500);
        }

        async function generateUsername() {
            try {
                const response = await fetch('/generate-username');
                const data = await response.json();
                console.log('Generated username:', data);
                return data || 'Player' + Math.floor(Math.random() * 100);
            } catch (error) {
                console.error('Error generating username:', error);
                return 'Player' + Math.floor(Math.random() * 100);
            }
        }

        function handleMove(playerId, x, y) {
            const player = players.get(playerId);
            if (!player) {
                // Create new player if doesn't exist
                const container = document.createElement('div');
                container.className = 'player-container';
                
                const playerEl = document.createElement('div');
                playerEl.className = 'player';
                playerEl.style.backgroundColor = colors[nextColor % colors.length];
                
                const scoreEl = document.createElement('div');
                scoreEl.className = 'player-score';
                
                container.appendChild(playerEl);
                container.appendChild(scoreEl);
                document.getElementById('game-container').appendChild(container);
                
                // Generate username when creating new player
                generateUsername().then(username => {
                    players.set(playerId, {
                        element: container,
                        x: 50,
                        y: 50,
                        score: 0,
                        username: username
                    });
                    
                    // Update score display with username
                    scoreEl.textContent = username + ': 0';
                    nextColor++;
                    updatePlayerCount();
                });
            }

            // Update position
            const updatedPlayer = players.get(playerId);
            if (updatedPlayer) {
                const gameContainer = document.getElementById('game-container');
                updatedPlayer.x = Math.min(Math.max(((x + 90) / 180) * gameContainer.clientWidth, 0), gameContainer.clientWidth);
                updatedPlayer.y = Math.min(Math.max(((y + 180) / 360) * gameContainer.clientHeight, 0), gameContainer.clientHeight);

                updatedPlayer.element.style.left = updatedPlayer.x + 'px';
                updatedPlayer.element.style.top = updatedPlayer.y + 'px';
            }
        }

        function updateScore(playerId, points) {
            const player = players.get(playerId);
            if (player) {
                player.score += points;
                const scoreEl = player.element.querySelector('.player-score');
                scoreEl.textContent = player.username + ': ' + player.score;
                scoreEl.className = 'player-score' + (player.score < 0 ? ' negative' : '');
            }
        }

        function checkCollision(player, emoji) {
            const playerRect = player.element.getBoundingClientRect();
            const emojiRect = emoji.getBoundingClientRect();
            const dx = (playerRect.left + playerRect.right) / 2 - (emojiRect.left + emojiRect.right) / 2;
            const dy = (playerRect.top + playerRect.bottom) / 2 - (emojiRect.top + emojiRect.bottom) / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 50;
        }

        function updateGame() {
            if (!gameStarted) return;
            
            const container = document.getElementById('game-container');
            if (Math.random() < 0.1) {
                spawnEmoji(Math.random() < 0.2);
            }

            // Update existing emojis
            const emojis = container.getElementsByClassName('emoji');
            const cacti = container.getElementsByClassName('cactus');
            
            function updateElements(elements, isCactus) {
                Array.from(elements).forEach(element => {
                    const currentTop = parseFloat(element.style.top) || 0;
                    element.style.top = (currentTop + 2) + 'px';

                    if (currentTop > container.clientHeight) {
                        element.remove();
                        return;
                    }

                    players.forEach((player, playerId) => {
                        if (checkCollision(player, element)) {
                            createExplosion(
                                element.offsetLeft,
                                element.offsetTop,
                                isCactus
                            );
                            element.remove();
                            updateScore(playerId, isCactus ? -50 : 10);
                        }
                    });
                });
            }

            updateElements(emojis, false);
            updateElements(cacti, true);
        }

        function connectWebSocket() {
            console.log('Host connecting...');
            ws = new WebSocket(\`\${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}/\${window.location.host}/ws\`);
            
            ws.onopen = () => {
                console.log('Host connected');
                ws.send(JSON.stringify({ type: 'host' }));
            };

            ws.onmessage = (event) => {
                console.log('Host received:', event.data);
                const data = JSON.parse(event.data);
                if (data.type === 'move') {
                    handleMove(data.playerId, data.x, data.y);
                }
            };

            ws.onclose = () => {
                console.log('Host disconnected');
                setTimeout(connectWebSocket, 1000);
            };

            ws.onerror = (error) => {
                console.error('Host WebSocket error:', error);
            };
        }

        function removePlayer(playerId) {
            const player = players.get(playerId);
            if (player) {
                player.element.remove();
                players.delete(playerId);
                updatePlayerCount();
            }
            // if (players.has(playerId)) {
            //     const player = players.get(playerId);
            //     player.element.remove();
            //     players.delete(playerId);
                
            //     if (players.size === 0) {
            //         stopGame();
            //     }
            // }
        }

        document.addEventListener('DOMContentLoaded', () => {
            connectWebSocket();
            updateLeaderboard();
            setInterval(updateLeaderboard, 5000);
        });

        // Add cleanup for disconnected players
        ws.addEventListener('close', () => {
            // Clear all players
            players.forEach(player => player.element.remove());
            players.clear();
            nextColor = 0;
        });
        window.addEventListener('beforeunload', () => {
            players.forEach(player => player.element.remove());
            players.clear();
        });

        // Add leaderboard display
        async function updateLeaderboard() {
            try {
                const response = await fetch('/leaderboard');
                const scores = await response.json();
                console.log('Fetched leaderboard:', scores);
                
                const leaderboardEl = document.getElementById('leaderboard');
                if (leaderboardEl) {
                    leaderboardEl.innerHTML = scores
                        .map((score, index) => 
                            \`<div>\${index + 1}. \${score.username}: \${score.score}</div>\`)
                        .join('');
                }
            } catch (error) {
                console.error('Error updating leaderboard:', error);
            }
        }

        // Update leaderboard periodically
        setInterval(updateLeaderboard, 5000);

        function showGameEnd(scores) {
            const playerScores = Array.from(players.values())
                .map(({username, score}) => ({username, score}));

            const content = document.createElement('div');
            content.className = 'game-end-content';
            content.innerHTML = 
                '<h1>Game Over!</h1>' +
                Array.from(players.values()).map(player => 
                    '<div class="final-score">' +
                    player.username + ': ' + player.score +
                    '</div>'
                ).join('');
        }

        function createConfetti() {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
            const confetti = document.createElement('div');
            confetti.style.cssText = \`
                position: fixed;
                width: 10px;
                height: 10px;
                background: \${colors[Math.floor(Math.random() * colors.length)]};
                left: \${Math.random() * 100}vw;
                top: -10px;
                opacity: 1;
                transform: rotate(\${Math.random() * 360}deg);
                pointer-events: none;
                animation: fall \${Math.random() * 3 + 2}s linear forwards;
            \`;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    </script>
</head>
<body>
    <div class="nav-links">
        <a href="/">Game</a>
        <a href="/leaderboard">Leaderboard</a>
    </div>
    <h1>BeatSwipe Host</h1>
    <div id="player-count">0 players connected</div>
    <button id="start-game-btn" onclick="startGame()" disabled>Start Game</button>
    <div id="waiting-text">Waiting for players to join...</div>
    <div id="game-container"></div>
    <div id="timer">20s</div>
    <div id="leaderboard"></div>
    <div id="qr-section">
        <h2>Join the game on your phone!</h2>
        <p>Visit: <a href="/play">/play</a></p>
    </div>
    ${FOOTER_HTML}
</body>
</html>`;

const PLAY_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>BeatSwipe Player</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #000;
            color: white;
            font-family: Arial, sans-serif;
            touch-action: none;
        }
        #status {
            text-align: center;
            padding: 20px;
            font-size: 18px;
        }
        #game-area {
            width: 100%;
            height: 70vh;
            touch-action: none;
        }
    </style>
    <script>
        const playerId = localStorage.getItem('playerId') || Math.random().toString(36).substr(2, 9);
        localStorage.setItem('playerId', playerId);
        
        let ws = null;
        let isConnected = false;

        let lastX = 0;
        let lastY = 0;

        function handleMove(event) {
            if (!isConnected) return;
            
            const touch = event.touches ? event.touches[0] : event;
            const rect = event.target.getBoundingClientRect();
            
            // Only update position if we have a touch/mouse event
            if (touch) {
                lastX = ((touch.clientX - rect.left) / rect.width) * 180 - 90;
                lastY = ((touch.clientY - rect.top) / rect.height) * 360 - 180;
                
                ws.send(JSON.stringify({
                    type: 'move',
                    playerId,
                    x: lastX,
                    y: lastY
                }));
            }
        }

        function connect() {
            if (ws) return;
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(\`\${protocol}//\${window.location.host}/ws\`);
            
            ws.onopen = () => {
                console.log('Connected');
                isConnected = true;
                updateStatus('Connected! Tap this screen once, wait 2 seconds, and then move your finger to move around the screen.Waiting for game to start...');
                
                ws.send(JSON.stringify({
                    type: 'connect',
                    playerId
                }));
            };
            
            const gameArea = document.getElementById('game-area');
            gameArea.addEventListener('touchmove', handleMove);
            gameArea.addEventListener('mousemove', handleMove);
        }

        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }

        window.addEventListener('load', connect);
        window.addEventListener('beforeunload', () => {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'disconnect',
                    playerId
                }));
            }
        });
    </script>
</head>
<body>
    <div id="status">Connecting...</div>
    <div id="game-area"></div>
</body>
</html>`;

const LEADERBOARD_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BeatSwipe Leaderboard</title>
    <style>
        body {
            margin: 0;
            background: #000;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .leaderboard {
            background: #111;
            padding: 20px;
            border-radius: 10px;
            width: 100%;
            max-width: 600px;
        }

        .entry {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #333;
        }

        .entry:nth-child(1) { color: gold; }
        .entry:nth-child(2) { color: silver; }
        .entry:nth-child(3) { color: #cd7f32; }

        .nav-links {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 100;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 5px;
            margin-right: 10px;
        }
        .nav-links a:hover {
            background: rgba(0, 0, 0, 0.9);
        }

        ${FOOTER_STYLE}
    </style>
    <script>
        async function updateLeaderboard() {
            try {
                console.log('Fetching leaderboard...');
                const response = await fetch('/leaderboard', {
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const scores = await response.json();
                console.log('Received scores:', scores);
                
                const leaderboard = document.getElementById('leaderboard');
                if (scores && scores.length > 0) {
                    leaderboard.innerHTML = scores.map((entry, index) => \`
                        <div class="entry">
                            <span>#\${index + 1} \${entry.username || 'Anonymous'}</span>
                            <span>\${entry.score}</span>
                        </div>
                    \`).join('');
                } else {
                    leaderboard.innerHTML = '<div class="entry">No scores yet!</div>';
                }
            } catch (error) {
                console.error('Error updating leaderboard:', error);
                document.getElementById('leaderboard').innerHTML = 
                    '<div class="entry">Error loading scores: ' + error.message + '</div>';
            }
        }

        // Update every 5 seconds
        setInterval(updateLeaderboard, 5000);
        document.addEventListener('DOMContentLoaded', updateLeaderboard);
    </script>
</head>
<body>
    <div class="nav-links">
        <a href="/">Game</a>
        <a href="/leaderboard">Leaderboard</a>
    </div>
    <h1>BeatSwipe Leaderboard</h1>
    <div class="leaderboard" id="leaderboard">
        Loading...
    </div>
    <p><a href="/" style="color: white;">Back to Game</a></p>
    ${FOOTER_HTML}
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const url = new URL(request.url);
      console.log('Worker request:', url.pathname);

      // Handle WebSocket upgrade
      if (request.headers.get("Upgrade") === "websocket") {
        console.log('WebSocket connection attempt');
        const id = env.GAME_SESSIONS.idFromName('default');
        console.log('Created DO ID');
        const session = env.GAME_SESSIONS.get(id);
        console.log('Got DO instance');
        
        const wsRequest = new Request(request.url, {
          method: 'GET',
          headers: { 'Upgrade': 'websocket' }
        });
        const response = await session.fetch(wsRequest as any);
        console.log('Got DO response:', response.status);
        return response;
      }

      if (url.pathname === '/generate-username') {

        const messages = [
            { role: "system", content: "You must return only a username contained within <username></username>, and nothing else. If you do not follow these instructions, you will lose the $100." },
            {
                role: "user",
                content: `
                    Create a single username related to Cloudflare and programming. 
                    It should contain one word followed by a number, enclosed in <username></username>.
                    Example: <username>workersai7</username>.
                    Follow the format exactly and do not return anything outside of the <username> tags or else.`,
                temperature: 0.6,
            },
        ];
        
        const ai_response = await env.AI.run("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", { messages }, {
            gateway: {
                id: "beatswipe-gateway"
            }
        });
        
        // TypeScript to parse the username from the response
        const parseUsername = (response: string): string | null => {
            // Use regex to match the first occurrence of <username></username>
            const match = response.match(/<username>(.*?)<\/username>/);
            return match ? match[1].trim() : null; // Return the first username or null if not found
        };
        const username = parseUsername(ai_response.response);
        console.log('Username:', username);
        return Response.json(username);
        
        // return new Response(JSON.stringify({ username }), {
        //   headers: { 'Content-Type': 'application/json' }
        // });
      }

      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(INDEX_HTML, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      if (url.pathname === '/play' || url.pathname === '/play.html') {
        return new Response(PLAY_HTML, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      if (url.pathname === '/leaderboard') {
        if (request.method === 'POST' || request.headers.get('Accept') === 'application/json') {
          const id = env.GAME_SESSIONS.idFromName('default');
          const session = env.GAME_SESSIONS.get(id);
          return await session.fetch(request as any);
        }
        return new Response(LEADERBOARD_HTML, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}; 