
function getElem(x) {
	return document.getElementById(x);
}
function clampColor(x) {
	return Math.min(255,Math.max(0,x));;
}

var canvas = getElem("canvas");
var g2d = canvas.getContext("2d");
var r,g,b;

var minMaxLabels = ["branch","size","scale","angle"];
var otherLabels = ["locX","locY","startLength","startWidth","colorRange"];

var branchMin = getElem("branchMinIn");
var branchMax = getElem("branchMaxIn");
var sizeMin = getElem("sizeMinIn");
var sizeMax = getElem("sizeMaxIn");
var scaleMin = getElem("scaleMinIn");
var scaleMax = getElem("scaleMaxIn");
var angleMin = getElem("angleMinIn");
var angleMax = getElem("angleMaxIn");
var locX = getElem("locXIn");
var locY = getElem("locYIn");
var startLength = getElem("startLengthIn");
var startWidth = getElem("startWidthIn");

var colorRange = getElem("colorRangeIn");

var nextStack = [];
var blocking;
var curInterval = 0;
var fps;
var maxStack = 1;

function updateValue(element,value) {
	getElem(element).innerHTML=value;
}

function updateMinMaxValue(element,value) {
	updateValue(element,value);
	var isMin = element.toLowerCase().indexOf("min") > 0;
	checkRanges(isMin);
}

function checkRanges(isMin) {
	isMin = isMin || false;
	minMaxLabels.forEach(function(x) {
		var min = parseInt(getElem(x+"MinIn").value);
		var max = parseInt(getElem(x+"MaxIn").value);
		if(min > max) {
			if(isMin) {
				getElem(x+"Max").innerHTML=min;
				getElem(x+"MaxIn").value=min;
			} else {
				getElem(x+"Min").innerHTML=max;
				getElem(x+"MinIn").value=max;
			}
		}
	});
}

function updateAllValues() {
	minMaxLabels.forEach(function(x) {
		getElem(x+"Min").innerHTML = getElem(x+"MinIn").value;
		getElem(x+"Max").innerHTML = getElem(x+"MaxIn").value;
	});
	otherLabels.forEach(function(x) {
		getElem(x).innerHTML = getElem(x+"In").value;
	});
}

function render() {
	getElem("canvas").width = document.body.clientWidth-20;
	getElem("canvas").height = document.body.clientHeight-20;
	if(curInterval != 0) {
		clearInterval(curInterval);
	}
	nextStack = [];
	maxStack = 1;
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.strokeStyle="black";
	g2d.lineCap="round";
	r = parseInt(Math.random()*200)+55;
	g = parseInt(Math.random()*200)+55;
	b = parseInt(Math.random()*200)+55;
	
	recurse(locX.value,canvas.height-locY.value,startLength.value,startWidth.value,Math.PI/2,0, 1);
	blocking = false;
	curInterval = setInterval(nextFrame, 30);
}

var nextFrame = function() {
	if(!blocking) {
		blocking = true;
		var curStack;
		var total = nextStack.length;
		var limit = 12;
		if(total > limit) {
			curStack = nextStack.slice(0,limit);
			for (var i = 0; i < total-limit; i++) {
				nextStack[i] = nextStack[i+limit];
			}
			nextStack.length = total-limit;
		} else {
			curStack = nextStack;
			nextStack = [];
		}
		
		var working;
		if(total >= maxStack) {
			maxStack = total;
			working = "...";
		} else {
			working = parseInt((1-total/maxStack)*50+50);
		}
		
		working += "% (fps:"+parseInt(1000 / ((new Date) - fps))+")";
		
		if(total == 0) {
			updateValue("progress","");
		} else {
			updateValue("progress",working+"  "+total+" branches");
		}
		
		for(var i = 0; i < curStack.length; i++) {
			recurse(curStack[i][0],curStack[i][1],curStack[i][2],curStack[i][3],curStack[i][4],curStack[i][5],curStack[i][6]);
		}
		blocking = false;
	}
	fps = new Date;
}

function recurse(rootX, rootY, preLength, preWidth, preAngle, dir, preSize) {
	var length = getLength(preLength);
	var width = getLength(preWidth);
	var angle = getAngle(preAngle, dir);
	
	var x = Math.cos(angle)*length+parseInt(rootX);
	var y = -Math.sin(angle)*length+parseInt(rootY);
	
	var branches = getBranches();
	var colorScale = colorRange.value;
	
	var xr = parseInt((Math.random()*colorScale)-(colorScale/2));
	var xg = parseInt((Math.random()*colorScale)-(colorScale/2));
	var xb = parseInt((Math.random()*colorScale)-(colorScale/2));
	var tr,tg,tb;
	
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
	
	g2d.beginPath();
	g2d.moveTo(rootX,rootY);
	g2d.lineWidth = parseInt(width);
	g2d.lineTo(x,y,length);
	g2d.stroke();
	
	if(dir == 0) { dir = 1; }
	
	if(length < 2 || getSize() < preSize) { return; }
	
	for(var i = 0; i < branches; i++) {
		nextStack[nextStack.length] = [x,y,length,width,angle,dir,preSize+1];
		dir *= -1;
	}
}

function getLength(preLength) {
	return Math.max(((Math.random()*(parseInt(scaleMax.value)-parseInt(scaleMin.value))+parseInt(scaleMin.value))*preLength/100),1);
}

function getAngle(preAngle, dir) {
	if(dir == 0) {
		return preAngle;
	}
	return ((Math.random()*(parseInt(angleMax.value)-parseInt(angleMin.value))+parseInt(angleMin.value))/100*Math.PI*dir + preAngle);
}

function getBranches() {
	return Math.round(Math.random()*(parseInt(branchMax.value)-parseInt(branchMin.value))+parseInt(branchMin.value));
}

function getSize() {
	return (Math.random()*(parseInt(sizeMax.value)-parseInt(sizeMin.value))+parseInt(sizeMin.value));
}

function onLoad() {
	branchMin.value = 2;
	branchMax.value = 3;
	sizeMin.value = 6;
	sizeMax.value = 14;
	scaleMin.value = 66;
	scaleMax.value = 80;
	angleMin.value = 10;
	angleMax.value = 25;
	locX.value = 900;
	locY.value = 20;
	startLength.value = 260;
	startWidth.value = 16;
	colorRange.value = 20;
	
	updateAllValues();
	render();
}

