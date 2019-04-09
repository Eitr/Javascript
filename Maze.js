 
/* Michael Short 2017 - Recursive Fractal Tree Generator */

// Graphics elments
let canvas = getElem("canvas");
let sidebar = getElem("sidebar");
let showButton = getElem("showPanel");
let g2d = canvas.getContext("2d");
let r,g,b;

// List of label names
const otherLabels = ["gridX","gridY","split","dead","fps"];

// Label 
let gridX = getElem("gridXIn");
let gridY = getElem("gridYIn");
let split = getElem("splitIn");
let dead = getElem("deadIn");
let frameTime = getElem("fpsIn");

// Recursive properties
let curStack = [];
let nextStack = [];
let pendingStack = [];
let busy;
let curInterval = 0;
let fps;
let grid = [], size = 0;
const BLANK = 0;
const WALL = 1;
const PATH = 2;
let startPoint;
let endPoint;

// Shortcut for getting html element
function getElem(x) {
	return document.getElementById(x);
}
// Util for keeping rgb values in the range [0-255]
function clampColor(x) {
	return Math.min(255,Math.max(0,x));;
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

// Starts the generation of a maze
function render() {
	updateAllValues();

	// Resizes the canvas to fit the screen
	getElem("canvas").width = document.body.clientWidth-20;
	getElem("canvas").height = document.body.clientHeight-20;
	
	// Stop any current maze being drawn
	if(curInterval != 0) {
		clearInterval(curInterval);
	}
	curStack = [];
	nextStack = [];
	
	// Prepare the graphics canvas
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.strokeStyle="black";
	g2d.lineCap="round";
	
	// Initialize the grid
	size = Math.floor(Math.min(canvas.height/gridY.value,canvas.width/gridX.value));
	// g2d.fillStyle = "rgb(55,0,0)";
	// g2d.fillRect(0, 0, gridX.value*size, gridY.value*size);
	for(let x=0; x<gridX.value; x++) {
		if(!grid[x]) { grid[x] = []; }
		for(let y=0; y<gridY.value; y++) {
			grid[x][y] = BLANK;
			drawBlock(x,y,BLANK);
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
	feedback = " (fps:"+parseInt(1000 / ((new Date) - fps))+")";
	updateValue("progress",feedback);
	fps = new Date;
	if(busy) { return; } // Prevents concurrent modification
	busy = true;
	
	const curStack = [...nextStack];
	nextStack = [];
	if(!curStack.length && !pendingStack.length) {
		clearInterval(curInterval);
	} else {
		if(!curStack.length) {
			curStack.push(pendingStack.pop());
		}
		curStack.forEach(function(branch, i) {
			generateBranch(branch);
		});
	}
	busy = false;
}

function drawBlock(nx,ny,type) {
	grid[nx][ny] = type;
	switch(type) {
		case PATH: g2d.fillStyle = "rgb(205,205,205)"; break;
		case WALL: g2d.fillStyle = "rgb(0,0,0)"; break;
		case BLANK: 
			r = parseInt(Math.random()*20)+55;
			g = parseInt(Math.random()*20)+55;
			b = parseInt(Math.random()*20)+55;
			g2d.fillStyle = `rgb(${r},${g},${b})`;
			break;
	}
	g2d.fillRect(nx*size, ny*size, size, size);
}

// Generates a new branch from a previous one
function generateBranch([x, y]) {
	// console.log(x,y);
	let dirs = [
		[ 1, 0 ],
		[-1, 0 ],
		[ 0, 1 ],
		[ 0,-1 ],
	];
	shuffleArray(dirs);

	for(let i=dirs.length-1; i>=0; i--) {
		let [ox,oy] = dirs[i];
		dirs.pop();
		if(Math.random() < dead.value/100) { break; }
		let nx = x+ox*2;
		let ny = y+oy*2;
		if(nx < 0 || ny < 0 || nx >= gridX.value || ny >= gridY.value) { continue; }
		if(grid[nx][ny] !== BLANK) { continue; }
		let type = PATH;
		drawBlock(nx-ox,ny-oy,type);
		drawBlock(nx,ny,type);
		nextStack.push([nx,ny]);
		if(Math.random() < split.value/100) { continue; }
		break;
	}
	
	pendingLocs = dirs.map(([dx,dy]) => {
		// console.log(dx,dy,x,y);
		return [x+dx*2,y+dy*2];
	});
	// console.log(pendingStack);
	// pendingStack = pendingLocs.concat(pendingStack);
	if(dirs.length) {
		pendingStack = [[x,y]].concat(pendingStack);
	}

	
	// Set randomized color by mode
	// let colorScale = colorRange.value;
	// let xr = parseInt((Math.random()*colorScale)-(colorScale/2));
	// let xg = parseInt((Math.random()*colorScale)-(colorScale/2));
	// let xb = parseInt((Math.random()*colorScale)-(colorScale/2));
	
	// if(getElem("dynamicColor").checked) {
	// 	r = clampColor(r+xr);
	// 	g = clampColor(g+xg);
	// 	b = clampColor(b+xb);
	// 	g2d.strokeStyle = "rgb("+r+", "+g+", "+b+")";
	// } else if(getElem("staticColor").checked) {
	// 	g2d.strokeStyle = "rgb("+clampColor(r+xr)+", "+clampColor(g+xg)+", "+clampColor(b+xb)+")";
	// } else {
	// 	g2d.strokeStyle = "rgb("+r+", "+g+", "+b+")";
	// }
	
	// g2d.fillRect(130, 190, 40, 60);

	// Draw on 2d graphics canvas
	// g2d.beginPath();
	// g2d.moveTo(root.x,root.y);
	// g2d.lineWidth = parseInt(width);
	// g2d.lineTo(x,y,length);
	// g2d.stroke();
	
	// if() { return; }
	// curStack.push(newBranch);
}



/*	Functions for generating the next branch properties.
	Gets a value randomly selected between the min and max limits. */
	
function getRandomInRange(min,max) {
	return Math.round(Math.random()*(parseInt(max.value)-parseInt(min.value))+parseInt(min.value));
}
function getLength(prevLength) {
	return (getRandomInRange(scaleMin,scaleMax)/100*prevLength);
}
function getAngle(prevAngle, dir) {
	if(dir == 0) { return prevAngle; }
	return (getRandomInRange(angleMin,angleMax)/100*Math.PI*dir + prevAngle);
}
function getBranches() {
	return getRandomInRange(branchMin,branchMax);
}
function getSize() {
	return getRandomInRange(sizeMin,sizeMax);
}






/* Preset functions for specific types of trees */
// function defaultSettings() {
// 	locX.value = document.body.clientWidth/2;
// 	startLength.value = document.body.clientHeight/3;
// 	locY.value = 20;
// 	frameTime.value = 20;
// 	redrawTime.value = 0;
// }

// function defaultTree() {
// 	defaultSettings();
	
// 	branchMin.value = 2;
// 	branchMax.value = 4;
// 	sizeMin.value = 6;
// 	sizeMax.value = 16;
// 	scaleMin.value = 66;
// 	scaleMax.value = 80;
// 	angleMin.value = 10;
// 	angleMax.value = 25;
// 	startWidth.value = 16;
// 	colorRange.value = 12;
	
// 	updateAllValues();
// 	render();
// }


// function randomTree() {
// 	defaultSettings();
	
// 	function randomInt(min, max) {
// 		min = Math.ceil(min);
// 		max = Math.floor(max);
// 		return Math.floor(Math.random() * (max - min + 1)) + min;
// 	}
	
// 	branchMin.value = randomInt(branchMin.min,branchMin.max);
// 	branchMax.value = randomInt(branchMin.value,branchMax.max);
// 	sizeMin.value = randomInt(sizeMin.min,sizeMin.max);
// 	sizeMax.value = randomInt(sizeMin.value,sizeMax.max);
// 	scaleMin.value = randomInt(scaleMin.min,scaleMin.max);
// 	scaleMax.value = randomInt(scaleMin.value,scaleMax.max);
// 	angleMin.value = randomInt(angleMin.min,angleMin.max);
// 	angleMax.value = randomInt(angleMin.value,angleMax.max);
// 	startLength.value = randomInt(startLength.min,startLength.max);
// 	startWidth.value = randomInt(startWidth.min,startWidth.max);
// 	colorRange.value = randomInt(colorRange.min,colorRange.max);
// 	frameTime.value = 5;
	
// 	updateAllValues();
// 	render();
// }

function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function getRandomOdd(range) {
	let number;
	do { number = Math.floor(Math.random()*range); }
	while( number % 2 == 0 );
	return number;
}
