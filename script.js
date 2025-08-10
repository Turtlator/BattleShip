class BattleshipGame {
    constructor() {
        this.boardSize = 10;
        this.ships = [
            { name: 'carrier', size: 5, count: 1 },
            { name: 'battleship', size: 4, count: 1 },
            { name: 'cruiser', size: 3, count: 1 },
            { name: 'submarine', size: 3, count: 1 },
            { name: 'destroyer', size: 2, count: 1 }
        ];
        
        this.gamePhase = 'mode-selection'; // 'mode-selection', 'placement', 'battle', 'gameOver'
        this.gameMode = null; // 'vs-player' or 'vs-ai'
        this.currentPlayer = 1;
        this.selectedShip = null;
        this.shipOrientation = 'horizontal'; // 'horizontal' or 'vertical'
        
        this.player1Board = this.createEmptyBoard();
        this.player2Board = this.createEmptyBoard();
        this.player1Ships = this.createShipsArray();
        this.player2Ships = this.createShipsArray();
        this.player1PlacedShips = [];
        this.player2PlacedShips = [];
        
        this.initializeDOM();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    createEmptyBoard() {
        return Array(this.boardSize).fill(null).map(() => 
            Array(this.boardSize).fill(null)
        );
    }
    
    createShipsArray() {
        const ships = [];
        this.ships.forEach(shipType => {
            for (let i = 0; i < shipType.count; i++) {
                ships.push({
                    name: shipType.name,
                    size: shipType.size,
                    placed: false
                });
            }
        });
        return ships;
    }
    
    initializeDOM() {
        this.createBoard('player1-board');
        this.createBoard('player2-board');
    }
    
    createBoard(boardId) {
        const boardElement = document.getElementById(boardId);
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.board = boardId;
                boardElement.appendChild(cell);
            }
        }
    }
    
    attachEventListeners() {
        // Game mode selection
        document.getElementById('vs-player-btn').addEventListener('click', () => this.selectGameMode('vs-player'));
        document.getElementById('vs-ai-btn').addEventListener('click', () => this.selectGameMode('vs-ai'));
        
        // Ship selection
        document.querySelectorAll('.ship-item').forEach(item => {
            item.addEventListener('click', (e) => this.selectShip(e));
        });
        
        // Board clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e);
            }
        });
        
        // Mouse hover for ship preview
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('cell') && this.selectedShip && this.gamePhase === 'placement') {
                this.showShipPreview(e);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('cell')) {
                this.hideShipPreview();
            }
        });
        
        // Control buttons
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotateShip());
        document.getElementById('ready-btn').addEventListener('click', () => this.playerReady());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
    }
    
    selectShip(e) {
        if (this.gamePhase !== 'placement') return;
        
        const shipName = e.target.dataset.ship;
        const shipSize = parseInt(e.target.dataset.size);
        
        // Check if ship is already placed
        const currentShips = this.currentPlayer === 1 ? this.player1Ships : this.player2Ships;
        const ship = currentShips.find(s => s.name === shipName && !s.placed);
        
        if (!ship) return;
        
        // Remove previous selection
        document.querySelectorAll('.ship-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select new ship
        e.target.classList.add('selected');
        this.selectedShip = { name: shipName, size: shipSize };
        this.updateMessage(`Selected ${shipName} (${shipSize} cells). Click on your board to place it.`);
    }
    
    handleCellClick(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const boardId = e.target.dataset.board;
        
        if (this.gamePhase === 'placement') {
            if (boardId === 'player1-board' && this.currentPlayer === 1) {
                this.placeShip(row, col, this.player1Board, this.player1Ships, this.player1PlacedShips);
            } else if (boardId === 'player2-board' && this.currentPlayer === 2) {
                this.placeShip(row, col, this.player2Board, this.player2Ships, this.player2PlacedShips);
            }
        } else if (this.gamePhase === 'battle') {
            if (boardId === 'player2-board' && this.currentPlayer === 1) {
                this.makeAttack(row, col, this.player2Board, this.player2PlacedShips);
            } else if (boardId === 'player1-board' && this.currentPlayer === 2) {
                this.makeAttack(row, col, this.player1Board, this.player1PlacedShips);
            }
        }
    }
    
    placeShip(row, col, board, ships, placedShips) {
        if (!this.selectedShip) {
            this.updateMessage('Please select a ship first!');
            return;
        }
        
        if (!this.canPlaceShip(row, col, this.selectedShip.size, this.shipOrientation, board)) {
            this.updateMessage('Cannot place ship here! Make sure it fits and doesn\'t overlap.');
            return;
        }
        
        // Place the ship
        const shipCells = [];
        for (let i = 0; i < this.selectedShip.size; i++) {
            const newRow = this.shipOrientation === 'horizontal' ? row : row + i;
            const newCol = this.shipOrientation === 'horizontal' ? col + i : col;
            board[newRow][newCol] = this.selectedShip.name;
            shipCells.push({ row: newRow, col: newCol });
        }
        
        // Mark ship as placed
        const ship = ships.find(s => s.name === this.selectedShip.name && !s.placed);
        ship.placed = true;
        placedShips.push({
            name: this.selectedShip.name,
            size: this.selectedShip.size,
            cells: shipCells,
            hits: 0
        });
        
        // Update DOM
        this.renderBoard(this.currentPlayer === 1 ? 'player1-board' : 'player2-board', board, true);
        
        // Mark ship item as placed
        const shipItem = document.querySelector(`[data-ship="${this.selectedShip.name}"].selected`);
        if (shipItem) {
            shipItem.classList.add('placed');
            shipItem.classList.remove('selected');
        }
        
        this.selectedShip = null;
        this.checkAllShipsPlaced();
    }
    
    canPlaceShip(row, col, size, orientation, board) {
        for (let i = 0; i < size; i++) {
            const newRow = orientation === 'horizontal' ? row : row + i;
            const newCol = orientation === 'horizontal' ? col + i : col;
            
            // Check bounds
            if (newRow >= this.boardSize || newCol >= this.boardSize || newRow < 0 || newCol < 0) {
                return false;
            }
            
            // Check if cell is already occupied
            if (board[newRow][newCol] !== null) {
                return false;
            }
        }
        return true;
    }
    
    showShipPreview(e) {
        if (!this.selectedShip) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const board = this.currentPlayer === 1 ? this.player1Board : this.player2Board;
        
        this.hideShipPreview();
        
        const canPlace = this.canPlaceShip(row, col, this.selectedShip.size, this.shipOrientation, board);
        const boardId = this.currentPlayer === 1 ? 'player1-board' : 'player2-board';
        
        for (let i = 0; i < this.selectedShip.size; i++) {
            const newRow = this.shipOrientation === 'horizontal' ? row : row + i;
            const newCol = this.shipOrientation === 'horizontal' ? col + i : col;
            
            if (newRow >= 0 && newRow < this.boardSize && newCol >= 0 && newCol < this.boardSize) {
                const cell = document.querySelector(`[data-board="${boardId}"][data-row="${newRow}"][data-col="${newCol}"]`);
                if (cell) {
                    cell.classList.add(canPlace ? 'preview' : 'invalid');
                }
            }
        }
    }
    
    hideShipPreview() {
        document.querySelectorAll('.preview, .invalid').forEach(cell => {
            cell.classList.remove('preview', 'invalid');
        });
    }
    
    rotateShip() {
        this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        this.updateMessage(`Ship orientation: ${this.shipOrientation}`);
    }
    
    checkAllShipsPlaced() {
        const currentShips = this.currentPlayer === 1 ? this.player1Ships : this.player2Ships;
        const allPlaced = currentShips.every(ship => ship.placed);
        
        if (allPlaced) {
            document.getElementById('ready-btn').disabled = false;
            this.updateMessage('All ships placed! Click Ready when you\'re done.');
        } else {
            this.updateMessage('Continue placing your ships.');
        }
    }
    
    playerReady() {
        if (this.currentPlayer === 1) {
            if (this.gameMode === 'vs-ai') {
                this.startBattle();
            } else {
                this.currentPlayer = 2;
                this.selectedShip = null;
                this.hidePlayer1Board();
                this.showPlayer2Setup();
                this.updateMessage('Player 2: Place your ships!');
            }
        } else {
            this.startBattle();
        }
        
        document.getElementById('ready-btn').disabled = true;
        this.updateDisplay();
    }
    
    hidePlayer1Board() {
        const player1Board = document.getElementById('player1-board');
        player1Board.querySelectorAll('.cell').forEach(cell => {
            if (cell.classList.contains('ship')) {
                cell.classList.remove('ship');
            }
        });
    }
    
    showPlayer2Setup() {
        document.querySelectorAll('.ship-item').forEach(item => {
            item.classList.remove('placed', 'selected');
        });
    }
    
    startBattle() {
        this.gamePhase = 'battle';
        this.currentPlayer = 1;
        this.hideAllShips();
        this.updateMessage('Battle begins! Player 1, click on enemy waters to attack!');
        this.updateDisplay();
    }
    
    hideAllShips() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('ship');
        });
    }
    
    makeAttack(row, col, board, placedShips) {
        const cell = document.querySelector(`[data-board="${this.currentPlayer === 1 ? 'player2-board' : 'player1-board'}"][data-row="${row}"][data-col="${col}"]`);
        
        // Check if already attacked
        if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
            this.updateMessage('You already attacked this cell!');
            return;
        }
        
        const isHit = board[row][col] !== null;
        
        if (isHit) {
            cell.classList.add('hit');
            const shipName = board[row][col];
            
            // Find the ship and increment hits
            const ship = placedShips.find(s => s.name === shipName);
            ship.hits++;
            
            // Check if ship is sunk
            if (ship.hits === ship.size) {
                ship.cells.forEach(cellPos => {
                    const shipCell = document.querySelector(`[data-board="${this.currentPlayer === 1 ? 'player2-board' : 'player1-board'}"][data-row="${cellPos.row}"][data-col="${cellPos.col}"]`);
                    shipCell.classList.add('sunk');
                });
                this.updateMessage(`Hit! You sunk the ${shipName}!`);
                
                // Check for win
                if (this.checkWin(placedShips)) {
                    this.endGame();
                    return;
                }
            } else {
                this.updateMessage('Hit!');
            }
            
            // Hit = continue turn, but check if it's AI vs AI mode
            if (this.gameMode === 'vs-ai' && this.currentPlayer === 2) {
                setTimeout(() => {
                    this.makeAIMove();
                }, 1500);
            } else if (this.gameMode === 'vs-player') {
                this.updateMessage(`Hit! Player ${this.currentPlayer} gets another turn!`);
            }
        } else {
            cell.classList.add('miss');
            this.updateMessage('Miss!');
            this.switchPlayer();
        }
    }
    
    checkWin(placedShips) {
        return placedShips.every(ship => ship.hits === ship.size);
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();
        
        if (this.gameMode === 'vs-ai' && this.currentPlayer === 2) {
            this.updateMessage('AI is thinking...');
            setTimeout(() => {
                this.makeAIMove();
            }, 1000);
        } else {
            this.updateMessage(`Player ${this.currentPlayer}'s turn! Click on enemy waters to attack.`);
        }
    }
    
    makeAIMove() {
        // Simple AI: random attack on unattacked cells
        const availableCells = [];
        const board = document.getElementById('player1-board');
        
        board.querySelectorAll('.cell').forEach(cell => {
            if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                availableCells.push({
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col)
                });
            }
        });
        
        if (availableCells.length === 0) return;
        
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        this.makeAttack(randomCell.row, randomCell.col, this.player1Board, this.player1PlacedShips);
    }
    
    
    endGame() {
        this.gamePhase = 'gameOver';
        this.updateMessage(`Game Over! Player ${this.currentPlayer} wins!`);
        this.updateDisplay();
    }
    
    renderBoard(boardId, board, showShips = false) {
        const boardElement = document.getElementById(boardId);
        const cells = boardElement.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (showShips && board[row][col] !== null) {
                cell.classList.add('ship');
            }
        });
    }
    
    selectGameMode(mode) {
        this.gameMode = mode;
        this.gamePhase = 'placement';
        
        // Hide mode selection
        document.getElementById('game-mode-selection').style.display = 'none';
        
        if (mode === 'vs-ai') {
            this.placeAIShips();
        }
        
        this.updateDisplay();
        this.updateMessage('Click on ships to select them, then click on your board to place them!');
    }
    
    placeAIShips() {
        // Automatically place AI ships randomly
        const aiShips = [...this.player2Ships];
        
        aiShips.forEach(ship => {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * this.boardSize);
                const col = Math.floor(Math.random() * this.boardSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                if (this.canPlaceShip(row, col, ship.size, orientation, this.player2Board)) {
                    const shipCells = [];
                    for (let i = 0; i < ship.size; i++) {
                        const newRow = orientation === 'horizontal' ? row : row + i;
                        const newCol = orientation === 'horizontal' ? col + i : col;
                        this.player2Board[newRow][newCol] = ship.name;
                        shipCells.push({ row: newRow, col: newCol });
                    }
                    
                    ship.placed = true;
                    this.player2PlacedShips.push({
                        name: ship.name,
                        size: ship.size,
                        cells: shipCells,
                        hits: 0
                    });
                    placed = true;
                }
            }
        });
    }
    
    updateDisplay() {
        if (this.gamePhase === 'mode-selection') {
            document.querySelector('.game-info').style.display = 'none';
            document.querySelector('.game-boards').style.display = 'none';
            document.querySelector('.game-messages').style.display = 'none';
            return;
        }
        
        document.querySelector('.game-info').style.display = 'flex';
        document.querySelector('.game-boards').style.display = 'flex';
        document.querySelector('.game-messages').style.display = 'block';
        
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
        document.getElementById('game-phase').textContent = 
            this.gamePhase === 'placement' ? 'Ship Placement' :
            this.gamePhase === 'battle' ? 'Battle' : 'Game Over';
            
        const shipsSection = document.querySelector('.ships-to-place');
        if (this.gamePhase === 'battle' || this.gamePhase === 'gameOver') {
            shipsSection.style.display = 'none';
        }
    }
    
    updateMessage(message) {
        document.getElementById('message-display').textContent = message;
    }
    
    newGame() {
        location.reload();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BattleshipGame();
});