colour_intensity = 1
full_width = 0

function levelName() {return document.getElementById('filename').value}

function getDataObjectURL() {return "http://theargentlark.com:5000/?version=1.2&level=" + levelName() + ".cfg"}

function getLevelImageURL() {return "http://theargentlark.com/david/frogatto-level-images/" + levelName() + ".png"}

function onEnterGraph(e) {if(e.which == 13) newGraph()}

function alert(msg, colour) {
	if(colour == undefined) {colour = '#DDD'}
	document.getElementById("message").style.color = colour
	document.getElementById("message").innerHTML = msg + '<br>'
}

function setup() {
	0
}

function newGraph() {
	//set background image
	lvlImage = document.getElementById("level image")
	lvlImage.removeAttribute("width")
	lvlImage.src = getLevelImageURL()
	full_width = lvlImage.width
	scaleBackground()
	graph()
}

function graph() {
	alert('Loading…')
	//<div style="width:32px; height:32px; background-color:#F00; position:absolute; left:150px; top:150px; opacity:0.4"></div>
	
	grapher = document.getElementById("graph")
	grapher.innerHTML = ''
	
	//draw overlying table
	jQuery.ajax({
		url: "http://theargentlark.com/david/frogatto-level-images/level-info.json",
		dataType: 'json',
		type: 'get',
		success: function(offsets) {
			offsetIndex = offsets.map(function(oin){return oin.name}).indexOf(levelName()+".cfg")
			if(offsetIndex < 0) {
				alert("Error: " + levelName() + ".cfg's info cannot be retrieved.", '#F11')
			}
			else {
				offset = offsets[offsets.map(function(oin){return oin.name}).indexOf(levelName()+".cfg")].dimensions
				jQuery.ajax({
					url: getDataObjectURL(),
					dataType: 'json',
					type: 'get',
					success: function(msg) {
						maxValue = [Math.round((offset[2]-offset[0])-33), Math.round((offset[3]-offset[1])-33)] //.reduce(function(a,b){return Math.max(a.value,b.value)})
						zeros = [-offset[0], -offset[1]]
						
						zoomMult = Math.max(document.getElementById("zoom").value / 100.0, 0.032) //0.032 should make the math work out to one data-point equals one pixel.
						
						graphStuff = function(theBitWithTables, colour, intensityDivisor) {
							alert('Processing…', colour)
							if(theBitWithTables != undefined){
								safeSetConstrainedToGrid = function(coord, value){
									coordx = Math.min(Math.max(coord[0], offset[0]), maxValue[0])*zoomMult
									coordy = Math.min(Math.max(coord[1], offset[1]), maxValue[1])*zoomMult
									pxwidth = Math.min(Math.max(coord[0]+32, offset[0]+32), maxValue[0]+32)*zoomMult - coordx //This should provide variable-sized sizes and prevent the off-by-one pixel errors when zooming. It doesn't.
									pxheight = Math.min(Math.max(coord[1]+32, offset[1]+32), maxValue[1]+32)*zoomMult - coordy
									grapher.innerHTML += "<div style=\"width:" + pxwidth + "px; height:" + pxheight + "px; background-color:" + colour + "; position:absolute; left:" + (coordx+zeros[0]*zoomMult) + "px; top:" + (coordy+zeros[1]*zoomMult) + "px; opacity:" + value/intensityDivisor + "\"></div>"
								}
								
								//safeSetConstrainedToGrid([50,50], 2)
								$.each(theBitWithTables.tables[0].entries,function(index, value){
									key = value.key
									key[0] -= 16; key[1] -= 16
									safeSetConstrainedToGrid(key, value.value)
								})
							}
						}
						
						theBitWithTables = msg[msg.map(function(oin){return oin.type}).indexOf("move")]
						graphStuff(theBitWithTables, '#F80', 6) //calculate this '6' based on how much data we have in the level
						
						theBitWithTables = msg[msg.map(function(oin){return oin.type}).indexOf("die")]
						graphStuff(theBitWithTables, '#08F', 4)
						
						alert('')
					},
				})
			}
		},
	})
}

function scaleBackground() {
	newZoom = document.getElementById("zoom")
	lvlImage = document.getElementById("level image")
	lvlImage.width = full_width * newZoom.value / 100.0
	document.getElementById("graph").innerHTML = '' //clear the coloured squares
}