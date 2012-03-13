function getDataObjectURL() {return "http://theargentlark.com:5000/?version=1.2&level=" + document.getElementById('filename').value + ".cfg"}

function getLevelImageURL() {return "http://theargentlark.com/david/frogatto-level-images/" + document.getElementById('filename').value + ".png"}

function onEnterGraph(e) {if(e.which == 13) graph()}

function graph() {
	//set background image
	document.getElementById("level image").src = getLevelImageURL();
	
	//draw overlying table
	jQuery.ajax({
		url: 'http://theargentlark.com:5000/?version=1.2&level=titlescreen.cfg', 
		dataType: 'json',
		type: 'get',
		success: function(msg) {
			alert("it works"); 
		},
	});
}