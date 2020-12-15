"use strict"
const $ = document.querySelector.bind(document)
let rollHistory = []
let rollHistoryIndex = 0
let currentRoll = ''

const socket = io.connect('', { path:'/⚂/ws' })
document.addEventListener("DOMContentLoaded", ()=>{
	socket.on('connect', connected)
	socket.on('reconnect', connected)
	function connected() {
		$('#status span').textContent = "Connected"
		for (let elem of document.querySelectorAll('#roll-entry input, #roll-entry button')) {
			elem.disabled = false
			elem.removeAttribute('placeholder')
		}
		$('#roll-entry button').removeAttribute('title')
		
		//Remove initial message, put there to increase the chances of diagnosing an initial connection error.
		const icm = $('#initial-connecting-message')
		icm && icm.remove() //DDR 2020-09-12: Skipped use of optional chaining operator here, it's still a bit new.
	}
	
	socket.on('connect_error', disconnected)
	socket.on('reconnect_error', disconnected)
	function disconnected() {
		$('#status span').textContent = "Not Connected; Offline"
		for (let elem of document.querySelectorAll('#roll-entry input, #roll-entry button')) {
			elem.disabled = true
			elem.removeAttribute('placeholder')
		}
		$('#roll-entry button').setAttribute('title',
			"Disabled; can not contact roll server.")
	}
	
	socket.on('roll', ({data}) => {
		console.info('roll', data);
		const outputList = $('#app output ul')
		
		if (outputList.querySelector(`[roll-id="${data.id}"]`)) {
			return console.info('ignoring dup roll', data.id)
		}
		
		const li = document.createElement('li')
		li.textContent = `${
				data.name
			} rolled ${
				data.rolls.flat().length > 1 ? '' : 'a '
			}${
				data.result
			}${
				data.comment ? ` ${data.comment}` : ''
			} (${
				data.notation
			}${
				data.rolls.flat().length > 1 ? `: ${data.rolls.map(rolls=>rolls.join(', ')).join('; ')}` : ''
			})`
		li.setAttribute('roll-id', data.id)
		outputList.prepend(li)
		
		if (outputList.children.length > 1) {
			outputList.children[1].setAttribute('aria-hidden', true)
		}
		
		if (outputList.children.length > 10) {
			outputList.children[10].remove()
		}
	});
	
	socket.on('roll_error', data => {
		console.info('roll error', data);
		const outputList = $('#app output ul')
		
		const li = document.createElement('li')
		if (data.type == 'parse') {
			li.textContent = `Couldn't understand "${data.input}".`
		} else {
			li.textContent = `A system error occurred. This not your fault, please bug DDR.\nSee browser console for details.`
			console.error(data)
		}
		li.setAttribute('class', 'roll-error')
		outputList.prepend(li)
		
		if (outputList.children.length > 1) {
			outputList.children[1].setAttribute('aria-hidden', true)
		}
		
		if (outputList.children.length > 10) {
			outputList.children[10].remove()
		}
	});
	
	
	if (!window['speechSynthesis']) {
		$('#speak').parentNode.remove()
		console.warn('speechSynthesis API unavailable')
	} else {
		const scoreVoice = voice => {
			let score = 0
			score += voice.localService * 1000
			score += voice.lang.includes('en') * 100
			if (voice.name.includes('Ireland'))
				score += 9
			else if (voice.name.includes('Scotland'))
				score += 8
			else if (voice.default)
				score += 7
			score += voice.name.includes('Female') * 0.1
			return score
		}
		let chosenVoice = null;
		speechSynthesis.addEventListener('voiceschanged', chooseVoice)
		function chooseVoice() {
			chosenVoice = speechSynthesis.getVoices().sort(
				(a,b) => scoreVoice(b) - scoreVoice(a)
			)[0]
			console.log('selected voice', chosenVoice ? chosenVoice.voiceURI : null, chosenVoice && scoreVoice(chosenVoice))
		}
		chooseVoice() //voices might have already loaded by now
		
		const spokenRolls = new Set()
		socket.on('roll', ({data, isHistorical}) => {
			if (!$('#speak').checked) { return }
			if (isHistorical) { return } //Don't announce historical rolls, the usual 10 of them are quite verbose together.
			
			if (spokenRolls.has(data.id)) { return } //Don't announce duplicate rolls.
			spokenRolls.add(data.id)
			
			const line = new SpeechSynthesisUtterance(
				`${
					data.name
				} rolled ${
					data.rolls.flat().length>1 ? '' : 'a '
				}${
					data.result
				}${
					data.comment ? ` ${data.comment}` : ''
				}`
			)
			chosenVoice && (line.voice = chosenVoice)
			line.rate = 1.5
			line.volume = 0.8
			speechSynthesis.speak(line)
		})
		
		socket.on('roll_error', data => {
			if (!$('#speak').checked) { return }
			
			const line = new SpeechSynthesisUtterance(
				data.type == 'parse'
					? `Couldn't understand "${data.input}".`
					: `Systems error; not your fault, bug DDR.`
			)
			
			chosenVoice && (line.voice = chosenVoice)
			line.rate = 1.5
			line.volume = 0.8
			speechSynthesis.speak(line)
		})
	}
	
	socket.emit('ready')
	
	//Read game name in from URL if it's there. Otherwise use the autofilled value.
	const game = $('#game')
	syncGameName()
	addEventListener('popstate', syncGameName)
	socket.on('reconnect', syncGameName)
	function syncGameName() {
		game.value = new URLSearchParams(window.location.search).get('room') || game.value
		console.log('entered', game.value)
		socket.emit('room', game.value)
		document.title = `Dice Roller - ${game.value}`
	}
	
	//If the game changes, 
	game.addEventListener('keyup', evt=>{
		console.log('entered', evt.target.value)
		socket.emit('room', evt.target.value)
		
		const newUrl = new URL(window.location)
		const newSearch = new URLSearchParams(newUrl.search)
		if (evt.target.value != newSearch.get('room')) {
			document.title = `Dice Roller - ${evt.target.value}`
			
			evt.target.value
				? newSearch.set('room', evt.target.value)
				: newSearch.delete('room')
			newUrl.search = newSearch
			window.history.pushState({}, document.title, newUrl.toString())
			
			$('#app output ul').innerHTML='' //Clear results from old room.
			
		} else {
			console.log('Already in room.')
		}
	})
	
	$('#roll').addEventListener('keydown', evt => {
		if (event.key === "ArrowUp") {
			evt.preventDefault()
			
			if (!rollHistoryIndex) {
				currentRoll = evt.target.value
			}
			
			if (rollHistory.length > rollHistoryIndex) {
				rollHistoryIndex++
				evt.target.value = rollHistory[rollHistory.length - rollHistoryIndex]
			}
		} else if (event.key === "ArrowDown") {
			evt.preventDefault()
			if (rollHistoryIndex > 1) {
				evt.target.value = rollHistory[rollHistory.length - rollHistoryIndex + 1]
				rollHistoryIndex--
			} else if (rollHistoryIndex == 1) {
				evt.target.value = currentRoll
				rollHistoryIndex--
			}
		} else {
			rollHistoryIndex = 0
		}
	})
	
	
	$('#roll-entry').addEventListener('submit', evt=>{
		evt.preventDefault()
		
		const roll = {
			name: $('#name').value || 'Anon',
			input: $('#roll').value,
			id: Math.random().toString(32).slice(2),
		}
		
		if (roll.input) {
			socket.emit('roll', roll)
			console.log('roll', roll)
			rollHistory.push(roll.input)
		}
		
		//Clear the input and refocus for next roll.
		$('#roll').value = ''
		$('#roll').focus()
	})
})