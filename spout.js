
var fontSize = 30;
var fps = 20;
var maxThrust = 6;
var gravity = 1;
var debug = true;
var turnSpeed = Math.PI/16;
var shipSize = 6;
var canvasWidth = 1200;
var canvasHeight = 600;
var blockSize = 30;

function init()
{
   reset();
	setInterval(loop, parseInt(1000/fps));
}

function generateBlock(bx,by)
{
   var sx = parseInt(Math.random()*blockSize);
   var sy = parseInt(Math.random()*blockSize);
   var index = blocks.length;
   blocks[index] = {x:bx,y:by,s:Math.max(sx,sy),b:[]};
   for (var i = -sx/2; i < sx/2; i+=2)
      for (var j = -sy/2; j < sy/2; j+=2)
      {
         blocks[index].b[blocks[index].b.length] = {x:bx+i,y:by+j};
      }
}

var loop = function ()
{
   /*----- Initialize canvas ---------------------------------------*/
   var canvas = document.getElementById("canvas");
   canvas.width = canvasWidth;
   canvas.height = canvasHeight;
   var c = canvas.getContext("2d");
	c.clearRect(0,0,canvas.width,canvas.height);
   c.fillStyle = "rgb(0,0,0)";
   c.fillRect(0,0,canvas.width,canvas.height);
   
   /*----- Draw ship ----------------------------------------------*/
   if (!gameOver)
   {
      c.beginPath();
      //c.strokeStyle = "rgb(0,250,0)";
      c.fillStyle = "rgb(0,250,0)";
      c.arc(locx,locy,shipSize,angle-Math.PI/2,angle+Math.PI/2);
      //c.stroke();
      c.closePath();
      c.fill();
   }
   
   /*----- Draw blocks --------------------------------------------*/
   
   c.fillStyle = "rgb(250,250,250)";
   for (var i = 0; i < blocks.length; i++)
      for (var b = 0; b < blocks[i].b.length; b++)
      {
         c.fillRect(blocks[i].b[b].x,blocks[i].b[b].y,2,2);
      }
   
   /*----- Draw game over ------------------------------------------*/
   if (gameOver)
   {
      c.font= fontSize*4+"px Georgia";
      c.fillStyle = "rgb(250,0,0)";
      c.fillText("Game Over",canvasWidth/4,canvasHeight/2);
   }
   else
      updateMovement(c);
   
   /*----- Update physics -------------------------------------------*/
   updateGame(c);
   
   drawDebug(c);
}

function updateMovement()
{  
   if (thrusting)
   {
      thrust = Math.min(thrust*2+1,maxThrust);
      
      for (var i = 0; i < 6*thrust; i++)
      {
         spray[spray.length] = {x:locx,y:locy,a:angle+(Math.random()*Math.PI/8-Math.PI/16),t:Math.random()*maxThrust*2,l:parseInt(Math.random()*60+10)};
      }
   }
   else
   {
      locx -= gravity;
      thrust = Math.max(thrust-1,0);
   }
   if (turningLeft)
      angle -= turnSpeed;
   if (turningRight)
      angle += turnSpeed;
      
   
   //locx = Math.max(locx,0+shipSize);
   if (locx-shipSize < 0)
   {
      gameOver = true;
   }
   // Check for ship collision
   for (var b = 0; b < blocks.length; b++)
   {
      if (inRange(locx,locy,blocks[b].x,blocks[b].y,blocks[b].s/2+shipSize))
      {
         for (var sb = 0; sb < blocks[b].b.length; sb++)
         {
            if (inRange(locx,locy,blocks[b].b[sb].x,blocks[b].b[sb].y,shipSize))
            {
               gameOver = true;
               break;
            }
         }
      }
   }
   
   if (gameOver)
   {
      thrust = 0;
      for (var d = 0; d < 1000; d++)
      {
         spray[spray.length] = {x:locx,y:locy,a:(Math.random()*2*Math.PI),t:Math.random()*10,l:Math.random()*100+100};
      }
   }
}

function updateGame(c)
{
   angle = (angle+Math.PI*2)%(Math.PI*2);
   
   if (locx > canvasWidth*2/3 && Math.cos(angle)*thrust > 0)
      forwardMap(Math.cos(angle)*thrust);
   else
      locx += Math.cos(angle)*thrust;
   locy += Math.sin(angle)*thrust;
   
   locy = Math.max(locy,0+shipSize);
   locy = Math.min(locy,canvasHeight-shipSize);
   
   // Check for spray collision
   var deadSpray = 0;
   for (var i = 0; i < spray.length; i++)
   {
      c.fillStyle = "rgb(250,250,0)";
      c.fillRect(spray[i].x,spray[i].y,1,1);
      spray[i].x -= Math.cos(spray[i].a)*spray[i].t;
      spray[i].y -= Math.sin(spray[i].a)*spray[i].t;
      spray[i].l -= 1;
      if (spray[i].l < 0)
         deadSpray++;
         
      for (var b = 0; b < blocks.length; b++)
      {
         if (inRange(spray[i].x,spray[i].y,blocks[b].x,blocks[b].y,blocks[b].s/2))
         {
            for (var sb = 0; sb < blocks[b].b.length; sb++)
            {
               if (inRange(spray[i].x,spray[i].y,blocks[b].b[sb].x,blocks[b].b[sb].y,3))
               {
                  spray[i].x = -100;
                  blocks[b].b[sb].x = -100;
                  spray[i].t = 0;
               }
            }
         }
      }
   }
   for (var i = 0; i < deadSpray; i++)
      spray.shift();
}

function forwardMap(dx)
{
   for (var i = 0; i < spray.length; i++)
   {
      spray[i].x -= dx;
   }
   var deadBlocks = 0;
   for (var b = 0; b < blocks.length; b++)
   {
      blocks[b].x -= dx;
      for (var sb = 0; sb < blocks[b].b.length; sb++)
      {
         blocks[b].b[sb].x -= dx;
      }
      if (blocks[b].x + blockSize < 0)
         deadBlocks++;
   }
   for (var i = 0; i < deadBlocks; i++)
      blocks.shift();
   
   if (blocks.length < canvasWidth*canvasHeight/(blockSize*blockSize))
      generateBlock(parseInt(Math.random()*blockSize+canvasWidth),parseInt(Math.random()*canvasHeight));
}

document.onkeydown = function(e)
{
  e = e || event;
  var key = String.fromCharCode(e.keyCode)
  if (key == 'W')
      thrusting = true;
  if (key == 'A')
      turningLeft = true;
  else if (key == 'D')
      turningRight = true;
  
  if (key == 'R')
      reset();
  if (key == 'Z')
      (debug? debug=false:debug=true);
}

document.onkeyup = function(e)
{
  e = e || event;
  var key = String.fromCharCode(e.keyCode)
  if (key == 'W')
      thrusting = false;
  if (key == 'A')
      turningLeft = false;
  else if (key == 'D')
      turningRight = false;
}

function inRange (a,b,x,y,r)
{
   //return parseInt(Math.sqrt(Math.pow(a-x,2)+Math.pow(b-y,2)));
   return (Math.abs(a-x) < r && Math.abs(b-y) < r);
}


function drawDebug(c)
{
   if (debug)
   {
      c.font= fontSize+"px Arial";
      c.fillStyle = "rgb(0,250,0)";
      var interval = parseInt(1000/((new Date())-delta));
      delta = new Date();
      c.fillText(interval+"",10,fontSize);
      c.fillText("T:"+thrust,10,fontSize*2);
      c.fillText("A:"+parseInt(angle*180/Math.PI),10,fontSize*3);
      c.fillText("S:"+spray.length,10,fontSize*4);
      c.fillText("B:"+blocks.length,10,fontSize*5);
   }
}


function reset()
{
   blocks = [];
   spray = [];
   delta = new Date();
   locx = canvasWidth/2;
   locy = canvasHeight/2;
   thrust = 0;
   angle = 0;
   turningLeft = false;
   turningRight = false;
   thrusting = false;
   gameOver = false;
}

var blocks,spray,delta,locx,locy,thrust,angle,turningLeft,turningRight,thrusting,gameOver;
