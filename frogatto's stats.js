colour_intensity = 1

function levelName() {return document.getElementById('filename').value}

function getDataObjectURL() {return "http://theargentlark.com:5000/?version=1.2&level=" + levelName() + ".cfg"}

function getLevelImageURL() {return "http://theargentlark.com/david/frogatto-level-images/" + levelName() + ".png"}

function onEnterGraph(e) {if(e.which == 13) graph()}

function alert(msg, colour) {
	if(colour == undefined) {colour = '#DDD'}
	document.getElementById("message").style.color = colour
	document.getElementById("message").innerHTML = msg + '<br>'
}

function setup() {
	0
}

function graph() {
	alert('Loading…')
	//<div style="width:32px; height:32px; background-color:#F00; position:absolute; left:150px; top:150px; opacity:0.4"></div>
	grapher = document.getElementById("graph")
	grapher.innerHTML = ''
	
	//set background image
	document.getElementById("level image").src = getLevelImageURL()
	
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
						alert('Processing…')
						maxValue = [Math.round((offset[2]-offset[0])-33), Math.round((offset[3]-offset[1])-33)] //.reduce(function(a,b){return Math.max(a.value,b.value)})
						zeros = [-offset[0], -offset[1]]
						
						graphStuff = function(theBitWithTables, colour, intensityDivisor) {
							safeSetConstrainedToGrid = function(coord, value){
								coord[0] = Math.min(Math.max(coord[0], offset[0]), maxValue[0])
								coord[1] = Math.min(Math.max(coord[1], offset[1]), maxValue[1])
								grapher.innerHTML += "<div style=\"width:32px; height:32px; background-color:" + colour + "; position:absolute; left:" + (coord[0]+zeros[0]) + "px; top:" + (coord[1]+zeros[1]) + "px; opacity:" + value/intensityDivisor + "\"></div>"
							}
							
							//safeSetConstrainedToGrid([50,50], 2)
							$.each(theBitWithTables.tables[0].entries,function(index, value){
								key = value.key
								key[0] -= 16; key[1] -= 16
								safeSetConstrainedToGrid(key, value.value)
							})
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