/* global _, console */

var graph, graphs = [], g, text;
var init = function() {
	"use strict";
	document.getElementById('intro').style.display="none";
	document.getElementById('main').style.display="block";
	graph = document.getElementById('graphs');
	addEventListeners(graph);
	g = graph.getContext('2d');
	g.setLineDash = g.setLineDash || function() {};
	text = document.getElementById('outputs');
}; 

var gWidth, gHeight, midx, midy, scale;
var reflow = function() {
	"use strict";
	var footer = document.getElementById('footer');
	gWidth = graph.width = Math.min(document.getElementById('main').clientWidth-text.clientWidth, 1000);
	gHeight = graph.height = Math.min(Math.max(graph.width, text.clientHeight), document.body.clientHeight-footer.clientHeight - 75, 800);
	midx = gWidth/2, midy = gHeight/2;
	scale = gWidth/Math.PI/zoom;
};

document.body.onload = function() {
	"use strict";
	graphs.push(getGraphable('line', 0.0,0.5,0.0));
	graphs.push(getGraphable('wave', 0.5,0.5,0.0));
	graphs.push(getGraphable('bowl', 0.0,0.0,0.5));
	graphs.push(getGraphable('bell', 0.6,0.1,0.6));
	
	init();
	write(graphs);
	reflow();
	render(graphs);
};

/* hopefully

line: y = a*(b*x-c)+d
wave: y = a*sin(b*x-c)+d
bowl: y = a*pow(b*x-c, 2)+d
bell: y = a*pow(E, -(1/(2*pow(b, 2))*pow(x-c, 2)))+d //Rearranged for standard abcd order.

*/

var getGraphable = function(type, r,g,b) {
	"use strict";
	return {
		scalex: 1, //These values are subbed into the formula, and are used to determine how the formula follows the mouse.
		scaley: 1,
		offsetx: 0,
		offsety: 0,
		bits: {
			//"line": ["", "*(", "*x-", ")+", ""],
			//"wave": ["", "*Math.sin(", "*x-", ")+", ""],
			//"bowl": ["", "*Math.pow(", "*x-", ", 2)+", ""],
			//"bell": ["", "*Math.pow(Math.E, -(1/(2*Math.pow(", ", 2))*Math.pow(x-", ", 2)))+", ""],
			"line": ["", "*(", "*x-", ")+", ""],
			"wave": ["", "*sin(", "*x-", ")+", ""], //TODO: This should probably use a plain string with abcd vars now. See genFunction TODO as well.
			"bowl": ["", "*pow(", "*x-", ", 2)+", ""],
			"bell": ["", "*pow(E, -(1/(2*pow(", ", 2))*pow(x-", ", 2)))+", ""],
		}[type],
		colour: [r,g,b,1],
		dirty: true, //If we need to re-eval the the formula.
		descriptionPosition: 0, //a midy
		moveHint: {
			scalex: 0.1/zoom, 
			scaley: 0.1/zoom, 
			offsetx:0.1/zoom, 
			offsety:0.1/zoom
		}, //A good initial guess on how far to move the factors of the function to make them meet our target, based on what the last value was. Probably a good idea to clamp this to 0.1 for now, with some multiplier for scale. Needs to be smaller than 1/4th of a periodic function, such as sin(x).
	};
};

var genFunction = function(graphable) {
	//This is the ugly bit of the codebase. Ideas welcome. :)
	//Apparently removing the global strict nerfs performance in FF. The alternative is to import the math function manually, which is… ugly.
	//Update: Fixed some stuff with regards to mouse move always rerendering the field, and FF is responsive again. I'm guessing FF queues the mouse move events to some degree?
	var f, g=graphable; 
	var a=g.scalex, b=g.scaley, c=g.offsetx, d=g.offsety; //TODO: Sub this into the code below so we can just go abcd for stuff.
	with(Math) {
		eval("f = function line(x) {return " + g.bits[0] + " " + g.scalex + " " + g.bits[1] + " " + g.scaley + " " + g.bits[2] + " " + g.offsetx + " " + g.bits[3] + " " + g.offsety + " " + g.bits[4] + ";}"); //Spaces to avoid x-n where n is -1 becoming x--1, which is an illegal decrement operator.
	}
	return f;
};

var renderCache = [], resolution = 1, zoom = 4, padding = 1.1, halfpad = (padding-1)/2+1; //Note, might want to scale resolution by zoom and "c", or scaley.
renderCache.dirty = true;
var render = function(graphs) {
	"use strict";
	g.clearRect(0,0,gWidth,gHeight);
	var x=0, y=0;
	
	//Draw the guides.
	g.beginPath();
	g.moveTo(-midx/padding+midx, midy);
	g.lineTo(+midx/padding+midx, midy);
	g.moveTo(midx, -midy/padding+midy);
	g.lineTo(midx, +midy/padding+midy);
	g.setLineDash([1,2]);
	g.stroke();
	g.setLineDash([0]);
	g.beginPath();
	g.moveTo(-midx/padding+midx, -midy/padding+midy);
	g.lineTo(-midx/padding+midx, +midy/padding+midy);
	g.lineTo(+midx/padding+midx, +midy/padding+midy);
	g.stroke();
	g.lineTo(+midx/padding+midx, -midy/padding+midy);
	g.lineTo(-midx/padding+midx, -midy/padding+midy);
	
	if(zoom<0) {throw new Error("can't render with negative zoom");}
	var fudge = 1.5, fontSize = 12, fontWidth = 4;
	for(x = -zoom*fudge; x <= zoom*fudge; x++) {
		g.fillText(""+x, midx-x*scale/padding-fontWidth, midy+midy/padding+fontSize);
	}
	for(y = -zoom*fudge; y <= zoom*fudge; y++) {
		g.fillText(""+y, midx-midx/padding-fontSize, midy-y*scale/padding+fontWidth);
	}
	
	
	//Render graph lines.
	g.save();
	g.clip();
	var graphys = graphs.map(function(graphable, index) {
		var f;
		if(renderCache.dirty || graphable.dirty) {
			f = renderCache[index] = genFunction(graphable);
			graph.dirty = false;
		} else {
			f = renderCache[index];
		}
		if(typeof f!=="function") {
			console.error('error with equation #'+index); //Leave this check in for sanity.
			return midy;
		} else {
			//Draws Graph Here
			var lastGoodY = midy;
			x = -midx;
			g.beginPath();
			//g.moveTo(midx+x/padding, (midy*padding-(f(x/(scale))||0)*scale)/padding); //Not needed, I guess? Mysteries abound.
			for(x; x < midx+resolution; x+=resolution) {
				y = scaledFnValue(f, x);
				g.lineTo(scaledX(x), y);
				if(y >= -midy/padding+midy && y <= +midy/padding+midy) {lastGoodY = y;}
			}
			g.setStrokeColor ? g.setStrokeColor.apply(g, graphable.colour) : g.strokeStyle = "rgba("+graphable.colour.map(function(x) {return Math.round(x*255);}).join()+")";
			g.setLineWidth ? g.setLineWidth(index !== highlight ? 1 : 2) : g.lineWidth = (index !== highlight ? 1 : 2);
			g.stroke();
			return lastGoodY;
		}
	});
	renderCache.dirty = false;
	g.restore();
	
	graphys.forEach(function(goodY, index) {
		g.beginPath();
		g.moveTo(gWidth/(halfpad)+5, Math.max(Math.min(scaledY(midy), scaledFnValue(renderCache[index], midx)), scaledY(-midy)));
		g.lineTo(gWidth, index*15+7);
		g.stroke();
	});
};

var scaledFnValue = function(f, x) {
	"use strict";
	return (midy*padding-(f(x/scale)||0)*scale)/padding; 
};
var scaledX = function(x) {"use strict"; return midx+x/padding;};
var scaledY = function(x) {"use strict"; return midy+x/padding;};

var textCache = document.createDocumentFragment();
var write = function(graphs) {
	"use strict";
	text.innerHTML = "";
	textCache.innerHTML = "";
	graphs.forEach(function(graph, index) {
		var newSpan = document.createElement.bind(document, "span");
		var cell = document.createElement("div");
		cell.className="formula-cell";
		textCache.appendChild(cell);
		var functionSpans = [];
		_.range(9).forEach(function() {
			var span = document.createElement('span');
			functionSpans.push(span);
			cell.appendChild(span);
			span.contentEditable = true;
			span.addEventListener('input', function() {
				console.log('tc is', span.textContent);
				if(!span.textContent) {span.innerHTML="&nbsp";}
			});
			span.addEventListener('keydown', function(event) {
				if(event.which===13) { event.preventDefault(); } //Enter -> <br> element, which is impossible to delete.
			});
		});
		
		var updateNumeric = function(place, event) {
			var newValue = parseFloat(event.target.textContent, 10);
			if(newValue == event.target.textContent) {
				graph[['scalex','scaley','offsetx','offsety'][place]] = newValue;
				graph.dirty = true;
				render(graphs);
				event.target.className = "";
			} else {
				event.target.className = "formula-error";
			}
		};
		
		var increment = function(place, event) {
			event.target.textContent = 
				graph[['scalex','scaley','offsetx','offsety'][place]] += 
				event.deltaX + event.deltaY + event.deltaZ < 0 ? +1 : -1; //FF and Chrome inconsistent about axis.
			graph.dirty = true;
			render(graphs);
		};
		
		var updateTextual = function(place, event) {
			var newValue = event.target.textContent;
			var oldValue = graph.bits[place];
			graph.bits[place] = newValue;
			var testFn;
			try {
				testFn = genFunction(graph)(); //So on success this is returning a… NaN? O_o 
			} catch(e) {
				console.error(e);
			}
			if(typeof testFn === "number") {
				graph.dirty = true;
				render(graphs);
				event.target.className = "";
			} else {
				graph.bits[place]=oldValue;
				event.target.className = "formula-error";
			}
		};
		
		(functionSpans[0].textContent = graph.bits[0]) || (functionSpans[0].innerHTML = "&nbsp");
		(functionSpans[1].textContent = graph.scalex);
		(functionSpans[2].textContent = graph.bits[1]) || (functionSpans[0].innerHTML = "&nbsp");
		(functionSpans[3].textContent = graph.scaley);
		(functionSpans[4].textContent = graph.bits[2]) || (functionSpans[0].innerHTML = "&nbsp");
		(functionSpans[5].textContent = graph.offsetx);
		(functionSpans[6].textContent = graph.bits[3]) || (functionSpans[0].innerHTML = "&nbsp");
		(functionSpans[7].textContent = graph.offsety);
		(functionSpans[8].textContent = graph.bits[4]) || (functionSpans[0].innerHTML = "&nbsp");
		
		functionSpans[0].addEventListener('input', updateTextual.bind(null, 0));
		functionSpans[2].addEventListener('input', updateTextual.bind(null, 1));
		functionSpans[4].addEventListener('input', updateTextual.bind(null, 2));
		functionSpans[6].addEventListener('input', updateTextual.bind(null, 3));
		functionSpans[8].addEventListener('input', updateTextual.bind(null, 4));
		
		functionSpans[1].style.background = "lightgray";
		functionSpans[3].style.background = "lightgray";
		functionSpans[5].style.background = "lightgray";
		functionSpans[7].style.background = "lightgray";
		
		functionSpans[1].addEventListener('input', updateNumeric.bind(null, 0));
		functionSpans[3].addEventListener('input', updateNumeric.bind(null, 1));
		functionSpans[5].addEventListener('input', updateNumeric.bind(null, 2));
		functionSpans[7].addEventListener('input', updateNumeric.bind(null, 3));
		
		functionSpans[1].addEventListener('wheel', increment.bind(null, 0));
		functionSpans[3].addEventListener('wheel', increment.bind(null, 1));
		functionSpans[5].addEventListener('wheel', increment.bind(null, 2));
		functionSpans[7].addEventListener('wheel', increment.bind(null, 3));
		
		// var colour = document.createElement("input"); //yeah, this doesn't work. No change event fired, colour not shown initially, not available on FF/IE, etc.
		// colour.value = "#ff0000";
		// colour.style.float="right";
		// colour.type="color";
		// colour.addEventListener('change', function() {
		// 	console.log('new colour: #' + colour.value);
		// });
		// if(colour.type === "color") {cell.appendChild(colour);}
		
	});
	text.appendChild(textCache);
};

var distanceToNearestFunction = function(spread, functions, x,y) { //x/y in terms of graph-space
	"use strict";
	return functions.
		map(function(f) {
			return _.range(-spread,spread+1). //TODO: Penalize ends.
				map(function(ox) {return x+ox-midx;}).
				map(function(x) {return scaledFnValue(f, x);}).
				map(function difference(ny) {return y-ny;}).
				reduce(function(a,b) {return Math.abs(a) < Math.abs(b) ? a : b;});
		}).
		map(function(d,i) {return {dist:d, index:i};}).
		reduce(function(prev, next) {return Math.abs(prev.dist) < Math.abs(next.dist) ? prev : next;});
};

var highlight = -1;
var addEventListeners = function(graph) {
	"use strict";
	
	var offset = graph.getBoundingClientRect();
	var distanceToNearestFunctionFromMouse = function(spread, functions, x,y) {
		return distanceToNearestFunction(spread, functions, 
			(x-offset.left-midx)*padding+midx, y-offset.top);
	};
	
	var previousMouseX, previousMouseY, isMoveCursor = false, previouslyHighlighted = -1;
	graph.addEventListener('mousemove', function(event) {
		var mouseX = event.x||event.clientX;
		var mouseY = event.y||event.clientY;
		
		if(mouseButtons[0]) {
			if(highlight !== -1) {
				var deltaX = mouseX-previousMouseX;
				var deltaY = mouseY-previousMouseY;
				//console.log('dragging', highlight, deltaX, deltaY);
				var fac = !isMoveCursor ? {x:'offsetx', y:'offsety'} : {x:'scalex', y:'scaley'};
				//Move function by guess.
				//Test function. Take percentage we're off by and multiply guess by that.
				//Test function. If off, factor is non-linear.
				 //Progress by the 2x the part of the factor we were off by. eg, expected 10, got 9, factor is 0.1, try again with 0.12 as the factor.
				  //If that fails, try reversing direction and seeing if we get closer. If we do, continue until we overshoot.
				 //Binary search between the two extremes. Max recursion = 9, tolerance = whatever 0.5px comes out to in graph-land.
				
				//Figure out both at once, we need the ratio data…
				var oldCurve = graphs[highlight];
				var newCurve = _.clone(graphs[highlight]);
				newCurve.dirty = true;
				
				var currentDist, guessedDist, scale;
				if(deltaX) {
					newCurve[fac.x] = oldCurve[fac.x] + (deltaX * oldCurve.moveHint[fac.x]);
					currentDist = distanceToNearestFunctionFromMouse(0, [renderCache[highlight]], mouseX, previousMouseY).dist;
					guessedDist = distanceToNearestFunctionFromMouse(0, [genFunction(newCurve) ], mouseX, previousMouseY).dist;
					scale = Math.abs(currentDist/(currentDist-guessedDist));
					newCurve.moveHint[fac.x] = oldCurve.moveHint[fac.x]*scale;
					newCurve[fac.x] = oldCurve[fac.x] + (deltaX * newCurve.moveHint[fac.x]);
					graphs[highlight] = newCurve;
					render(graphs);
				}
				
				var ratio = deltaX/deltaY;
				
			}
		} else { //Perhaps this bit should be callable from the mouseup function, you can drag nothing onto a line and it doesn't update the graphics.
			var dtf = distanceToNearestFunctionFromMouse(5, renderCache, 
				previousMouseX, previousMouseY);
			highlight = Math.abs(dtf.dist) > 10 ? -1 : dtf.index;
			if(previouslyHighlighted != highlight) {
				previouslyHighlighted = highlight;
				render(graphs);
			}
			
			updateMouse();
		}
		
		previousMouseX = mouseX; 
		previousMouseY = mouseY;
	});
	
	var updateMouse = function() {
		if(isMoveCursor !== highlight < 0) {
			isMoveCursor = highlight < 0; 
			graph.className = highlight < 0 ? "" : mouseMoves ? "cursor-move" : "cursor-resize";
		}
	};
	
	var mouseButtons = {};
	document.body.addEventListener('mousedown', function(event) {
		mouseButtons[event.button] = true;
	});
	document.body.addEventListener('mouseup', function(event) {
		mouseButtons[event.button] = false;
	});
	document.body.addEventListener('mouseout', function() {
		mouseButtons = {};
	});
	
	
	graph.addEventListener('mousedown', function(event) {
		event.preventDefault();
	});
	graph.addEventListener('contextmenu', function(event) {
		event.preventDefault();
	});
	
	var move = document.getElementById('move'), stretch = document.getElementById('scale');
	var mouseMoves = move.checked;
	move.addEventListener('change', function() {
		mouseMoves = true, isMoveCursor = null; //null just invalidates a cache for updateMouse written by the movement function.
		updateMouse();
	});
	stretch.addEventListener('change', function() {
		mouseMoves = false, isMoveCursor = null;
		updateMouse();
	});
};