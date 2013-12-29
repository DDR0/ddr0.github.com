/* global _, console*/
/* jshint globalstrict: true */

window.addEventListener('load', function() {
"use strict";

var payload = document.getElementById('payload');
var text;
var width = 100; //Testing ratings: 100 width, 400 height in characters.
var height = 100;

var textGen = function (length, wrap) {
	if(!length) throw new Error('Invalid length for textGen(length).');
	text = "";
	var lastChar = "";
	for(var x=0; x<length; x++) {
		lastChar = 
		Math.random() < 0.2 && lastChar.trim() ? 
			' ' : 
			String.fromCharCode(_.random(47,126));
		if(x%wrap===wrap-1) {
			lastChar = '\n';
		}
		text += lastChar;
	}
	return text;
};

var reset = function() {
	text = " »";
	payload.textContent = text;
};
reset();

var log = function() {
	console.log('button pressed', arguments);
};

var iterate = function(renderFunction) {
	console.log('Drawing ' + width*height + ' characters/frame');
	var duration = 1; //target seconds
	var iteration = 0;
	var startTime = (new Date()).getTime();
	requestAnimationFrame(function render() {
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

var htmlChar = function() { //⅓fps
	//Can update on a character-by-character basis. Slower, though.
	console.log('Running test with each character as an element.');
	payload.textContent="";
	if(!confirm("This test may take a long time to run.")) {return;}
	
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
	if(!confirm("This test may take a long time to run.")) {return;}
	
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