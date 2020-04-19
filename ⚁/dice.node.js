#!/usr/bin/env node
const express = require('express')

const SSEChannel = require('sse-pubsub')
const roll = require('roll-parser').parseAndRoll
const calc = require('math-expression-evaluator').eval.bind(require('math-expression-evaluator'))

const dice = require('rpg-dice-roller')
const socketio = require('socket.io')

const app = express()
app.use(express.json({ limit:'1kb' }));
//app.use(express.urlencoded({limit: '0b', extended: false}));
const io = socketio(app.listen(8302))

const channel = new SSEChannel({pingInterval: false, historySize: 5, rewind: 5})

console.info('starting dice server v2')

const setResponseHeader = (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin)
	res.header('Vary', 'Origin')
}

io.on('connection', (socket) => {
	console.log('connection', socket)
	socket.emit('news', { hello: 'world' })
})

app.get(`/test`, (req, res) => {
	res.send('test passed')
})

app.get(`/rolls`, (req, res) => {
	setResponseHeader(req, res)
	channel.subscribe(req, res)
})

const rollRegex = /(?<baseRoll>[0-9]*?\s?d\s?[0-9]+)\s*(?<modifiers>[\+\-][0-9\+\-\s]*)?(?<comment>.*)/
app.post(`/${encodeURIComponent('⚁')}/rolls`, (req, res) => {
	setResponseHeader(req, res)
	
	if (!req.body) {
		console.log(`missing request body`)
		res.send(JSON.stringify({ error:'missing request body' }))
		return
	}
	if (!req.body.roll || typeof(req.body.roll) !== 'string') {
		console.log(`no roll given`)
		res.send(JSON.stringify({ error:'no roll given' }))
		return
	}
	
	const rollParts = rollRegex.exec(req.body.roll)
	if (!rollParts) {
		console.log(`roll for ${req.body.name||'Anon'} failed to parse ${req.body.roll}`)
		res.send(JSON.stringify({ error:`could not understand "${req.body.roll}"` }))
		return
	}
	
	let rollParserComponent = rollParts.groups.baseRoll.replace(/\s/gu, '') //eg, '1d20'
	let comment = rollParts.groups.comment
	
	
	//Reduce modifiers because rollParser won't.
	const modifiers = (rollParts.groups.modifiers||'').replace(/\s/gu, '') //eg, '-10+5'
	console.log(`rolling ${rollParserComponent}, ${modifiers}, ${comment}`)
	let modifierTotal = 0
	if (modifiers) {
		try {
			modifierTotal = calc(modifiers) //The regex is a little loose, so this can still fail.
			rollParserComponent += `${modifierTotal<0?'-':'+'}${Math.abs(modifierTotal)}`
		} catch (err) {
			//Not a modifer, just prepend to comment? 😬 Fails for stuff like "10d10+2 5 angry monkies @ 2 attacks each" because the 5 gets sucked into the expression.
			comment = modifiers + comment
			console.log('merging modifiers into comment')
		}
	}
	
	
	const results = JSON.stringify({
		name: req.body.name || "Anon",
		input: req.body.roll,
		result: roll(rollParserComponent),
		comment: comment.trim(),
		modifier: modifierTotal,
		id: Math.random().toString(36).slice(2),
		time: Date.now(),
	})
	
	
	console.log('roll', results)
	channel.publish(results, 'roll')
	channel.publish(results, 'roll')
	res.send(results)
})

app.options(`/${encodeURIComponent('⚁')}/rolls`, (req, res) => {
	setResponseHeader(req, res)
	res.header('Allow', 'GET, POST, OPTIONS')
	res.send('')
})
