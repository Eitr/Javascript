// Michael Short 2019 - Digital Analog Clock

const canvas = document.getElementById("canvas");
const g2d = canvas.getContext("2d");

const fps = 24;
let dayOfWeek;
let isNight = false;
let SIZE = 48;
let animationSpeed = 1;
let bigDisplay;
let r=0,g=250,b=0;
let colorMode = 1;

function render() {
	// Resizes the canvas to fit the screen
	canvas.width = document.body.clientWidth-20;
	canvas.height = document.body.clientHeight-20;
	
	g2d.clearRect(0,0,canvas.width,canvas.height);
	g2d.lineCap="round";
	
	// Set the display size based on canvas size
	SIZE = canvas.width/22;
	const xOffset = SIZE/2;
	const yOffset = canvas.height/2-SIZE*2;

	bigDisplay = new Display(xOffset,yOffset);
	bigDisplay.setBorderTime(9.25);

	setInterval(loop,Math.floor(1000/fps));
}

// Event loop called for each frame
function loop() {
	// Update the current time
	const date = new Date();
	dayOfWeek = date.getDay();
	let curHour = date.getHours();
	let curMin = date.getMinutes();
	isNight = curHour < 7 || curHour > 19;
	// Convert to 12-hour format, replace 0 with 12 (must be after isNight)
	curHour = (curHour-1+12)%12 + 1;
	bigDisplay.setTime(curHour,curMin);
	
	bigDisplay.animate();

	// Update the display
	paintComponent();
}

// Refreshes the canvas and draws all the stuff
function paintComponent() {
	g2d.clearRect(0,0,canvas.width,canvas.height);
	updateColor();
	bigDisplay.draw();

	// Days of the week
	g2d.font = "bold 72px Arial";
	g2d.textAlign = "center";
	const gap = canvas.width/9;
	let weekx = gap*1.5; 
	let weeky = 80;
	const days = ["S","M","T","W","R","F","S"];
	days.forEach(d => {
		g2d.fillText(d,weekx,weeky);
		weekx += gap;
	});

	// Draws a box around the current day of the week
	g2d.lineWidth = 4;
	g2d.strokeRect(gap*dayOfWeek+gap,100,gap,2);
}


// A set of clocks to form a display
class Display {
	// Clock hands formation for each digit
	form;

	// Pixel offset for drawing
	xoffset;
	yoffset;
	// Display grid of individual clocks
	display;
	// Locations on the grid 00:00
	digit;
	colon;

	constructor(xoff, yoff) {
		this.createDisplayForm();
		this.xoffset = xoff;
		this.yoffset = yoff;

		// Create the display of clocks
		this.display = [];
		this.digit = [new Point(0,0),new Point(5,0),new Point(12,0),new Point(17,0)];
		this.colon = new Point(10,1);
		
		const displayWidth = 22;
		const displayHeight = 6;
		for(let x = 0; x < displayWidth; x++) {
			this.display[x] = [];
			for(let y = 0; y < displayHeight; y++) {
				this.display[x][y] = new Clock(SIZE*x+xoff,SIZE*y+yoff);

				// Set initial clock times and goal to random value
				const randomMin = Math.floor(Math.random()*60);
				const randomHour = Math.floor(Math.random()*12);
				this.display[x][y].min = randomMin;
				this.display[x][y].goalMin = randomMin;
				this.display[x][y].hour = randomHour;
				this.display[x][y].goalHour = randomHour;
				this.display[x][y].updateAngle();
			}
		}
	}

	createDisplayForm() {
		// Clock hand directions
		const ns = 0.50, ew = 9.25, ne = 0.25, se = 6.25, sw = 5.75, nw = 0.75;

		// Clock hands formation for each digit
		this.form = [
			[[se,ew,ew,ew,sw],[ns,se,ew,sw,ns],[ns,ns,ew,ns,ns],[ns,ns,ew,ns,ns],[ns,ne,ew,nw,ns],[ne,ew,ew,ew,nw]],    // 0
			[[ew,ew,se,sw,ew],[ew,ew,ns,ns,ew],[ew,ew,ns,ns,ew],[ew,ew,ns,ns,ew],[ew,ew,ns,ns,ew],[ew,ew,ne,nw,ew]],    // 1
			[[se,ew,ew,ew,sw],[ne,ew,ew,sw,ns],[se,ew,ew,nw,ns],[ns,se,ew,ew,nw],[ns,ne,ew,ew,sw],[ne,ew,ew,ew,nw]],    // 2
			[[se,ew,ew,ew,sw],[ne,ew,ew,sw,ns],[se,ew,ew,nw,ns],[ne,ew,ew,sw,ns],[se,ew,ew,nw,ns],[ne,ew,ew,ew,nw]],    // 3
			[[se,sw,ew,se,sw],[ns,ns,ew,ns,ns],[ns,ne,ew,nw,ns],[ne,ew,ew,sw,ns],[ew,ew,ew,ns,ns],[ew,ew,ew,ne,nw]],    // 4
			[[se,ew,ew,ew,sw],[ns,se,ew,ew,nw],[ns,ne,ew,ew,sw],[ne,ew,ew,sw,ns],[se,ew,ew,nw,ns],[ne,ew,ew,ew,nw]],    // 5
			[[se,sw,ew,ew,ew],[ns,ns,ew,ew,ew],[ns,ne,ew,ew,sw],[ns,se,ew,sw,ns],[ns,ne,ew,nw,ns],[ne,ew,ew,ew,nw]],    // 6
			[[se,ew,ew,ew,sw],[ne,ew,ew,sw,ns],[ew,ew,ew,ns,ns],[ew,ew,ew,ns,ns],[ew,ew,ew,ns,ns],[ew,ew,ew,ne,nw]],    // 7
			[[se,ew,ew,ew,sw],[ns,se,ew,sw,ns],[ns,ne,ew,nw,ns],[ns,se,ew,sw,ns],[ns,ne,ew,nw,ns],[ne,ew,ew,ew,nw]],    // 8
			[[se,ew,ew,ew,sw],[ns,se,ew,sw,ns],[ns,ne,ew,nw,ns],[ne,ew,ew,sw,ns],[ew,ew,ew,ns,ns],[ew,ew,ew,ne,nw]]     // 9
		];
	}

	setTime(hour, min) {
		// Each display has 4 digits 00:00
		this.setDigit(0, Math.floor(hour/10));
		this.setDigit(1, hour%10);
		this.setDigit(2, Math.floor(min/10));
		this.setDigit(3, min%10);
	}

	// Sets the goal time for all the clocks that make up this digit
	setDigit(d, time) {
		const digitWidth = 5;
		const digitHeight = 6;
		for(let x = 0; x < digitWidth; x++) {
			for(let y = 0; y < digitHeight; y++) {
				const nx = x+this.digit[d].x;
				const ny = y+this.digit[d].y;
				this.display[nx][ny].setGoalTime(this.form[time][y][x]);
			}
		}
	}

	setBorderTime(time) {
		for(let x = 0; x < this.display.length; x++) {
			for(let y = 0; y < this.display[0].length; y++) {
				let able = true;
				for(let d = 0; d < this.digit.length; d++) {
					if(x >= this.digit[d].x && x < this.digit[d].x+5 && y >= this.digit[d].y && y < this.digit[d].y+6) {
						able = false;
						break;
					}
				}
				// Creates squares for the colon : in the middle
				const colon = this.colon;
				if(x >= colon.x && x < colon.x+2 && y >= colon.y && y < colon.y+4) {
					if( x == colon.x && (y == colon.y || y == colon.y+2) )
						this.display[x][y].setGoalTime(6.25);
					else if( x == colon.x && (y == colon.y+1 || y == colon.y+3) )
						this.display[x][y].setGoalTime(0.25);
					else if( x == colon.x+1 && (y == colon.y || y == colon.y+2) )
						this.display[x][y].setGoalTime(5.75);
					else if( x == colon.x+1 && (y == colon.y+1 || y == colon.y+3) )
						this.display[x][y].setGoalTime(0.75);
				} else if(able) {
					this.display[x][y].setGoalTime(time);
				}
			}
		}
	}

	// Animates all of the individual clocks in the display
	animate() {
		for(let x = 0; x < this.display.length; x++) {
			for(let y = 0; y < this.display[0].length; y++) {
				this.display[x][y].animate(animationSpeed,0);
			}
		}
	}

	// Draws all of the individual clocks in the display
	draw() {
		const colon = this.colon;
		for(let x = 0; x < this.display.length; x++) {
			for(let y = 0; y < this.display[0].length; y++) {
				// Ignore top/bottom clocks on center colon
				const aboveColon = (x == colon.x && y == colon.y-1)||(x == colon.x+1 && y == colon.y-1);
				const belowColon = (x == colon.x && y == colon.y+4)||(x == colon.x+1 && y == colon.y+4);
				if(!aboveColon && !belowColon) {
					this.display[x][y].draw(x*SIZE+this.xoffset,y*SIZE+this.yoffset);
				}
			}
		}
	}
}


/** Each individual analog clock */
class Clock {
	minAngle;
	hourAngle;
	min;
	hour;
	goalMin;
	goalHour;
	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	// Whole number = hour, decimal = minute
	setGoalTime(time) {
		this.goalMin = Math.round((time-Math.floor(time))*60)%60;
		this.goalHour = Math.floor(time)%12;
	}

	// Moves the clock hands towards the goal at the given rate
	animate(addmin, addhour) {
		const goalMet = this.goalHour === this.hour && Math.abs((this.goalMin+30)%60 - (this.min+30)%60) <= addmin;
		if(goalMet) { return; }

		const offsethr = this.goalHour-this.hour;
		const offsetmin = this.goalMin-this.min;

		if(offsethr == 0) {
			this.min = (this.min + ((offsetmin<0)? -1:+1) * addmin);
		} else {
			this.min = (this.min + ((offsethr>=6 || (offsethr>-6 && offsethr<0))? -1:+1) * addmin);
		}
		this.hour = (this.hour + addhour) % 12;

		if(this.min >= 60) {
			this.hour = (this.hour+1)%12;
			this.min = this.min % 60;
		} else if(this.min < 0) {
			this.hour = (this.hour-1+12)%12;
			this.min = (this.min+60) % 60;
		}

		this.updateAngle();
	}

	// Sets the clock hands draw angles based on the current minute/hour (radians)
	updateAngle() {
		this.minAngle = this.min/60.0 * Math.PI*2 - Math.PI/2;
		this.hourAngle = this.hour/12.0 * Math.PI*2 + (this.min/60.0*Math.PI/6.0) - Math.PI/2;
	}

	// Draws this clock at the given location center
	draw(x, y) {
		g2d.lineWidth = 8;
		const minLength = 0.5 * SIZE;
		const hourLength = 0.4 * SIZE;
		const minPoint = new Point(Math.floor(x + minLength * Math.cos(this.minAngle)),Math.floor(y + minLength * Math.sin(this.minAngle)));
		const hourPoint = new Point(Math.floor(x + hourLength * Math.cos(this.hourAngle)),Math.floor(y + hourLength * Math.sin(this.hourAngle)));
		drawLine(x,y,minPoint.x,minPoint.y);
		drawLine(x,y,hourPoint.x,hourPoint.y);
	}
}

// Helper function for drawing lines on the canvas
function drawLine(x1,y1,x2,y2) {
	g2d.beginPath();
	g2d.moveTo(x1, y1);
	g2d.lineTo(x2, y2);
	g2d.stroke();
}

class Point {
	constructor(x,y) {
		this.x = x;
		this.y = y;
	}
}

// Fades the draw color between different r,g,b values
function updateColor() {
	const s = 2;
	const max = isNight? 100:250; // limit brightness
	switch(colorMode) {
		case 1: if(b<max) b+=s;else colorMode++; break;
		case 2: if(g>10)  g-=s;else colorMode++; break;
		case 3: if(r<max) r+=s;else colorMode++; break;
		case 4: if(b>10)  b-=s;else colorMode++; break;
		case 5: if(g<max) g+=s;else colorMode++; break;
		case 6: if(r>10)  r-=s;else colorMode=1; break;
	}
	g2d.fillStyle = `rgb(${r},${g},${b})`;
	g2d.strokeStyle = `rgb(${r},${g},${b})`;
}
