class BeatSwipeController {
  constructor() {
    this.ws = null;
    this.playerId = crypto.randomUUID();
    this.swipeArea = document.getElementById('swipe-area');
    this.setupWebSocket();
    this.setupSwipeDetection();
  }

  setupWebSocket() {
    const sessionId = new URLSearchParams(window.location.search).get('session');
    this.ws = new WebSocket(`wss://${location.host}/api/session/${sessionId}`);
    
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'join',
        playerId: this.playerId
      }));
    };
  }

  setupSwipeDetection() {
    let startX, startY;

    this.swipeArea.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    this.swipeArea.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const direction = this.getSwipeDirection(startX, startY, endX, endY);
      
      if (direction) {
        this.ws.send(JSON.stringify({
          type: 'action',
          playerId: this.playerId,
          action: {
            type: 'swipe',
            direction
          }
        }));
      }
    });
  }

  getSwipeDirection(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // Add swipe detection logic here
  }
}

new BeatSwipeController(); 