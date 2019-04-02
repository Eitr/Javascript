/* Michael Short 2017 - Recursive Fractal Tree Generator */

// Graphics elments
let canvas = getElem("canvas");
let sidebar = getElem("sidebar");
let showButton = getElem("showPanel");
let g2d = canvas.getContext("2d");
let r,g,b;

// List of label names
const minMaxLabels = ["branch","size","scale","angle"];
const otherLabels = ["locX","locY","startLength","startWidth","colorRange","fps","redraw"];

// Label 
let branchMin = getElem("branchMinIn");
let branchMax = getElem("branchMaxIn");
let sizeMin = getElem("sizeMinIn");
let sizeMax = getElem("sizeMaxIn");
let scaleMin = getElem("scaleMinIn");
let scaleMax = getElem("scaleMaxIn");
let angleMin = getElem("angleMinIn");
let angleMax = getElem("angleMaxIn");
let locX = getElem("locXIn");
let locY = getElem("locYIn");
let startLength = getElem("startLengthIn");
let startWidth = getElem("startWidthIn");

let colorRange = getElem("colorRangeIn");
let frameTime = getElem("fpsIn");
let redrawTime = getElem("redrawIn");

// Recursive properties
let nextStack = [];
let busy;
let curInterval = 0;
let fps;
let maxStack = 1;

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

// Updates an html label and checks min/max range
function updateMinMaxValue(ele,value) {
	updateValue(ele,value);
	
	// Whether to set value based on min or max limit
	let isMin = ele.indexOf("Min") > 0;
	let baseEle = isMin? ele.substr(0,ele.indexOf("Min")) : ele.substr(0,ele.indexOf("Max"));
	let min = parseInt(getElem(baseEle+"MinIn").value);
	let max = parseInt(getElem(baseEle+"MaxIn").value);
	
	if(min > max) {
		if(isMin) {
			getElem(baseEle+"Max").innerHTML=min;
			getElem(baseEle+"MaxIn").value=min;
		} else {
			getElem(baseEle+"Min").innerHTML=max;
			getElem(baseEle+"MinIn").value=max;
		}
	}
}

// Updates all html labels with their input values
function updateAllValues() {
	minMaxLabels.forEach(function(x) {
		updateMinMaxValue(x+"Min",getElem(x+"MinIn").value);
		updateMinMaxValue(x+"Max",getElem(x+"MaxIn").value);
	});
	otherLabels.forEach(function(x) {
		updateValue(x,getElem(x+"In").value);
	});
}

// Starts the generation of a tree
function render() {
	// Resizes the canvas to fit the screen
	getElem("canvas").width = document.body.clientWidth-20;
	getElem("canvas").height = document.body.clientHeight-20;
	
	// Stop any current tree being drawn
	if(curInterval != 0) {
		clearInterval(curInterval);
	}
	nextStack = [];
	maxStack = 1;
	
	// Prepare the graphics canvas
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.strokeStyle="black";
	g2d.lineCap="round";
	r = parseInt(Math.random()*200)+55;
	g = parseInt(Math.random()*200)+55;
	b = parseInt(Math.random()*200)+55;
	
	// Create the first branch
	let trunk = {
		x: locX.value,
		y: canvas.height-locY.value,
		length: startLength.value,
		width: startWidth.value,
		angle: Math.PI/2,
		dir: 0,
		size: 1,
	};
	generateBranch(trunk);
	
	// Interval timer to continuously build the tree
	busy = false;
	curInterval = setInterval(nextFrame, frameTime.value);
	
	// Timer for drawing a new tree
	if(redrawTime.value > 0) {
		setTimeout(render, redrawTime.value*1000);
	}
}

// Function called from the interval timer, generates a batch of branches at a time
let nextFrame = function() {
	// Prevents concurrent modification
	if(!busy) {
		busy = true;
		let curStack;
		let total = nextStack.length;
		let limit = 121-frameTime.value;
		if(total > limit) {
			curStack = nextStack.slice(0,limit);
			for (let i = 0; i < total-limit; i++) {
				nextStack[i] = nextStack[i+limit];
			}
			nextStack.length = total-limit;
		} else {
			curStack = nextStack;
			nextStack = [];
		}
		
		let feedback;
		if(total >= maxStack) {
			maxStack = total;
			feedback = "...";
		} else {
			feedback = parseInt((1-total/maxStack)*50+50)+"%";
		}
		
		feedback += " (fps:"+parseInt(1000 / ((new Date) - fps))+")";
		
		if(total == 0) {
			updateValue("progress","");
		} else {
			updateValue("progress",feedback+"  "+total+" branches");
		}
		
		curStack.forEach(function(branch) {
			generateBranch(branch);
		});
		busy = false;
	}
	fps = new Date;
}

// Generates a new branch from a previous one
function generateBranch(root) {
	// Calculate new branch properties based on previous
	let length = getLength(root.length);
	let width = getLength(root.width);
	let angle = getAngle(root.angle, root.dir);
	let dir = root.dir;
	let branches = getBranches();
	let size = getSize();
	
	// Calculate new location based on length/angle
	let x = Math.cos(angle)*length+parseInt(root.x);
	let y = -Math.sin(angle)*length+parseInt(root.y);
	
	// Set randomized color by mode
	let colorScale = colorRange.value;
	let xr = parseInt((Math.random()*colorScale)-(colorScale/2));
	let xg = parseInt((Math.random()*colorScale)-(colorScale/2));
	let xb = parseInt((Math.random()*colorScale)-(colorScale/2));
	
	if(getElem("dynamicColor").checked) {
		r = clampColor(r+xr);
		g = clampColor(g+xg);
		b = clampColor(b+xb);
		g2d.strokeStyle = "rgb("+r+", "+g+", "+b+")";
	} else if(getElem("staticColor").checked) {
		g2d.strokeStyle = "rgb("+clampColor(r+xr)+", "+clampColor(g+xg)+", "+clampColor(b+xb)+")";
	} else {
		g2d.strokeStyle = "rgb("+r+", "+g+", "+b+")";
	}
	
	// Draw on 2d graphics canvas
	g2d.beginPath();
	g2d.moveTo(root.x,root.y);
	g2d.lineWidth = parseInt(width);
	g2d.lineTo(x,y,length);
	g2d.stroke();
	
	// Initial vertical trunk
	if(dir == 0) { dir = 1; }
	
	// Break out if new branch is too short or total branches too long
	if(length < 3 || root.size > size) { return; }
	
	// Else spawn new branches from this one, alternating the direction
	for(let i = 0; i < branches; i++) {
		let newBranch = {
			x: x,
			y: y,
			length: length,
			width: width,
			angle: angle,
			dir: dir,
			size: root.size+1,
		};
		nextStack.push(newBranch);
		dir *= -1;
	}
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
function defaultSettings() {
	locX.value = document.body.clientWidth/2;
	startLength.value = document.body.clientHeight/3;
	locY.value = 20;
	frameTime.value = 20;
	redrawTime.value = 0;
}

function defaultTree() {
	defaultSettings();
	
	branchMin.value = 2;
	branchMax.value = 4;
	sizeMin.value = 6;
	sizeMax.value = 16;
	scaleMin.value = 66;
	scaleMax.value = 80;
	angleMin.value = 10;
	angleMax.value = 25;
	startWidth.value = 16;
	colorRange.value = 12;
	
	updateAllValues();
	render();
}

function squareTree() {
	defaultSettings();
	
	branchMin.value = 2;
	branchMax.value = 2;
	sizeMin.value = 10;
	sizeMax.value = 10;
	scaleMin.value = 68;
	scaleMax.value = 68;
	angleMin.value = 50;
	angleMax.value = 50;
	locY.value = 200;
	startLength.value = 400;
	startWidth.value = 16;
	colorRange.value = 80;
	frameTime.value = 60;
	
	updateAllValues();
	render();
}

function lankyTree() {
	defaultSettings();
	
	branchMin.value = 2;
	branchMax.value = 3;
	sizeMin.value = 6;
	sizeMax.value = 12;
	scaleMin.value = 66;
	scaleMax.value = 80;
	angleMin.value = 0;
	angleMax.value = 14;
	startLength.value = document.body.clientHeight/4;
	startWidth.value = 10;
	colorRange.value = 12;
	
	updateAllValues();
	render();
}

function bushyTree() {
	defaultSettings();
	
	branchMin.value = 2;
	branchMax.value = 2;
	sizeMin.value = 12;
	sizeMax.value = 16;
	scaleMin.value = 78;
	scaleMax.value = 88;
	angleMin.value = 12;
	angleMax.value = 18;
	locY.value = 60;
	startLength.value = document.body.clientHeight/5;
	startWidth.value = 10;
	colorRange.value = 12;
	
	updateAllValues();
	render();
}

function sproutTree() {
	defaultSettings();
	
	branchMin.value = 2;
	branchMax.value = 3;
	sizeMin.value = 3;
	sizeMax.value = 6;
	scaleMin.value = 64;
	scaleMax.value = 84;
	angleMin.value = 5;
	angleMax.value = 25;
	startLength.value = document.body.clientHeight/4;
	startWidth.value = 6;
	colorRange.value = 12;
	
	updateAllValues();
	render();
}

function shrubTree() {
	defaultSettings();
	
	branchMin.value = 4;
	branchMax.value = 4;
	sizeMin.value = 6;
	sizeMax.value = 8;
	scaleMin.value = 80;
	scaleMax.value = 88;
	angleMin.value = 4;
	angleMax.value = 20;
	startLength.value = document.body.clientHeight/6;
	startWidth.value = 18;
	colorRange.value = 12;
	
	updateAllValues();
	render();
}

function cartoonTree() {
	defaultSettings();
	
	branchMin.value = 1;
	branchMax.value = 2;
	sizeMin.value = 10;
	sizeMax.value = 10;
	scaleMin.value = 58;
	scaleMax.value = 76;
	angleMin.value = 48;
	angleMax.value = 50;
	locY.value = 60;
	startLength.value = document.body.clientHeight/2;
	startWidth.value = 24;
	colorRange.value = 52;
	
	updateAllValues();
	render();
}

function artTree() {
	defaultSettings();
	
	branchMin.value = 3;
	branchMax.value = 4;
	sizeMin.value = 6;
	sizeMax.value = 16;
	scaleMin.value = 92;
	scaleMax.value = 92;
	angleMin.value = 28;
	angleMax.value = 44;
	startLength.value = document.body.clientHeight/4;
	startWidth.value = 50;
	colorRange.value = 60;
	frameTime.value = 60;
	
	updateAllValues();
	render();
}

function randomTree() {
	defaultSettings();
	
	function randomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	branchMin.value = randomInt(branchMin.min,branchMin.max);
	branchMax.value = randomInt(branchMin.value,branchMax.max);
	sizeMin.value = randomInt(sizeMin.min,sizeMin.max);
	sizeMax.value = randomInt(sizeMin.value,sizeMax.max);
	scaleMin.value = randomInt(scaleMin.min,scaleMin.max);
	scaleMax.value = randomInt(scaleMin.value,scaleMax.max);
	angleMin.value = randomInt(angleMin.min,angleMin.max);
	angleMax.value = randomInt(angleMin.value,angleMax.max);
	startLength.value = randomInt(startLength.min,startLength.max);
	startWidth.value = randomInt(startWidth.min,startWidth.max);
	colorRange.value = randomInt(colorRange.min,colorRange.max);
	frameTime.value = 5;
	
	updateAllValues();
	render();
}

