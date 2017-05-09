var theCanvas = document.getElementById("myCanvas");
var c = theCanvas.getContext("2d");

var branchMin = document.getElementById("branchMinIn");
var branchMax = document.getElementById("branchMaxIn");
var sizeMin = document.getElementById("sizeMinIn");
var sizeMax = document.getElementById("sizeMaxIn");
var scaleMin = document.getElementById("scaleMinIn");
var scaleMax = document.getElementById("scaleMaxIn");
var angleMin = document.getElementById("angleMinIn");
var angleMax = document.getElementById("angleMaxIn");
var locX = document.getElementById("locXIn");
var locY = document.getElementById("locYIn");
var startLength = document.getElementById("startLengthIn");
var startWidth = document.getElementById("startWidthIn");

var nextStack = [];
var blocking;
var curInterval = 0;
var fps;
var maxStack = 1;

function updateValue(element,value)
{
	document.getElementById(element).innerHTML=value;
}

var render = function ()
{
	if (curInterval != 0)
		clearInterval(curInterval);
	c.clearRect(0,0,theCanvas.width,theCanvas.height);
	nextStack = [];
	maxStack = 1;
	c.strokeStyle="black";
	c.beginPath();
	recurse(locX.value,theCanvas.height-locY.value,startLength.value,startWidth.value,Math.PI/2,0, 1);
	block = false;
	curInterval = setInterval(nextFrame, 50);
}

var nextFrame = function ()
{
	if(!blocking)
	{
		blocking = true;
		var curStack;
		var total = nextStack.length;
		var limit = 12;
		if (total > limit)
		{
			curStack = nextStack.slice(0,limit);
			for (var i = 0; i < total-limit; i++)
			{
				nextStack[i] = nextStack[i+limit];
			}
			nextStack.length = total-limit;
		}
		else
		{
			curStack = nextStack;
			nextStack = [];
		}
		
		var working;
		if (total >= maxStack)
		{
			maxStack = total;
			working = "...";
		}
		else
			working = parseInt((1-total/maxStack)*50+50);
		
		working += "% (fps:"+parseInt(1000 / ((new Date) - fps))+")";
		
		if (total == 0)
		{
			updateValue("progress","");
			updateValue("stats","Done");
		}
		else
		{
			updateValue("progress",total+" branches");
			updateValue("stats",working);
		}
		
		for (var i = 0; i < curStack.length; i++)
		{
			recurse(curStack[i][0],curStack[i][1],curStack[i][2],curStack[i][3],curStack[i][4],curStack[i][5],curStack[i][6]);
		}
		blocking = false;
	}
	fps = new Date;
}



function recurse (rootX, rootY, preLength, preWidth, preAngle, dir, preSize)
{
	c.moveTo(rootX,rootY);
	var length = getLength(preLength);
	var width = getLength(preWidth);
	var angle = getAngle(preAngle, dir);
	
	var x = Math.cos(angle)*length+parseInt(rootX);
	var y = -Math.sin(angle)*length+parseInt(rootY);
	
	var branches = getBranches();
	
	c.strokeStyle = "#eee";
	c.lineWidth = parseInt(width);
	c.lineTo(x,y,length);
	c.stroke();
	
	if (dir == 0)
		dir = 1;
	
	if (length < 2 || getSize() < preSize)
		return;
	
	for (var i = 0; i < branches; i++)
	{
		//if (nextStack.length < 500)
		{
			nextStack[nextStack.length] = [x,y,length,width,angle,dir,preSize+1];
			//recurse(x,y,length,width,angle,dir,preSize+1);
			//if (Math.random() > .5)
				dir *= -1;
		}
	}
}

function getLength (preLength)
{
	return Math.max(((Math.random()*(parseInt(scaleMax.value)-parseInt(scaleMin.value))+parseInt(scaleMin.value))*preLength/100),1);
}

function getAngle (preAngle, dir)
{
	if (dir == 0)
		return preAngle;
	return ((Math.random()*(parseInt(angleMax.value)-parseInt(angleMin.value))+parseInt(angleMin.value))/100*Math.PI*dir + preAngle);
}

function getBranches ()
{
	return Math.round(Math.random()*(parseInt(branchMax.value)-parseInt(branchMin.value))+parseInt(branchMin.value));
}

function getSize ()
{
	return (Math.random()*(parseInt(sizeMax.value)-parseInt(sizeMin.value))+parseInt(sizeMin.value));
}

