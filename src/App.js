import './App.css';
import {useEffect, useState} from 'react'

const GRID_SIZE = 10;
const NUM_MINES = 15;

const generateGrid = () => {
    const grid = Array.from({length: GRID_SIZE}, () =>
        Array.from({length: GRID_SIZE}, () => ({
            mine: false, number: 0, revealed: false, flagged: false
        }))
    );

    // Set start and end positions
    grid[0][0].start = true;
    grid[0][0].revealed = true;
    grid[GRID_SIZE - 1][GRID_SIZE - 1].end = true;
    grid[GRID_SIZE - 1][GRID_SIZE - 1].revealed = true;

    // Place mines
    let minesPlaced = 0;

    function validSquare(x, y) {
        if (grid[x][y].start || grid[x][y].end) {
            return false;
        }
        return !(x + y === 1 || (x === 1 && y === 1));
    }

    while (minesPlaced < NUM_MINES) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if (!grid[x][y].mine && validSquare(x, y)) {
            grid[x][y].mine = true;
            minesPlaced++;
            // Update numbers around the mine
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (
                        nx >= 0 &&
                        ny >= 0 &&
                        nx < GRID_SIZE &&
                        ny < GRID_SIZE &&
                        !grid[nx][ny].mine
                    ) {
                        grid[nx][ny].number++;
                    }
                }
            }
        }
    }

    // reveal three squares around start
    grid[1][0].revealed = true;
    grid[0][1].revealed = true;
    grid[1][1].revealed = true;

    console.log(grid);
    return grid;
};

const App = () => {
    const [grid, setGrid] = useState(generateGrid());
    const [playerPosition, setPlayerPosition] = useState({
        x: 0,
        y: 0,
    });
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    const revealSquare = (x, y) => {
        setGrid((prevGrid) => {
            return prevGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    if (rowIndex === x && colIndex === y) {
                        return {...cell, revealed: true}; // Return a new object with updated state
                    }
                    return cell;
                })
            );
        });
    };

    const toggleFlag = (x, y) => {
        setGrid((prevGrid) => {
            return prevGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    if (rowIndex === x && colIndex === y) {
                        return {...cell, flagged: !cell.flagged}; // Toggle flagged state
                    }
                    return cell;
                })
            );
        });
    };

    const movePlayer = (dx, dy, shiftKey) => {
        if (gameOver || gameWon) {
            return;
        }

        const newX = playerPosition.x + dx;
        const newY = playerPosition.y + dy;

        if (newX >= 0 && newY >= 0 && newX < GRID_SIZE && newY < GRID_SIZE) {
            if (shiftKey) {
                toggleFlag(newX, newY);
                console.log(newX + ',' + newY + " is now flagged");
                return;
            } else if (grid[newX][newY].flagged) {
                console.log("preventing move to flagged square " + newX + ',' + newY);
                return;
            } else {
                setPlayerPosition({x: newX, y: newY});
                revealSquare(newX, newY);
            }
        } else {
            return;
        }

        if (grid[newX][newY].mine) {
            setGameOver(true);
            alert("Game Over!");
        }

        if (grid[newX][newY].end) {
            setGameWon(true);
            alert("Congratulations, you win!");
        }
    };

    const handleKeyDown = (e) => {
        const shiftKey = e.shiftKey;
        console.log("event occurred, key " + e.key + " with shift? " + e.shiftKey);

        // prevent defaults
        if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
            e.preventDefault();
        }

        switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
                movePlayer(-1, 0, shiftKey);
                break;
            case "ArrowDown":
            case "s":
            case "S":
                movePlayer(1, 0, shiftKey);
                break;
            case "ArrowLeft":
            case "a":
            case "A":
                movePlayer(0, -1, shiftKey);
                break;
            case "ArrowRight":
            case "d":
            case "D":
                movePlayer(0, 1, shiftKey);
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown, playerPosition]);

    useEffect(() => {
        revealSquare(playerPosition.x, playerPosition.y);
    }, [playerPosition.x, playerPosition.y]);

    return (
        <div className="grid">
            {grid.map((row, x) =>
                row.map((cell, y) => {
                    const isPlayer = playerPosition.x === x && playerPosition.y === y;
                    const className = `cell ${
                        cell.start
                            ? "start"
                            : cell.end
                                ? "end"
                                : cell.flagged
                                    ? "flagged"
                                    : cell.revealed
                                        ? cell.mine
                                            ? "mine"
                                            : ""
                                        : "hidden"
                    } ${isPlayer ? "player" : ""}`;
                    return (
                        <div key={`${x}-${y}`} className={className}>
                            {cell.flagged
                                ? "🚩"
                                : cell.revealed
                                    ? cell.mine
                                        ? "💣"
                                        : cell.start
                                            ? "S"
                                            : cell.end
                                                ? "E"
                                                : cell.number > 0
                                                    ? cell.number
                                                    : ""
                                    : ""}
                        </div>
                    );
                })
            )}
        </div>
    );
};

// ------ OLD GENERATE GRID BELOW --------
// const generateGrid = (rows, cols, mines) => {
//     const grid = Array(rows)
//         .fill(null)
//         .map(() =>
//             Array(cols)
//                 .fill(null)
//                 .map(() => ({ isMine: false, isRevealed: false, neighborMines: 0 }))
//         );
//
//     // Place mines randomly
//     let mineCount = 0;
//     while (mineCount < mines) {
//         const row = Math.floor(Math.random() * rows);
//         const col = Math.floor(Math.random() * cols);
//
//         if (!grid[row][col].isMine) {
//             grid[row][col].isMine = true;
//             mineCount++;
//         }
//     }
//
//     // Calculate neighbor mines
//     for (let r = 0; r < rows; r++) {
//         for (let c = 0; c < cols; c++) {
//             if (!grid[r][c].isMine) {
//                 let count = 0;
//                 for (let i = -1; i <= 1; i++) {
//                     for (let j = -1; j <= 1; j++) {
//                         if (r + i >= 0 && r + i < rows && c + j >= 0 && c + j < cols) {
//                             if (grid[r + i][c + j].isMine) {
//                                 count++;
//                             }
//                         }
//                     }
//                 }
//                 grid[r][c].neighborMines = count;
//             }
//         }
//     }
//
//     return grid;
// };


// ---- OLD GAME BELOW -------
// const Game = ({ rows, cols, mines }) => {
//     const [grid, setGrid] = useState([]);
//     const [gameOver, setGameOver] = useState(false);
//
//     useEffect(() => {
//         setGrid(generateGrid(rows, cols, mines));
//     }, [rows, cols, mines]);
//
//     const handleClick = (row, col) => {
//         if (grid[row][col].isMine) {
//             setGameOver(true);
//             alert("Game Over!");
//             return;
//         }
//
//         // Reveal cell
//         const newGrid = [...grid];
//         newGrid[row][col].isRevealed = true;
//
//         function rippleReveal(row, col) {
//             newGrid[row][col].isRevealed = true;
//
//             if (grid[row][col].neighborMines > 0 || revgrid[row][col] === true) {
//                 return;
//             }
//
//             revgrid[row][col] = true;
//
//             for (let i = -1; i <= 1; i++) {
//                 for (let j = -1; j <= 1; j++) {
//                     if (row + i >= 0 && row + i < rows && col + j >= 0 && col + j < cols && (i !== 0 || j !== 0)) {
//                         rippleReveal(row + i, col + j);
//                     }
//                 }
//             }
//         }
//
//         const revgrid = Array(rows)
//             .fill(null)
//             .map(() =>
//                 Array(cols)
//                     .fill(null)
//                     .map(() => false)
//             );
//         rippleReveal(row, col);
//
//         setGrid(newGrid);
//     };
//
//     return (
//         <div>
//             {gameOver && <p>Game Over! Refresh to restart.</p>}
//             <div className="grid">
//                 {grid.map((row, rowIndex) => (
//                     <div className="row" key={rowIndex}>
//                         {row.map((cell, colIndex) => (
//                             <button
//                                 key={colIndex}
//                                 className={`cell ${cell.isRevealed ? "revealed" : ""}`}
//                                 onClick={() => handleClick(rowIndex, colIndex)}
//                                 disabled={cell.isRevealed || gameOver}
//                             >
//                                 {cell.isRevealed
//                                     ? cell.isMine
//                                         ? "💣"
//                                         : cell.neighborMines || ""
//                                     : ""}
//                             </button>
//                         ))}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

export default App;
