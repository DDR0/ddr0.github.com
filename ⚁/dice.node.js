#!/usr/bin/env node
const express = require('express')

const SSEChannel = require('sse-pubsub')
const roll = require('roll-parser').parseAndRoll

const {DiceRoller} = require('rpg-dice-roller')
const socketio = require('socket.io')

const app = express()
//app.use(express.json({ limit:'1kb' }));
//app.use(express.urlencoded({limit: '0b', extended: false}));
const io = socketio(app.listen(8302))

const channel = new SSEChannel({pingInterval: false, historySize: 5, rewind: 5})

const history = []

console.info('starting dice server v2')

const setResponseHeader = (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin)
	res.header('Vary', 'Origin')
}


const rollRegex = /^(?<roll>d?F?(?:floor|round|ceil|[0-9d*\/+\-\ \(\)%F.!p>=<fl])*?p?)(?:(?<comment>[\ A-Za-z]{3}.*).*)?$/
io.on('connection', socket => {
	const roller = new DiceRoller()
	
	socket.on('ready', () => {
		for (const results of history) {
			socket.emit('roll', results)
		}
	})
	
	socket.on('roll', ({id, name, input}) => {
		console.log(id, name, input)
		
		if (!id || typeof id !== 'string') {
			socket.emit('roll_error', { type:'missing_id', id: '' })
			return console.log(`no id given`)
		}
		
		if (history.find(r=>id===r.id)) {
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
		
		const rollParts = rollRegex.exec(input)
		if (!rollParts) {
			socket.emit('roll_error', { type:'parse', id, input })
			return console.log(`roll for ${name} failed to parse "${input}" (${id})`)
		}
		
		const roll =  rollParts.groups.roll.trim().replace(/\s/gu, '') //Remove whitespace from the roll, they confuse the roll parser.
		const comment = (rollParts.groups.comment||'').trim()
		if (!roll) {
			socket.emit('roll_error', { type:'parse', id, input:roll })
			return console.log(`roll for ${name} failed to parse "${input}" (${id})`)
		}
		
		const rollResult = roller.roll(roll)
		if (!rollResult.rolls[0]) {
			socket.emit('roll_error', { type:'parse', id, input:roll })
			return console.log(`roll for ${name} failed to parse "${input}" (${id})`)
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
		
		history.push(results)
		if (history.length >= 10) {
			history.shift()
		}
		
		io.emit('roll', results)
		console.log('roll', results)
	})
})


app.options(`/${encodeURIComponent('⚁')}/rolls`, (req, res) => {
	setResponseHeader(req, res)
	res.header('Allow', 'GET, POST, OPTIONS')
	res.send('')
})
