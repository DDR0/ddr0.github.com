/*jshint multistr:true, globalstrict:true*/
/*global _, devicePixelRatio, console, requestAnimationFrame*/
"use strict";




// LOGICY STUFF //

var simRes = {x:10, y:10};

function getNewFluidObj() {
	return Object.seal({
		volume: 0,
		pressure: 0,
		velocity: Object.seal({
			x: 0,
			y: 0,
		}),
		colour: new Uint8ClampedArray([0,0,0,175]),
	});
}

function getNewEnvObj() {
	return Object.seal({
		type: 0, //0:empty, 1:wall, 3:spigot, 4:drain
		spigot: Object.seal({
			rate: 0,
			velocity: Object.seal({
				x: 0,
				y: 0,
			}),
		}),
		colour: new Uint8ClampedArray([255,0,0,255]),
	});
}

var fluidGridCycle = 0; //This gets toggled between 0 and 1 each cycle the sim runs, because the sim is toggling between writing to the first and second fluid grid.
var fluidGrid = _.range(2).map(function() {
	return _.range(simRes.x).map(function() {
		return _.range(simRes.y).map(function() {
			return getNewFluidObj();
		});
	});
});

//Create the environment grid. 
//rED gREEN bLUE BlACK are set to the water grid, though, and the env grid set to air ( ).
//X is wall, + is spigot, - is drain.
var envGrid = '\
 X        ,\
 X  l     ,\
 XXXXXXXXX,\
          ,\
XX        ,\
          ,\
  X    X  ,\
   X  X   ,\
   XXXX   ,\
   X  X   '
.split(',') //Split into lines, getting rid of the \ns.
.map(function(line, x) {
	return _.map(line, function(chr, y) {
		
		//Default environmental object.
		var envObj = getNewEnvObj();
		
		//Space for fluid.
		if(chr===' ') return envObj;
		
		//Wall
		else if(chr==='X') { 
			envObj.type = 1;
			return envObj;
		}
		
		//Fluid, so add fluid to fluid grid and add space for fluid in the environment. 
		else if(chr!==chr.toLocaleUpperCase) { //'caseable' lower characters. (eg, 'l' for in 'ldX'.)
			var fluidCell = fluidGrid[fluidGridCycle][x][y];
			fluidCell.volume = 1;
			if(chr==='l') {} //default
			else if(chr==='r') fluidCell.colour = new Uint8ClampedArray([255,  0,  0,200]);
			else if(chr==='g') fluidCell.colour = new Uint8ClampedArray([  0,255,  0,200]);
			else if(chr==='b') fluidCell.colour = new Uint8ClampedArray([  0,  0,255,200]);
			else throw new Error('\'' + chr + '\' isn\'t mapped to any fluidGrid entry.');
			
			return envObj;
		}
		
		throw new Error('\'' + chr + '\' isn\'t mapped to any envGrid entry.');
	});
});


if(fluidGrid[0].length !== fluidGrid[1].length || fluidGrid[1].length !== envGrid.length) throw new Error('fluid grids and env grid lengths are inconsistent');


// RENDERY STUFF //

var c = document.getElementById('canvas').getContext('2d');
c.canvas.width *= devicePixelRatio, c.canvas.height *= devicePixelRatio;
//c.scale(devicePixelRatio, devicePixelRatio);

//var lineW = 1/devicePixelRatio

/*
c.fillRect(10,10,1,1);
c.fillRect(12,10,2,2);

function clamp(f) {return Math.max(0,Math.min(1,f));}
function sin2d(x,y) {return Math.sin(x)/4 + Math.sin(y)/4+0.5;}
function tan2d(x,y) {return Math.tan(x)/4 + Math.tan(y)/4+0.5;}
function atan2d(x,y) {return Math.atan(x)/2 + Math.atan(y)/2 - 1;}
function gradient2d(x,y) {return x/c.canvas.width/2 + y/c.canvas.height/2;}

(function() {
	for (var x = 0; x < c.canvas.width; x++) {
		for (var y = 0; y < c.canvas.height; y++) {
			var r = clamp(gradient2d(x,y));
			c.fillRect(x,y,r,r);
		}
	}
})();
*/

var minRes = Math.min.bind(0, c.canvas.width, c.canvas.height);

function addSetFillFn(c) {
	c.setFill = c.setFillColor ? //takes [r,g,b,a]
		function feSetFillWithSetFillColor(listColour) {
			this.setFillColor.apply(this, [].map.call(listColour, function(v) {return v/255;}));
		} : 
		function feSetFillWithFillStyle(listColour) {
			this.fillStyle = 'rgba('+[].join.call([].slice.call(listColour,0,-1), ',')+','+listColour[3]/255+')';
		};
	}
addSetFillFn(c);

function renderGrid() {
	c.clearRect(0,0,c.canvas.width, c.canvas.height);
	var cellSize = Math.min(c.canvas.width/simRes.x-1, c.canvas.height/simRes.y-1);
	
	c.beginPath(0,0);
	
	for (var x = 0; x < simRes.x; x++) {
		for (var y = 0; y < simRes.y; y++) {
			var eCell = envGrid[y][x];
			if(eCell.type === 1) {
				
				c.moveTo(0.5+Math.floor(cellSize*x),          0.5+Math.floor(cellSize*y)),
				c.lineTo(0.5+Math.floor(cellSize+cellSize*x), 0.5+Math.floor(cellSize*y)),
				c.lineTo(0.5+Math.floor(cellSize+cellSize*x), 0.5+Math.floor(cellSize+cellSize*y)),
				c.lineTo(0.5+Math.floor(cellSize*x),          0.5+Math.floor(cellSize+cellSize*y)),
				c.lineTo(0.5+Math.floor(cellSize*x),          0.5+Math.floor(cellSize*y));
			}
			
			var fCell = fluidGrid[fluidGridCycle][y][x];
			if(fCell.volume) {
				c.setFill(fCell.colour), 
				c.fillRect(cellSize*x+1, cellSize*y+1, cellSize-1, cellSize-1);
				c.fillText(fCell.volume.toFixed(2) + ' at ' + fCell.pressure.toFixed(2), cellSize*x+1, cellSize*y+(cellSize-1)-10, cellSize);
				c.fillText(fCell.velocity.x.toFixed(2) + '/' + fCell.velocity.y.toFixed(2), cellSize*x+1, cellSize*y+(cellSize-1), cellSize);
			}
		}
	}
	c.stroke();
}

renderGrid();
requestAnimationFrame(function mainLoop() {
	//stepLogic();
	renderGrid();
	//requestAnimationFrame(mainLoop);
});


function getfc(x,y) {
	return fluidGrid[fluidGridCycle][y][x];
}


// LOGICY STUFF //

var stepLogic;
(function slContainer() {
	var fec = getNewEnvObj();
	fec.type = 1; //Bound the world with walls.
	fec = Object.freeze(fec);
	
	var ffc = getNewFluidObj();
	ffc = Object.freeze(ffc);
	
	function getCellAt(grid, defaultCell, x,y) {
		if(x<0 || y<0 || x>=simRes.x || y>=simRes.y) return defaultCell;
		return grid[y][x];
	}
	window.gc = getCellAt;
	
	//Return a cell after application of velocity to it's contents. Relative to us?
	var volU = 0, volD = 0, volL =0, volR = 0;
	function predictedVolumeOfCellAfterOwnFlow(cell) {
		//deg*0.0174532925=rad
		return cell.volume - cell.volume * (Math.abs(cell.velocity.x) + Math.abs(cell.velocity.y));
	}

	var pCyc, nCyc, pCl, nCl, eCl, upF, dnF, ltF, rtF, upE, dnE, ltE, rtE; //Cells
	var volIOU=0, volIOD=0, volIOL=0, volIOR=0; //Volume factors, udlr. 
	var cVolThis = 0, cVolU = 0, cVolD = 0, cVolL = 0, cVolR = 0; //neighbouring cell volumes after velocity
	var chan; //misc/looping
	stepLogic = function stepLogic() {
		pCyc = fluidGridCycle; //previous cycle, next cycle
		nCyc = fluidGridCycle^=1;
		
		for (var x = 0; x < simRes.x; x++) {
			for (var y = 0; y < simRes.y; y++) {
				pCl = getCellAt(fluidGrid[pCyc], -1, x,y), //previous/next cell
				nCl = getCellAt(fluidGrid[nCyc], -2, x,y), //write only, all others are read-only
				eCl = getCellAt(envGrid, -3, x,y),         //The numbers are used as 'false return' values, which should error out sooner rather than later with a --hopefully-- informative error message.
				
				upF = getCellAt(fluidGrid[pCyc], ffc, x,y-1),
				dnF = getCellAt(fluidGrid[pCyc], ffc, x,y+1),
				ltF = getCellAt(fluidGrid[pCyc], ffc, x-1,y),
				rtF = getCellAt(fluidGrid[pCyc], ffc, x+1,y),
				
				upE = getCellAt(envGrid, fec, x,y-1),
				dnE = getCellAt(envGrid, fec, x,y+1),
				ltE = getCellAt(envGrid, fec, x-1,y),
				rtE = getCellAt(envGrid, fec, x+1,y);
				
				//Calculate the new pressures, based on surrounding pressure and velocity.
				
				volIOU = (/*upF.velocity.y < 0 ? pCl.volume : */upF.volume) * upF.velocity.y;
				volIOD = (/*dnF.velocity.y > 0 ? pCl.volume : */dnF.volume) * dnF.velocity.y;
				volIOL = (/*ltF.velocity.x < 0 ? pCl.volume : */ltF.volume) * ltF.velocity.x;
				volIOR = (/*rtF.velocity.x > 0 ? pCl.volume : */rtF.volume) * rtF.velocity.x;
				
				nCl.pressure = (upF.volume && pCl.volume) ? upF.volume + upF.pressure : 0; //Gravity.
				nCl.pressure += volIOU + volIOD + volIOL + volIOR; //Inflow/outflow.
				nCl.pressure += Math.max(0, nCl.volume-1) + Math.min(0, nCl.volume); //Over/under pressure.
				
				//nCl.velocity.x = (pCl.velocity.x*pCl.volume + rtF.velocity.y*volIOR + volIOL)/3;
				//nCl.velocity.y = (pCl.velocity.y*pCl.volume + volIOD + volIOU)/3;
				
				cVolThis = predictedVolumeOfCellAfterOwnFlow(pCl);
				cVolU = predictedVolumeOfCellAfterOwnFlow(upF);
				cVolD = predictedVolumeOfCellAfterOwnFlow(dnF);
				cVolL = predictedVolumeOfCellAfterOwnFlow(ltF);
				cVolR = predictedVolumeOfCellAfterOwnFlow(upF);
				
				//Velocity is calculated. (no sanity check to end)
				nCl.velocity.y = volIOD - volIOU;
				nCl.velocity.x = volIOR - volIOL;
				
				nCl.velocity.x += (cVolL - cVolThis)/2 + (cVolThis - cVolR)/2;
				nCl.velocity.y += (cVolU - cVolThis + 1)/2 + (cVolThis - cVolD + 1)/2;
				
				nCl.volume = pCl.volume + volIOU + volIOD + volIOL + volIOR;
				
				if(nCl.velocity.x > 0 && rtE.type === 1) nCl.velocity.x = 0;
				if(nCl.velocity.x < 0 && ltE.type === 1) nCl.velocity.x = 0;
				if(nCl.velocity.y > 0 && dnE.type === 1) nCl.velocity.y = 0;
				if(nCl.velocity.y < 0 && upE.type === 1) nCl.velocity.y = 0;
				//Velocity is sane now.
				
				if(0&&x===5&&y===1) {
					console.log(x,y);
					debugger;
				}
				//Smooth out the water surface (special case for one drop, can't make up it's mind which way to go.)
				if(/*!nCl.velocity.x && !nCl.velocity.y && */cVolThis != cVolR && rtE.type !== 1) nCl.volume += (cVolR - cVolThis)/3;
				if(/*!nCl.velocity.x && !nCl.velocity.y && */cVolThis != cVolL && ltE.type !== 1) nCl.volume += (cVolL - cVolThis)/3;
				//if(!nCl.velocity.x && !nCl.velocity.y && cVolThis != cVolD && dnE.type !== 1) nCl.volume += (cVolD - cVolThis)/3;
				//if(!nCl.velocity.x && !nCl.velocity.y && cVolThis != cVolU && upE.type !== 1) nCl.volume += (cVolThis - cVolU)/3;
				
				for (chan = 0; chan < 4; chan++) {
					nCl.colour[chan] = pCl.colour[chan];
				}
			}
		}
	};
})();

Object.defineProperty(window, 's', {
	get: function() {return stepLogic(),renderGrid(),1;},
	set: function(s) {
		_.range(s).forEach(function() {
			stepLogic();
		}),
		renderGrid();
	},
});