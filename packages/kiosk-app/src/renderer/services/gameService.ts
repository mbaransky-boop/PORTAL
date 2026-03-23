import { TicTacToeBoard, TicTacToeSymbol, BattleshipBoard, BattleshipShip } from '../../shared/types';

export function checkTicTacToeWinner(board: TicTacToeBoard): TicTacToeSymbol | 'draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

export const SHIPS_CONFIG = [
  { id: 0, size: 5, name: 'Lotniskowiec' },
  { id: 1, size: 4, name: 'Pancernik' },
  { id: 2, size: 3, name: 'Krążownik' },
  { id: 3, size: 3, name: 'Okręt podwodny' },
  { id: 4, size: 2, name: 'Niszczyciel' },
];

export function createEmptyBoard(): BattleshipBoard {
  const cells = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ state: 'empty' as const }))
  );
  return { cells, ships: [] };
}

export function canPlaceShip(
  board: BattleshipBoard,
  row: number,
  col: number,
  size: number,
  orientation: 'horizontal' | 'vertical'
): boolean {
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;

    if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
          if (board.cells[nr][nc].state === 'ship') return false;
        }
      }
    }
  }
  return true;
}

export function placeShip(
  board: BattleshipBoard,
  ship: Omit<BattleshipShip, 'cells' | 'hits' | 'sunk'>,
  row: number,
  col: number,
  orientation: 'horizontal' | 'vertical'
): BattleshipBoard {
  const newCells = board.cells.map(r => r.map(c => ({ ...c })));
  const shipCells: Array<{ row: number; col: number }> = [];

  for (let i = 0; i < ship.size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    newCells[r][c] = { state: 'ship', shipId: ship.id };
    shipCells.push({ row: r, col: c });
  }

  const newShip: BattleshipShip = { ...ship, cells: shipCells, hits: 0, sunk: false };
  return { cells: newCells, ships: [...board.ships, newShip] };
}

export function applyShot(
  board: BattleshipBoard,
  row: number,
  col: number
): { board: BattleshipBoard; hit: boolean; sunk: boolean; shipId?: number; allSunk: boolean } {
  const cell = board.cells[row][col];
  const newCells = board.cells.map(r => r.map(c => ({ ...c })));
  const newShips = board.ships.map(s => ({ ...s, cells: s.cells.map(c => ({ ...c })) }));

  if (cell.state === 'ship' && cell.shipId !== undefined) {
    const shipIdx = newShips.findIndex(s => s.id === cell.shipId);
    newCells[row][col] = { state: 'hit', shipId: cell.shipId };

    if (shipIdx >= 0) {
      newShips[shipIdx] = { ...newShips[shipIdx], hits: newShips[shipIdx].hits + 1 };
      const ship = newShips[shipIdx];
      if (ship.hits >= ship.size) {
        newShips[shipIdx] = { ...ship, sunk: true };
        ship.cells.forEach(sc => {
          newCells[sc.row][sc.col] = { state: 'sunk', shipId: ship.id };
        });
        newCells[row][col] = { state: 'sunk', shipId: ship.id };
        const allSunk = newShips.every(s => s.sunk);
        return { board: { cells: newCells, ships: newShips }, hit: true, sunk: true, shipId: ship.id, allSunk };
      }
    }

    const allSunk = newShips.every(s => s.sunk);
    return { board: { cells: newCells, ships: newShips }, hit: true, sunk: false, shipId: cell.shipId, allSunk };
  }

  newCells[row][col] = { state: 'miss' };
  return { board: { cells: newCells, ships: newShips }, hit: false, sunk: false, allSunk: false };
}
