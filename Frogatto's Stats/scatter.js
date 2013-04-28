"use strict";

// === external ===

//from http://papermashup.com/read-url-get-variables-withjavascript/
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

// === custom ===

var colour_intensity = 1
var full_width = 0
var now_graphing = ''
var fsTimer

var lname
var lvlImage

function levelName() {return now_graphing}

function getDataObjectURL() {return "http://theargentlark.com:5000/?module=frogatto&version=1.3&level=" + levelName() + ".cfg"}

function getLevelImageURL() {return "http://theargentlark.com/david/frogatto-level-images/" + levelName() + ".png"}

function onEnterGraph(e) {if(e.which == 13) newGraph()} //Enter key.

function notify(msg, colour) {
	if(colour == undefined) {colour = '#DDD'}
	document.getElementById("message").style.color = colour
	document.getElementById("message").innerHTML = msg + '<br>'
}

function setup() {
	lname = getUrlVars()["level"]
	if(lname != undefined){
		document.getElementById('filename').value = lname
		newGraph()
	}
}

function newGraph() {
	//set background image
	/*wasGraphing = window.location.href
	if(wasGraphing.indexOf('?') >= 0){
		wasGraphing = wasGraphing.substring(0,wasGraphing.indexOf('?'))
	}*/
	notify('Loading…')
	now_graphing=document.getElementById('filename').value
	lvlImage = document.getElementById("level image")
	window.history.pushState("test", now_graphing + " - Frogatto's Standard Stats Visulizer", "scatter.html?level="+now_graphing);
	document.getElementById("graph").innerHTML = ''
	if(lvlImage.src !== getLevelImageURL()){
		lvlImage.src = getLevelImageURL() //this'll call newGraphContinue
	} else {
		newGraphContinue()
	}
}

function newGraphContinue() {
	lvlImage.removeAttribute("width") //resets to default
	full_width = lvlImage.width
	scaleBackground()
	graph()
}

function graph() {
	notify('Processing…')
	//<div style="width:32px; height:32px; background-color:#F00; position:absolute; left:150px; top:150px; opacity:0.4"></div>
	
	var grapher = document.getElementById("graph")
	grapher.innerHTML = ''
	window.clearTimeout(fsTimer)
	
	//draw overlying table
	jQuery.ajax({
		url: "http://theargentlark.com/david/frogatto-level-images/level-info.json",
		dataType: 'json',
		type: 'get',
		success: function(offsets) {
			var offsetIndex = offsets.map(function(oin){return oin.name}).indexOf(levelName()+".cfg")
			if(offsetIndex < 0) {
				notify("Error: " + levelName() + ".cfg's info cannot be retrieved.", '#F11')
			}
			else {
				var offset = offsets[offsets.map(function(oin){return oin.name}).indexOf(levelName()+".cfg")].dimensions
				jQuery.ajax({
					url: getDataObjectURL(),
					dataType: 'json',
					type: 'get',
					success: function(msg) {
						var maxValue = [Math.round((offset[2]-offset[0])-33), Math.round((offset[3]-offset[1])-33)] //.reduce(function(a,b){return Math.max(a.value,b.value)})
						var zeros = [-offset[0], -offset[1]]
						
						var zoomMult = Math.max(document.getElementById("zoom").value / 100.0, 0.032) //0.032 should make the math work out to one data-point equals one pixel.
						
						var graphStuff = function(theBitWithTables, colour, intensityDivisor, next_call) {
							var newHTML = grapher.innerHTML
							if(theBitWithTables != undefined){
								var safeSetConstrainedToGrid = function(coord, value){
									notify('Processing…', colour)
									var coordx = Math.min(Math.max(coord[0], offset[0]), maxValue[0])*zoomMult
									var coordy = Math.min(Math.max(coord[1], offset[1]), maxValue[1])*zoomMult
									var pxwidth = Math.min(Math.max(coord[0]+32, offset[0]+32), maxValue[0]+32)*zoomMult - coordx //This should provide variable-sized sizes and prevent the off-by-one pixel errors when zooming. It doesn't.
									var pxheight = Math.min(Math.max(coord[1]+32, offset[1]+32), maxValue[1]+32)*zoomMult - coordy
									newHTML += "<div style=\"width:" + pxwidth + "px; height:" + pxheight + "px; background-color:" + colour + "; position:absolute; left:" + (coordx+zeros[0]*zoomMult) + "px; top:" + (coordy+zeros[1]*zoomMult) + "px; opacity:" + value/intensityDivisor + "\"></div>"
								}
								
								//safeSetConstrainedToGrid([50,50], 2)
								var graph_a_bit = function(entry) {
									var slice_size = 50
									$.each(entry.slice(0,slice_size), function(index, value){
										var key = value.key
										key[0] -= 16; key[1] -= 16
										safeSetConstrainedToGrid(key, value.value)
									})
									grapher.innerHTML = newHTML
									if(entry.slice(0,slice_size).length === slice_size) {
										fsTimer = window.setTimeout(graph_a_bit, 0, entry.slice(slice_size))
									} else {
										notify('')
										if(next_call) {
											next_call()
										}
									}
								}
								
								graph_a_bit(theBitWithTables.tables[0].entries)
							}
						}
						
						var theBitWithTables = msg[msg.map(function(oin){return oin.type}).indexOf("move")]
						graphStuff(theBitWithTables, '#F80', 40, function() {//calculate this value based on how much data we have in the level
						var theBitWithTables = msg[msg.map(function(oin){return oin.type}).indexOf("die")]
						graphStuff(theBitWithTables, '#08F', 4)}
						)
						
					},
				})
			}
		},
	})
}

function scaleBackground() {
	var newZoom = document.getElementById("zoom")
	lvlImage = document.getElementById("level image")
	if(46 < newZoom.value && newZoom.value < 54){newZoom.value = 50}
	lvlImage.width = full_width * newZoom.value / 100.0
	document.getElementById("graph").innerHTML = '' //clear the coloured squares
}
