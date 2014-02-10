(function() {
	"use strict";
	var serverLoc = window.location.origin+":8077";
	window.socket = io.connect(serverLoc, {transports: ['websocket']});
	window.c = console;
	
	socket.on('hard-reset', function() {
		localStorage.clear();
		window.location.reload();
	});
})();