(function() {
	"use strict";
	socket.once('connect', function() { //Uses "once" instead of "on", because "on" will add event listeners the next time we connect. This happens if the server goes down and comes back up.
		socket.emit('ping');
		socket.on('pong', function() {
			c.log('got pong');
		});
		
		var rows = document.body.getElementsByTagName('tr');
		var display = {};
		for (var i = 1; i < rows.length; i++) { //i=1 to skip the header
			display[rows[i].children[0].textContent] = rows[i].children[1];
		}
		
		socket.emit('get-table-updates');
		socket.on('table-update', function(data) {
			c.log('got update', data);
			display[data.name].textContent = data.count;
		});
	});
})();