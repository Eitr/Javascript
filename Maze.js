 
/* Michael Short 2019 - Recursive Maze Generator */

// Graphics elments
let canvas = getElem("canvas");
let sidebar = getElem("sidebar");
let showButton = getElem("showPanel");
let g2d = canvas.getContext("2d");

// List of label names
const otherLabels = ["gridX","gridY","split","dead","fps","spd"];

// Label 
let gridX = getElem("gridXIn");
let gridY = getElem("gridYIn");
let split = getElem("splitIn");
let dead = getElem("deadIn");
let frameTime = getElem("fpsIn");
let frameTimeSolve = getElem("spdIn");

// Recursive properties
let curStack = [];
let nextStack = [];
let pendingStack = [];
let busy;
let curInterval = 0;
let fps;
let grid = [];
let size = 0;
const WALL = 0;
const PATH = 1;
const TRACE = 2;
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
	// if(curInterval !== 0 || curStack.length !== 0) { return; }

	// curStack = [startPoint];
	// curInterval = setInterval(recursePath, frameTimeSolve.value);
	drawBlock(startPoint[0],startPoint[1],TRACE);
	recursePath(startPoint);
}

// Starts the generation of a maze
function render() {
	updateAllValues();

	// Resizes the canvas to fit the screen
	getElem("canvas").width = document.body.clientWidth-20;
	getElem("canvas").height = document.body.clientHeight-20;
	
	// Stop any current maze being drawn
	if(curInterval !== 0) {
		clearInterval(curInterval);
	}
	curStack = [];
	nextStack = [];
	pendingStack = [];
	
	// Prepare the graphics canvas
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.strokeStyle="black";
	g2d.lineCap="round";
	
	// Initialize the grid
	size = Math.floor(Math.min(canvas.height/gridY.value,canvas.width/gridX.value));
	for(let x=0; x<gridX.value; x++) {
		if(!grid[x]) { grid[x] = []; }
		for(let y=0; y<gridY.value; y++) {
			grid[x][y] = WALL;
			drawBlock(x,y,WALL);
		}
	}
	startPoint = [1,1];
	endPoint = [gridX.value-1,gridY.value-1];
	console.log('RENDER',gridX.value,gridY.value,canvas.width,canvas.height,size);
	
	// Create the first branch
	const [ox,oy] = startPoint;
	grid[ox][oy] = PATH;
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
	grid[nx][ny] = type;
	switch(type) {
		case PATH: setFillStyle(20,20,20,200,200,200); break;
		case WALL: setFillStyle(40,40,40,20,20,20); break;
		case TRACE: setFillStyle(20,20,20,120,120,220); break;
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
		if(Math.random() < dead.value/100) { break; }

		// Validate new location
		let nx = x+ox*2;
		let ny = y+oy*2;
		if(nx < 0 || ny < 0 || nx >= gridX.value || ny >= gridY.value) { continue; }
		if(grid[nx][ny] !== WALL) { continue; }

		// Create new path location
		let type = PATH;
		drawBlock(nx-ox,ny-oy,type);
		drawBlock(nx,ny,type);

		// Add this point to the stack to continue the path
		nextStack.push([nx,ny]);

		// Check if we need to split the path
		if(Math.random() > split.value/100) { break; }
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
	// curStack
}

function recursePath([x,y]) {

	// Check if we're at the end
	if(x === endPoint[0] && y === endPoint[1]) { return true; }
	
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
		if(nx < 0 || ny < 0 || nx >= gridX.value || ny >= gridY.value) { continue; }
		if(grid[nx][ny] !== PATH) { continue; }

		// Draw trail
		drawBlock(nx,ny,TRACE);

		// Continue down trail
		const finished = recursePath([nx,ny]);

		// If we found the end, break out of the recursion
		if(finished) { return true; }

		// Else we're backing up, hide the bad trail
		drawBlock(nx,ny,PATH);
	}

}
