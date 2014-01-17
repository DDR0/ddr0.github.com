/* global _, console */
/* jshint globalstrict: true */

window.addEventListener('load', function() {
"use strict";

var payload = document.getElementById('payload');
var text;
var width = 81; //Testing ratings: 100 width, 400 height in characters.
var height = 49;
var tick;
var linearIndex; //The character we're on. Incremented each time we generate a character to render. Must be reset between frames.

var reset = function() {
	text = "";
	payload.textContent = text;
	tick = 0;
	linearIndex = 0;
};
reset();

var textGen = function (length, wrap) {
	if(!length) throw new Error('Invalid length for textGen(length).');
	text = "";
	var lastChar = " ";
	for(var x=0; x<length; x++) {
		linearIndex++;
		lastChar = //'▓';
		Math.random() < 0.2 && lastChar.trim() ? 
			' ' : 
			String.fromCharCode(_.random(47,126));
		if(x%wrap===wrap-1) {
			lastChar = '\n';
		} else if(!helixTest()) {
			lastChar = '░';
		}
		text += lastChar;
	}
	return text;
};

var helixTest = function() {
	var x = linearIndex%width;
	var y = Math.floor(linearIndex/height);
	var sin = Math.sin;
	var curveX1 = sin(y/20+tick/10)*20+40;
	var curveX2 = sin(y/20+tick/10+2)*20+40;
	return (x < curveX1 && x > curveX2 ||
	        x > curveX1 && x < curveX2) /*&&
	       (y%5!==0)*/;
};

var log = function() {
	console.log('button pressed', arguments);
};

var iterate = function(renderFunction) {
	console.log('Drawing ' + width*height + ' characters/frame');
	var duration = 2; //target seconds
	
	var iteration = 0;
	var startTime = (new Date()).getTime();
	
	requestAnimationFrame(function render() {
		tick++;
		linearIndex=0;
		renderFunction(iteration);
		if(iteration++ < 60*duration) {
			requestAnimationFrame(render);
			if(duration >= 1 && iteration % 20*(Math.round(duration/2)) === 0) {
				console.log(Math.round(iteration/(60*duration)*100) + '%');
			}
		} else {
			var runtime = (new Date()).getTime()-startTime;
			var framerate = Math.round((duration*1000 / runtime) * 60);
			console.info('run-time: '+runtime+'ms @ '+framerate+'fps ('+(framerate*(width*height)/1000)+'kcps)');
		}
	});
};

var htmlBlock = function() { //12fps
	//No partial updates.
	console.log('Running test with "natural" characters and newlines.');
	reset();
	
	iterate(function() {
		payload.textContent = textGen(width*height, width);
	});
};

var htmlLine = function() { //8fps
	//Can update on a line-by-line basis.
	console.log('Running test with each line as an element.');
	payload.textContent="";
	
	var lines = _.range(height).map(function() {
		return payload.appendChild(document.createElement("div"));
	});
	iterate(function() {
		lines.forEach(function(line) {
			line.textContent = textGen(width);
		});
	});
};

var HtmlChar0 = function() { //⅓fps
	//Can update on a character-by-character basis. Slower, though.
	console.log('Running test with each character as an element.');
	payload.textContent="";
	//if(!confirm("This test may take a long time to run.")) {return;}
	
	var lines = _.range(height).map(function() {
		var line = payload.appendChild(document.createElement("div"));
		return _.range(width).map(function() {
			return line.appendChild(document.createElement("span"));
		});
	});
	iterate(function() {
		lines.forEach(function(line) {
			line.forEach(function(chr) {
				chr.textContent = textGen(1);
			});
		});
	});
};

var htmlChar1 = function() { //⅔fps
	//Can update on a character-by-character basis. Avoids reflows by caching to an unadded element.
	console.log('Running test with each character as an element.');
	//if(!confirm("This test may take a long time to run.")) {return;}
	var cache = document.createDocumentFragment();
	var lines = _.range(height).map(function() {
		var line = cache.appendChild(document.createElement("div"));
		return _.range(width).map(function() {
			return line.appendChild(document.createElement("span"));
		});
	});
	iterate(function() {
		lines.forEach(function(line) {
			line.forEach(function(chr) {
				chr.textContent = textGen(1);
			});
		});
		payload.textContent="";
		payload.appendChild(cache.cloneNode());
	});
};

var htmlChar = function() { //⅓fps, a little better than the naive version, but... not much.
	//Updates like 'block', but parses an html string instead of raw characters.
	console.log('Running test with each character as an element.');
	//if(!confirm("This test may take a long time to run.")) {return;}
	reset();
	
	iterate(function() {
		var buffer = "";
		for(var x=0; x<width*height; x++) {
			var fg = _.sample(['255,0,0', '0,255,0', '0,0,255']);
			var bg = _.sample(['255,127,127', '127,255,127', '127,127,255']);
			buffer += '<span style="color:rgb('+fg+'); background-color:rgb('+bg+');">' + textGen(1) + "</span>";
			if(x%width===width-1) {
				buffer += '\n';
			}
		}
		payload.innerHTML = buffer;
	});
};

var fWidth = 7; //font width in px
var fHeight = 15;
var cWidth = width*fWidth; //canvas width
var cHeight = height*fHeight;

var canvasNewlines = function() {
	throw new Error("canvas.fillText doesn't do newlines");
};

var canvasSingleLines = function() { //7fps
	console.log('Running test with each character in a canvas line.');
	payload.textContent="";
	var canvas = payload.appendChild(document.createElement("canvas"));
	canvas.width = cWidth; canvas.height = cHeight;
	var c = canvas.getContext('2d');
	c.font = "12px monospace";
	
	iterate(function() {
		c.clearRect(0,0,cWidth,cHeight);
		for(var line=0; line<height; c.fillText(textGen(width), 0, fHeight*++line)){}
	});
};

var canvasCharacters = function() { //1fps
	console.log('Running test with each character as a separate canvas operation.');
	payload.textContent="";
	var canvas = payload.appendChild(document.createElement("canvas"));
	canvas.width = cWidth; canvas.height = cHeight;
	var c = canvas.getContext('2d');
	c.font = "12px monospace";
	//if(!confirm("This test may take a long time to run.")) {return;}
	
	iterate(function() {
		c.clearRect(0,0,cWidth,cHeight);
		for(var line=0; line<height; ++line){
			for(var chr=0; chr<width; c.fillText(textGen(1), fWidth*chr++, fHeight*(line+1))){}
		}
	});
};

var silent = iterate.bind(this, textGen.bind(this, width*height, undefined)); //53fps

_.zip( //Bind events to buttons.
	document.getElementsByTagName('button'), 
	[	htmlBlock, htmlLine, htmlChar,     
		canvasNewlines, canvasSingleLines, canvasCharacters,
		silent, reset, 
	])
.forEach(function(args) {
	var fun = args.pop(), btn = args.pop();
	window.btn = btn, window.fun = fun;
	btn.addEventListener('click', fun);
});


});