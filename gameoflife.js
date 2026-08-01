// 3D Game of Life for Random Number Generator
let scene;
let floor;
let numberDisplay;

// Game state
let cells = new Map(); // Store cells with key "x,y,z" -> element
let isRunning = false;
let simulationInterval = null;
const CELL_SIZE = 1;
const SIMULATION_SPEED = 500; // ms between generations
const BOUNDARY = 5//Cubes beyond this distance from origin will be deleted

// Grid to track cell positions for Game of Life logic
let grid = new Map();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  scene = document.querySelector('a-scene');
  floor = document.querySelector('#floor');
  numberDisplay = document.querySelector('#number-display');
  
  if (scene && floor) {
    // Initialize when scene is ready
    scene.addEventListener('loaded', () => {
      setupFloorInteraction();
      setupKeyboardControls();
      // Start simulation automatically
      toggleSimulation();
      // Spawn initial random cubes
      spawnInitialCubes();
      console.log('Random Number Generator initialized');
    });
  } else {
    console.error('Scene or floor not found');
  }
});

function spawnInitialCubes() {
  // Spawn some initial random cubes to start the simulation
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * (BOUNDARY * 2 + 1)) - BOUNDARY;
    const y = Math.floor(Math.random() * 3); // Keep y low initially
    const z = Math.floor(Math.random() * (BOUNDARY * 2 + 1)) - BOUNDARY;
    createCell(x, y + 0.5, z);
  }
  updateNumberDisplay();
}

function setupFloorInteraction() {
  // Floor interaction removed - use E key to spawn cubes instead
}

function setupKeyboardControls() {
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP') {
      event.preventDefault();
      toggleSimulation();
    } else if (event.code === 'KeyE') {
      event.preventDefault();
      spawnCubeAtCursor();
    }
  });
}

function spawnCubeAtCursor() {
  const cursor = document.querySelector('#desktop-cursor');
  if (!cursor) return;
  
  // Get all intersections with interactive objects (floor and cubes)
  const intersections = cursor.components.raycaster.intersections;
  if (!intersections || intersections.length === 0) return;
  
  // Find the closest intersection
  const intersection = intersections[0];
  const point = intersection.point;
  const x = Math.round(point.x);
  const z = Math.round(point.z);
  
  // Calculate y position based on what we hit
  let y;
  const hitEl = intersection.object.el;
  if (hitEl.id === 'floor') {
    y = 0.5;
  } else {
    // Hit a cube - spawn on top of it
    const hitPosition = hitEl.getAttribute('position');
    y = hitPosition.y + 1;
  }
  
  createCell(x, y, z);
  updateNumberDisplay();
}

function isWithinBounds(x, y, z) {
  return Math.abs(x) <= BOUNDARY && Math.abs(y) <= BOUNDARY && Math.abs(z) <= BOUNDARY;
}

function createCell(x, y, z) {
  const key = `${x},${y},${z}`;
  
  // Check if cell already exists at this position
  if (cells.has(key)) {
    return;
  }
  
  // Check if position is within bounds
  if (!isWithinBounds(x, y, z)) {
    return;
  }
  
  const cell = document.createElement('a-box');
  cell.setAttribute('position', `${x} ${y} ${z}`);
  cell.setAttribute('width', CELL_SIZE);
  cell.setAttribute('height', CELL_SIZE);
  cell.setAttribute('depth', CELL_SIZE);
  cell.setAttribute('material', 'shader: rainbow-cube; speed: 2.0');
  cell.setAttribute('class', 'cell interactive');
  
  scene.appendChild(cell);
  cells.set(key, cell);
  grid.set(key, { x, y, z });
}

function removeCell(key) {
  const cell = cells.get(key);
  if (cell) {
    scene.removeChild(cell);
    cells.delete(key);
    grid.delete(key);
  }
}

function updateNumberDisplay() {
  if (numberDisplay) {
    const count = cells.size;
    numberDisplay.setAttribute('value', `Count: ${count}`);
  }
}

function toggleSimulation() {
  isRunning = !isRunning;
  
  if (isRunning) {
    console.log('Simulation started');
    simulationInterval = setInterval(runGeneration, SIMULATION_SPEED);
  } else {
    console.log('Simulation paused');
    clearInterval(simulationInterval);
  }
}

function runGeneration() {
  const newGrid = new Map();
  const neighborCounts = new Map();
  
  // Count neighbors for each cell and empty positions (3D)
  for (const [key, cell] of grid) {
    const { x, y, z } = cell;
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;
          
          // Skip positions outside boundary
          if (!isWithinBounds(nx, ny, nz)) continue;
          
          const nkey = `${nx},${ny},${nz}`;
          
          neighborCounts.set(nkey, (neighborCounts.get(nkey) || 0) + 1);
        }
      }
    }
  }
  
  // Apply Game of Life rules (3D)
  for (const [key, count] of neighborCounts) {
    const [x, y, z] = key.split(',').map(Number);
    const isAlive = grid.has(key);
    
    // Birth: dead cell with exactly 3 neighbors becomes alive
    if (!isAlive && count === 3) {
      newGrid.set(key, { x, y, z });
    }
    // Survival: live cell with 2 or 3 neighbors stays alive
    else if (isAlive && (count === 2 || count === 3)) {
      newGrid.set(key, { x, y, z });
    }
    // Death: live cell with < 2 or > 3 neighbors dies (don't add to newGrid)
  }
  
  // Update the scene
  updateScene(newGrid);
}

function updateScene(newGrid) {
  // Remove cells that died or are outside boundary
  for (const [key] of grid) {
    if (!newGrid.has(key)) {
      removeCell(key);
    } else {
      // Also remove cells that are outside boundary
      const { x, y, z } = grid.get(key);
      if (!isWithinBounds(x, y, z)) {
        removeCell(key);
        newGrid.delete(key);
      }
    }
  }
  
  // Add new cells that were born
  for (const [key, { x, y, z }] of newGrid) {
    if (!grid.has(key)) {
      createCell(x, y, z);
    }
  }
  
  // Update grid reference
  grid = newGrid;
  
  // Update the number display after each generation
  updateNumberDisplay();
  
  // Auto-restart if cell count drops to 0
  if (cells.size === 0) {
    console.log('Cell count reached 0, auto-restarting simulation');
    spawnInitialCubes();
  }
}
