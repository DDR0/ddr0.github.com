var linkHTMLDisplayTo = function(mainWindow){
	"strict mode";
	cashDisplay = $("#cash")[0];
	scoreDisplay = $("#score")[0];
	mainWindow.watch('money', function() {
		cashDisplay.textContent = " Cash: $" + arguments[2]; //0 is the property key, 1 is the old value, 2 is the new value.
		if(arguments[2]) {
			cashDisplay.textContent += "000";
		}
		return arguments[2];
	});
	mainWindow.watch('score', function() {
		console.log('got score change ' + arguments[2]);
		var zeros = Math.floor(Math.random()*100);
		if(zeros < 10) {
			zeros = "0"+zeros;
		}
		scoreDisplay.textContent = " Score: " + arguments[2] + zeros;
		return arguments[2];
	});
	mainWindow.watch('gameOver', _.once(function() {
		alertBox = '<div id="popover"><h1>Game Over</h1><p>';
		if(mainWindow.won) {
			alertBox += "You connected completed the pipelines, and are assured an obscenely wealthy future.<br><br>-- A WINNER IS YOU --";
		} else {
			alertBox += "You have run your company in to the ground, and have not been able to complete the contract to connect the cities.<br>-- YOU FAILED --";
		}
		alertBox += "</p>Play again? <a href='#' onclick='location.reload(true); return false;'>y</a>/<a href='#' onclick='$(\"#popover\").hide(\"slow\"); return false;'>n</a></div>";
		$("#game").append(alertBox);
	}));
};