/* global _, console */
/* jshint globalstrict: true */

"use strict";

var graph, graphs = [], gWidth, gHeight, g, text;
var init = function() {
	document.getElementById('intro').style.display="none";
	document.getElementById('main').style.display="block";
	graph = document.getElementById('graphs');
	graph.addEventListener('mousemove', graphMouseMove);
	graph.addEventListener('click', graphClick);
	g = graph.getContext('2d');
	g.setLineDash = g.setLineDash || function() {};
	text = document.getElementById('outputs');
}; 

var reflow = function() {
	var footer = document.getElementById('footer');
	gWidth = graph.width = Math.min(document.getElementById('main').clientWidth-text.clientWidth, 1000);
	gHeight = graph.height = Math.min(Math.max(graph.width, text.clientHeight), document.body.clientHeight-footer.clientHeight - 50, 800);
};

document.body.onload = function() {
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
	return {
		scalex: 1, //These values are subbed into the formula, and are used to determine how the formula follows the mouse.
		scaley: 1,
		offsetx: 0,
		offsety: 0,
		bits: {
			"line": ["", "*(", "*x-", ")+", ""],
			"wave": ["", "*Math.sin(", "*x-", ")+", ""],
			"bowl": ["", "*Math.pow(", "*x-", ", 2)+", ""],
			"bell": ["", "*Math.pow(Math.E, -(1/(2*Math.pow(", ", 2))*Math.pow(x-", ", 2)))+", ""],
		}[type],
		colour: [r,g,b,1],
		dirty: true, //If we need to re-eval the the formula.
		descriptionPosition: 0, //a midy
	};
};

var genFunction = function(graphable) {
	var f, g=graphable; 
	var a=g.scalex, b=g.scaley, c=g.offsetx, d=g.offsety; //TODO: Sub this into the code below so we can just go abcd for stuff.
	eval("f = function line(x) {return " + g.bits[0] + " " + g.scalex + " " + g.bits[1] + " " + g.scaley + " " + g.bits[2] + " " + g.offsetx + " " + g.bits[3] + " " + g.offsety + " " + g.bits[4] + ";}"); //Spaces to avoid x-n where n is -1 becoming x--1, which is an illegal decrement operator.
	return f;
};

var renderCache = [], resolution = 1, zoom = 4, padding = 1.1; var halfpad = (padding-1)/2+1;
renderCache.dirty = true;
var render = function(graphs) {
	g.clearRect(0,0,gWidth,gHeight);
	var midx = gWidth/2, midy = gHeight/2;
	var scale = gWidth/Math.PI/zoom;
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
			g.moveTo(midx+x/padding, (midy*padding-(f(x/(scale))||0)*scale)/padding);
			for(x; x < midx+resolution; x+=resolution) {
				y =                   midy*padding-(f(x/(scale))||0)*scale;
				g.lineTo(midx+x/padding, y/padding);
				if(y >= -midy/padding+midy && y <= +midy/padding+midy) {lastGoodY = y;}
			}
			g.setStrokeColor ? g.setStrokeColor.apply(g, graphable.colour) : g.strokeStyle = "rgba("+graphable.colour.map(function(x) {return Math.round(x*255);}).join()+")";
			g.stroke();
			return lastGoodY;
		}
	});
	renderCache.dirty = false;
	g.restore();
	
	graphys.forEach(function(goodY, index) {
		g.beginPath();
		g.moveTo(gWidth/(halfpad)+5, goodY/padding);
		g.lineTo(gWidth, index*15+7);
		g.stroke();
	});
};

var textCache = document.createDocumentFragment();
var write = function(graphs) {
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
			console.log(event);
			event.target.textContent = 
				graph[['scalex','scaley','offsetx','offsety'][place]] += 
				event.deltaX + event.deltaY + event.deltaZ < 0 ? +1 : -1;
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

var nearestFunction = function(x,y) {
	console.log('got', x, y);
	return {dist: 100, index: 1};
};

var graphMouseMove = function(event) {
	console.log('m', event);
};

var graphClick = function(event) {
	console.log('c', event);
};