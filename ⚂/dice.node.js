#!/usr/bin/env node
"use strict"
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

io.on('connection', socket => {
	let room = '' //The room we are in.
	socket.join(room)
	
	socket.on('ready', () => {
		if (!room) { return }
		
		for (const results of history[room]) {
			socket.emit('roll', {data:results, isHistorical:true})
		}
	})
	
	socket.on('room', nextRoom => {
		nextRoom = nextRoom.trim().toLocaleLowerCase()
		console.info('game room', room, '→', nextRoom)
		if (nextRoom == room) { return }
		socket.emit('room change', {from: room, to: nextRoom})
		
		socket.leave(room)
		socket.join(nextRoom)
		room = nextRoom
		
		if (room) { //Don't send history for the main page, to prevent abuse.
			for (const results of history[room]) {
				socket.emit('roll', {data:results, isHistorical:true})
			}
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
		
		//Split the comment off the roll notation.
		comment_start:
		for (var comment_start = 0; comment_start < input.length; comment_start++) {
			console.log('a', {
				l: input[comment_start],
				comment_start, 
				icca: input.charCodeAt(comment_start), 
				ws: /\s/u.test(input[comment_start]),
			})
			
			//Roll formulas can *only* contain basic ASCII characters.
			//If we've got anything else, we must have hit a comment.
			if (input.charCodeAt(comment_start) >= 128) { break }
			
			//There must be whitespace separating the formula from the comment.
			//If this character isn't whitespace, it isn't a comment.
			if (!/\s/u.test(input[comment_start])) { continue }
			
			//So, after the whitespace, if two letters occur before another number,
			//or a closing bracket of some sort, then we have hit a comment.
			//(Ignore further whitespace and punctuation in this calculation.)
			//Consider `{4d6 + 4}sd` vs `{4d6 + 4} sd`.
			for (let char = comment_start+1, letters = 0; char < input.length; char++) {
				console.log(' b', {
					l: input[char],
					char,
					isanum: /\d|\}|\)|\]/u.test(input[char]),
					isalet: /\w/u.test(input[char]),
					letters,
				})
				if (input.charCodeAt(comment_start) >= 128) { break comment_start }
				if (/\d|\}|\)|\]/u.test(input[char])) { break }
				if (/\w/u.test(input[char])) {
					if (++letters == 2) { break comment_start }
				}
			}
		}
		const comment = input.slice(comment_start).trim()
		input = input.slice(0, comment_start).trim()
		console.log({comment, input})
		
		let rollResult = null
		try {
			rollResult = new DiceRoll(input.replace(/\s/gu, ''))
		} catch (err) {
			const notation = rollResult ? rollResult.notation : input+comment
			socket.emit('roll_error', { type:'parse', id, input: notation })
			return console.log(`roll for ${name} failed to parse "${input+comment}" (${id})`)
		}
		if (!rollResult.rolls[0]) {
			const notation = rollResult ? rollResult.notation : input+comment
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