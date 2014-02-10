/* jshint node: true, globalstrict: true, smarttabs: true, strict: true, proto: true */
"use strict";

var addr = "127.0.0.1", port = "8076";

var app = require('http').createServer();
var io = require('socket.io').listen(app);

io.set('log level', 2);
//io.set('transports', ['xhr-polling']);

var _ = require('underscore');
var sql = require('mysql2');
var db = sql.createConnection({user:'test', database:'test'});
var c = io.log; //Has error, warn, info, and debug which is currently disabled by log level 2 because it's ridiculous.

c.info('Server listening at '+addr+':'+port+', using local MySQL database.');
app.listen(port, addr);

var count = {
	__proto__: null,
	Luk: 21,
	Roberts: 26,
	Donnelly: 20,
	Maeda: 40,
	Betts: 10,
	Fudge: 13,
};

io.sockets.on('connection', function(socket) {
	try {
		c.info('connected', socket.id);
		
		socket.on('ping', function() {
			socket.emit('pong', socket.id);
		});
		
		socket.on('get-table-updates', function(data) {
			c.info('getting updates', socket.id);
			socket.join('updates');
			_.forEach(count, function(value, key) {
				socket.emit('table-update', {name:key, count:value});
			});
		});
		
		socket.on('set-nugget-count', function(data) {
			count[data.name] = parseInt(count[data.name], 10);
			if(isFinite(count[data.name]) && isFinite(data.count) && data.count >= 0 ) {
				c.info('new count', socket.id, data);
				if(Math.abs(data.count-count[data.name]) !== 1) {
					c.warn('Last data count delta was non-incremental ('+(data.count-count[data.name])+'). Old: '+count[data.name]+', New: '+data.count+'.');
				}
				count[data.name] = data.count;
				socket.broadcast.to('updates').emit('table-update', data);
			} else {
				c.info('failed count', socket.id, data);
			}
		});
	} catch(e) {
		c.error(e, socket.id);
	}
});

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', function(cmd) {
	cmd = cmd.split(' ');
	switch(cmd[0]) {
		case "hard-reset":
			c.warn('All clients reset, all users counts reset.');
			c.info('Last count was:', count);
			_.forEach(count, function(_, key) {
				count[key] = 0;
			});
			io.sockets.emit('hard-reset');
			break;
		case "add":
			count[cmd[1]] = parseInt(cmd[2], 10) || 0;
			c.info('Added user '+cmd[1]+' at '+count[cmd[1]]+' nuggets.');
			break;
		case "remove":
			c.info('Removed user '+cmd[1]+' who had '+count[cmd[1]]+' nuggets.');
			delete count[cmd[1]];
			break;
		case "list":
			c.info('count:', count);
			break;
		default:
			c.info('Input not understood. Try add(2), remove(1), or list(0).');
	}
});