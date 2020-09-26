#!/usr/bin/env node
const express = require('express')

const SSEChannel = require('sse-pubsub')
const roll = require('roll-parser').parseAndRoll

const {DiceRoll} = require('rpg-dice-roller')
const socketio = require('socket.io')

const app = express()
//app.use(express.json({ limit:'1kb' }));
//app.use(express.urlencoded({limit: '0b', extended: false}));
const io = socketio(app.listen(8303))

const channel = new SSEChannel({pingInterval: false, historySize: 5, rewind: 5})

const history = new Proxy(new Map(), {
  get: (target, name) => (
  	target.has(name) ? target : target.set(name, [])
  ).get(name)
})

console.info('starting dice server v3')

const setResponseHeader = (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin)
	res.header('Vary', 'Origin')
}

const commentRegex = /[^\d!?})\] ][^\d]*$/ //Comments are everything after the numbers. Must not start with a symbol.
io.on('connection', socket => {
	let room = '' //The room we are in.
	socket.join(room)
	
	socket.on('ready', () => {
		for (const results of history[room]) {
			socket.emit('roll', {data:results, isHistorical:true})
		}
	})
	
	socket.on('room', nextRoom => {
		nextRoom = nextRoom.trim().toLowerCase()
		console.info('game room', room, '→', nextRoom)
		if (nextRoom == room) { return }
		
		socket.leave(room)
		socket.join(nextRoom)
		room = nextRoom
		
		if (!room) { return }
		
		for (const results of history[room]) {
			socket.emit('roll', {data:results, isHistorical:true})
		}
	})
	
	socket.on('roll', ({id, name, input}) => {
		input = input.trim()
		console.log(id, name, input)
		
		if (!id || typeof id !== 'string') {
			socket.emit('roll_error', { type:'missing_id', id: '' })
			return console.log(`no id given`)
		}
		
		if (history[room].find(r=>id===r.id)) {
			socket.emit('roll_error', { type:'duplicate_id', id})
			return console.log(`roll already submitted; dropping ${id}`)
		}
		
		if (!input || typeof input !== 'string') {
			socket.emit('roll_error', { type:'missing_roll', id })
			return console.log(`no input roll given (${id})`)
		}
		
		if (!name || typeof name !== 'string') {
			socket.emit('roll_error', { type:'missing_name', id })
			return console.log(`no name given (${id})`)
		}
		
		//Slice comment off input.
		const commentMatch = commentRegex.exec(input);
		let comment = ''
		if (commentMatch) {
			comment = input.slice(commentMatch.index)
			input = input.slice(0, commentMatch.index)
		}
		
		let rollResult = null
		try {
			rollResult = new DiceRoll(input.replace(/\s/gu, ''))
		} catch (err) {
			notation = rollResult ? rollResult.notation : input+comment
			socket.emit('roll_error', { type:'parse', id, input: notation })
			return console.log(`roll for ${name} failed to parse "${input+comment}" (${id})`)
		}
		if (!rollResult.rolls[0]) {
			notation = rollResult ? rollResult.notation : input+comment
			socket.emit('roll_error', { type:'parse', id, input: notation })
			return console.log(`roll for ${name} failed to parse "${input+comment}" (${id})`)
		}
		
		console.log('roll results', rollResult)
		
		const results = {
			id,
			name,
			comment,
			time: Date.now(),
			notation: rollResult.notation,
			result: rollResult.total,
			rolls: rollResult.rolls,
		}
		
		history[room].push(results)
		if (history[room].length >= 10) {
			history[room].shift()
		}
		
		io.to(room).emit('roll', {data:results, isHistorical:false})
		console.log('roll in', room, results)
	})
})