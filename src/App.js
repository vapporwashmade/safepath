import './App.css';
import {useEffect, useState} from 'react'

const generateGrid = (grid_size) => {
    // 20% mines
    const num_mines = Math.floor(0.2 * grid_size * grid_size);

    console.log("generate grid called");
    const grid = Array.from({length: grid_size}, () =>
        Array.from({length: grid_size}, () => ({
            mine: false, number: 0, revealed: false, flagged: false
        }))
    );

    // Set start and end positions
    const start = {x: 0, y: 0};
    const end = {x: grid_size - 1, y: grid_size - 1};

    grid[start.x][start.y].start = true;
    grid[start.x][start.y].revealed = true;
    grid[end.x][end.y].end = true;
    grid[end.x][end.y].revealed = true;

    // Find path

    const targetLength = Math.floor(
        Math.random() * (3.5 * grid_size - 2.5 * grid_size + 1) + 2.5 * grid_size
    );

    const directions = [
        { dx: -1, dy: 0 }, // Up
        { dx: 1, dy: 0 },  // Down
        { dx: 0, dy: -1 }, // Left
        { dx: 0, dy: 1 },  // Right
    ];

    const visited = new Set();
    const path = [];

    const isValidMove = (x, y) =>
        x >= 0 && y >= 0 && x < grid_size && y < grid_size && !visited.has(`${x},${y}`);

    const heuristicDistance = (x, y) =>
        Math.abs(x - end.x) + Math.abs(y - end.y);

    let iters = 0;

    const dfs = (x, y, length, iters) => {

        if (x === end.x && y === end.y && length === targetLength) {
            path.push({ x, y });
            return true; // Path found
        }

        if (length + heuristicDistance(x, y) > targetLength) return false; // Exceeded path length

        visited.add(`${x},${y}`);
        path.push({ x, y });

        // Shuffle directions for randomness
        const shuffledDirections = directions.sort(() => Math.random() - 0.5);

        for (const { dx, dy } of shuffledDirections) {
            const newX = x + dx;
            const newY = y + dy;

            if (isValidMove(newX, newY)) {
                if (dfs(newX, newY, length + 1, iters + 1)) return true;
            }
        }

        // Backtrack if no valid path is found
        path.pop();
        visited.delete(`${x},${y}`);
        return false;
    };

    dfs(start.x, start.y, 0, 0);

    console.log(path);

    // EXTRA for debugging
    // for (const pt of path) {
    //     // grid[pt.x][pt.y].path = true;
    //     grid[pt[0]][pt[2]].path = true;
    // }

    // Place mines
    let minesPlaced = 0;

    function validSquare(x, y) {
        if (grid[x][y].start || grid[x][y].end) {
            return false;
        }
        if (Math.abs(x - start.x) === 1 || Math.abs(y - start.y) === 1) {
            return false;
        }
        // for (let i = 0; i < path.length; i++) {
        //     if (x === path[i].x && y === path[i].y) {
        //         return false;
        //     }
        // }
        return !path.includes(`${x},${y}`);
    }

    while (minesPlaced < num_mines) {
        const x = Math.floor(Math.random() * grid_size);
        const y = Math.floor(Math.random() * grid_size);
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
                        nx < grid_size &&
                        ny < grid_size &&
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

const Overlay = ({message, onHide}) => {
    useEffect(() => {
        const timer = setTimeout(onHide, 3000); // Hide after 3 seconds
        return () => clearTimeout(timer);
    }, [onHide]);

    return (
        <div className="overlay">
            <div className="overlay-content">{message}</div>
        </div>
    );
};
const App = () => {
    const [gridSize, setGridSize] = useState(16); // Default to medium (16x16)
    const [grid, setGrid] = useState(() => {
        return generateGrid(gridSize);
    });
    const [playerPosition, setPlayerPosition] = useState({x: 0, y: 0});
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [gameLost, setGameLost] = useState(false);

    const handleDifficultyChange = (size) => {
        setGridSize(size);
        document.documentElement.style.setProperty('--grid-size', size);
        setGrid(generateGrid(size)); // Regenerate grid with new size
        setPlayerPosition({x: 0, y: 0}); // Reset player position
        setGameOver(false);
        setGameWon(false);
        setGameLost(false);
    };

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

    function revealAll() {
        for (const row of grid) {
            for (const cell of row) {
                cell.revealed = true;
            }
        }
    }

    const movePlayer = (dx, dy, shiftKey) => {
        if (gameOver) {
            return;
        }

        const newX = playerPosition.x + dx;
        const newY = playerPosition.y + dy;

        if (newX >= 0 && newY >= 0 && newX < gridSize && newY < gridSize) {
            if (shiftKey) {
                toggleFlag(newX, newY);
                return;
            } else if (grid[newX][newY].flagged) {
                return;
            } else {
                setPlayerPosition({x: newX, y: newY});
                revealSquare(newX, newY);
            }


            if (grid[newX][newY].mine) {
                setGameOver(true);
                setGameLost(true);
                revealAll();
            }

            if (grid[newX][newY].end) {
                setGameOver(true);
                setGameWon(true);
                revealAll();
            }
        }
    };

    const handleKeyDown = (e) => {
        const shiftKey = e.shiftKey;

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
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
        <div className="app-cont">
            <div className="difficulty-buttons">
                <button onClick={() => handleDifficultyChange(10)}>Easy (10x10)</button>
                <button onClick={() => handleDifficultyChange(16)}>Medium (16x16)</button>
                <button onClick={() => handleDifficultyChange(24)}>Hard (24x24)</button>
            </div>
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
                                                : cell.path
                                                    ? "path-part"
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
            {gameLost && (
                <Overlay message="Game Over!" onHide={() => setGameLost(false)}/>
            )}
            {gameWon && (
                <Overlay message="Congratulations, You Win!" onHide={() => setGameWon(false)}/>
            )}
        </div>
    );
};

// const App = () => {
//     const grid_size = 16;
//     const [grid, setGrid] = useState(generateGrid(grid_size));
//     const [playerPosition, setPlayerPosition] = useState({
//         x: 0,
//         y: 0,
//     });
//     const [gameOver, setGameOver] = useState(false);
//     const [gameWon, setGameWon] = useState(false);
//
//
//     const revealSquare = (x, y) => {
//         setGrid((prevGrid) => {
//             return prevGrid.map((row, rowIndex) =>
//                 row.map((cell, colIndex) => {
//                     if (rowIndex === x && colIndex === y) {
//                         return {...cell, revealed: true}; // Return a new object with updated state
//                     }
//                     return cell;
//                 })
//             );
//         });
//     };
//
//     const toggleFlag = (x, y) => {
//         setGrid((prevGrid) => {
//             return prevGrid.map((row, rowIndex) =>
//                 row.map((cell, colIndex) => {
//                     if (rowIndex === x && colIndex === y) {
//                         return {...cell, flagged: !cell.flagged}; // Toggle flagged state
//                     }
//                     return cell;
//                 })
//             );
//         });
//     };
//
//     function revealAll() {
//         for (const row of grid) {
//             for (const cell of row) {
//                 cell.revealed = true;
//             }
//         }
//     }
//
//     const movePlayer = (dx, dy, shiftKey) => {
//         if (gameOver || gameWon) {
//             return;
//         }
//
//         const newX = playerPosition.x + dx;
//         const newY = playerPosition.y + dy;
//
//         if (newX >= 0 && newY >= 0 && newX < grid_size && newY < grid_size) {
//             if (shiftKey) {
//                 toggleFlag(newX, newY);
//                 console.log(newX + ',' + newY + " is now flagged");
//                 return;
//             } else if (grid[newX][newY].flagged) {
//                 console.log("preventing move to flagged square " + newX + ',' + newY);
//                 return;
//             } else {
//                 setPlayerPosition({x: newX, y: newY});
//                 revealSquare(newX, newY);
//             }
//         } else {
//             return;
//         }
//
//         if (grid[newX][newY].mine) {
//             setGameOver(true);
//             revealAll();
//         }
//
//         if (grid[newX][newY].end) {
//             setGameWon(true);
//             revealAll();
//         }
//     };
//
//     const handleKeyDown = (e) => {
//         const shiftKey = e.shiftKey;
//         console.log("event occurred, key " + e.key + " with shift? " + e.shiftKey);
//
//         // prevent defaults
//         if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
//             e.preventDefault();
//         }
//
//         switch (e.key) {
//             case "ArrowUp":
//             case "w":
//             case "W":
//                 movePlayer(-1, 0, shiftKey);
//                 break;
//             case "ArrowDown":
//             case "s":
//             case "S":
//                 movePlayer(1, 0, shiftKey);
//                 break;
//             case "ArrowLeft":
//             case "a":
//             case "A":
//                 movePlayer(0, -1, shiftKey);
//                 break;
//             case "ArrowRight":
//             case "d":
//             case "D":
//                 movePlayer(0, 1, shiftKey);
//                 break;
//             default:
//                 break;
//         }
//     };
//
//     useEffect(() => {
//         window.addEventListener("keydown", handleKeyDown);
//         return () => {
//             window.removeEventListener("keydown", handleKeyDown);
//         };
//     }, [handleKeyDown, playerPosition]);
//
//     useEffect(() => {
//         revealSquare(playerPosition.x, playerPosition.y);
//     }, [playerPosition.x, playerPosition.y]);
//
//     return (
//         <div className="app-cont">
//             {<div className="grid">
//                 {grid.map((row, x) =>
//                     row.map((cell, y) => {
//                         const isPlayer = playerPosition.x === x && playerPosition.y === y;
//                         const className = `cell ${
//                             cell.start
//                                 ? "start"
//                                 : cell.end
//                                     ? "end"
//                                     : cell.flagged
//                                         ? "flagged"
//                                         : cell.revealed
//                                             ? cell.mine
//                                                 ? "mine"
//                                                 : cell.path
//                                                     ? "path-part"
//                                                     : ""
//                                             : "hidden"
//                         } ${isPlayer ? "player" : ""}`;
//                         return (
//                             <div key={`${x}-${y}`} className={className}>
//                                 {cell.flagged
//                                     ? "🚩"
//                                     : cell.revealed
//                                         ? cell.mine
//                                             ? "💣"
//                                             : cell.start
//                                                 ? "S"
//                                                 : cell.end
//                                                     ? "E"
//                                                     : cell.number > 0
//                                                         ? cell.number
//                                                         : ""
//                                         : ""}
//                             </div>
//                         );
//                     })
//                 )}
//             </div>}
//             {gameOver && (
//                 <Overlay message="Game Over!" onHide={() => setGameOver(false)} />
//             )}
//             {gameWon && (
//                 <Overlay
//                     message="Congratulations, You Win!"
//                     onHide={() => setGameWon(false)}
//                 />
//             )}
//         </div>
//     );
// };

export default App;
