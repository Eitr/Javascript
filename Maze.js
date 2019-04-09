 
/* Michael Short 2019 - Recursive Maze Generator */

// Graphics elments
let canvas = getElem("canvas");
let sidebar = getElem("sidebar");
let showButton = getElem("showPanel");
let g2d = canvas.getContext("2d");

// List of label names
const otherLabels = ["size","split","dead","fps","spd"];

// Label 
let sizeElem = getElem("sizeIn");
let splitElem = getElem("splitIn");
let deadElem = getElem("deadIn");
let frameTime = getElem("fpsIn");
let frameTimeSolve = getElem("spdIn");

// Recursive properties
let curStack = [];
let nextStack = [];
let pendingStack = [];
let busy;
let curInterval;
let fps;
let grid = [];
let gridTrace = [];

// Block type enums
const WALL = 0;
const PATH = 1;
const TRACE = 2;
const PREV = 3;

// Display props
let size;
let width;
let height;
let startPoint;
let endPoint;

// Shortcut for getting html element
function getElem(x) {
	return document.getElementById(x);
}
// Hides the left side panel
function hidePanel() {
	sidebar.style.display = "none";
	showButton.style.display = "block";
}
// Shows the left side panel
function showPanel() {
	sidebar.style.display = "block";
	showButton.style.display = "none";
}

// Updates an html label value
function updateValue(element,value) {
	getElem(element).innerHTML = value;
}

// Updates all html labels with their input values
function updateAllValues() {
	otherLabels.forEach(function(x) {
		updateValue(x,getElem(x+"In").value);
	});
}

function solveMaze() {
	if(curInterval) { clearInterval(curInterval); }

	// Reset solve tracing
	for(let x=0; x<width; x++) {
		if(!gridTrace[x]) { gridTrace[x] = []; }
		for(let y=0; y<height; y++) {
			gridTrace[x][y] = grid[x][y];
			drawBlock(x,y,grid[x][y]);
		}
	}
	curStack = [];
	nextStack = [];

	// Check if we can solve
	if(!getElem("shouldSolve").checked) { return; }

	drawBlock(...startPoint,TRACE);
	nextStack = [startPoint];
	busy = false;
	curInterval = setInterval(pathFinding, frameTimeSolve.value);
}

// Starts the generation of a maze
function render() {
	updateAllValues();

	// Resizes the canvas to fit the screen
	canvas.width = document.body.clientWidth-20;
	canvas.height = document.body.clientHeight-20;
	
	size = sizeElem.value;
	width = Math.floor(canvas.width / size);
	height = Math.floor(canvas.height / size);

	// Need odd size for borders
	if(width%2 === 0) { width -= 1; }
	if(height%2 === 0) { height -= 1; }
	
	// Stop any current maze being drawn
	if(curInterval) { clearInterval(curInterval); }
	curStack = [];
	nextStack = [];
	pendingStack = [];
	
	// Prepare the graphics canvas
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.strokeStyle="black";
	g2d.lineCap="round";
	
	// Initialize the grid
	for(let x=0; x<width; x++) {
		if(!grid[x]) { grid[x] = []; }
		for(let y=0; y<height; y++) {
			drawBlock(x,y,WALL);
		}
	}
	startPoint = [1,1];
	endPoint = [width-2,height-2];
	console.log('RENDER',width,height,canvas.width,canvas.height,size);
	
	// Create the first branch
	const [ox,oy] = startPoint;
	drawBlock(ox,oy,PATH);
	generateBranch([ox,oy]);
	
	// Interval timer to continuously build the maze
	busy = false;
	curInterval = setInterval(nextFrame, frameTime.value);
}

// Function called from the interval timer, generates a batch of branches at a time
let nextFrame = function() {
	// Progress eedback
	feedback = " (fps:"+parseInt(1000 / ((new Date) - fps))+")";
	updateValue("progress",feedback);
	fps = new Date;
	if(busy) { return; } // Prevents concurrent modification
	busy = true;
	
	const curStack = [...nextStack];
	nextStack = [];

	// If there's no more points, we're done
	if(!curStack.length && !pendingStack.length) {
		clearInterval(curInterval);
		solveMaze();
		return;
	} else {
		// If the current path is empty, grab one from pending
		if(!curStack.length) {
			curStack.push(pendingStack.pop());
		}
		// Generate the next path on each current block
		curStack.forEach(function(branch, i) {
			generateBranch(branch);
		});
	}
	busy = false;
}

// Draw a location on the maze grid
function drawBlock(nx,ny,type) {
	if(type !== TRACE && type !== PREV) {
		grid[nx][ny] = type;
	}
	switch(type) {
		case PATH: setFillStyle(20,20,20,200,200,200); break;
		case WALL: setFillStyle(40,40,40,20,20,20); break;
		case TRACE: setFillStyle(20,20,20,120,120,220); break;
		case PREV: setFillStyle(20,20,20,220,120,120); break;
	}
	g2d.fillRect(nx*size, ny*size, size, size);
}

// Generates a new branch from a previous one
function generateBranch([x, y]) {

	// Check if we're at the end
	if(x === endPoint[0] && y === endPoint[1]) { return; }
	
	// Up, down, left, right
	let dirs = [
		[ 0,-1 ],
		[ 0, 1 ],
		[-1, 0 ],
		[ 1, 0 ],
	];
	// Randomize which direction we go first
	shuffleArray(dirs);

	// Iterate backwards because we're removing elements
	for(let i=dirs.length-1; i>=0; i--) {
		// Work with one direction at a time
		let [ox,oy] = dirs.pop();

		// Check for a dead end path
		if(Math.random() < deadElem.value/100) { break; }

		// Validate new location
		let nx = x+ox*2;
		let ny = y+oy*2;
		if(nx < 0 || ny < 0 || nx >= width || ny >= height) { continue; }
		if(grid[nx][ny] !== WALL) { continue; }

		// Create new path location
		drawBlock(nx-ox,ny-oy,PATH);
		drawBlock(nx,ny,PATH);

		// Add this point to the stack to continue the path
		nextStack.push([nx,ny]);

		// Check if we need to split the path
		if(Math.random() > splitElem.value/100) { break; }
	}

	// If we didn't cover all directions, add this root point to the pending list
	if(dirs.length) {
		pendingStack = [[x,y]].concat(pendingStack);
	}

}


function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function setFillStyle(r,g,b,or,og,ob) {
	if(or !== undefined || og !== undefined || ob !== undefined) {
		r = parseInt(Math.random()*r)+or;
		g = parseInt(Math.random()*g)+og;
		b = parseInt(Math.random()*b)+ob;
	}
	g2d.fillStyle = `rgb(${r},${g},${b})`;
}

function pathFinding() {
	if(busy) { return; } // Prevents concurrent modification
	busy = true;
	
	// Dead end?
	if(!nextStack.length) {
		let last = curStack.pop();
		
		// Check if we're at the end
		if(last[0] === endPoint[0] && last[1] === endPoint[1]) {
			clearInterval(curInterval);
			return;
		}
		
		// Else backup where we came
		drawBlock(...last,PREV);
		nextStack.push(curStack.pop());
	}
	
	let block = nextStack.pop();
	if(!block) {
		// Couldn't find the exit
		clearInterval(curInterval);
		return;
	}
	curStack.push(block);
	recursePath(block);

	busy = false;
}

function recursePath([x,y]) {

	// Check if we're at the end
	if(x === endPoint[0] && y === endPoint[1]) { return; }
	
	// Up, down, left, right
	let dirs = [
		[ 0,-1 ],
		[ 0, 1 ],
		[-1, 0 ],
		[ 1, 0 ],
	];

	// Iterate backwards because we're removing elements
	for(let i=dirs.length-1; i>=0; i--) {
		// Work with one direction at a time
		let [ox,oy] = dirs.pop();

		// Validate new location
		let nx = x+ox;
		let ny = y+oy;
		if(nx < 0 || ny < 0 || nx >= width || ny >= height) { continue; }
		if(gridTrace[nx][ny] !== PATH) { continue; }
		
		// Record where we've been, so we don't retrace our steps
		gridTrace[nx][ny] = WALL;

		// Draw trail
		drawBlock(nx,ny,TRACE);
		nextStack.push([nx,ny]);
		break;
	}

}
