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
		
		data.string = data.string.replace(/d(,|\]) /g, '$1 ') //There's a bug in the library, results like {[8, 20]+2, [20]} are rendered as {[8d, 20]+2, [20]}. (Note the extra d after the 8.)
		li.textContent = `${
				data.name
			} rolled ${
				data.rolls.flat().length > 1 ? '' : 'a '
			}${
				data.result
			}${
				data.comment ? ` ${data.comment}` : ''
			} (${
				data.string.includes(', ') || data.string.includes(']+[') //Try to show multi-rolls, but hide individual results for single rolls since it's redundant.
					? data.string
					: data.string.split(':').shift()
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
	
	//Clear stale roles when the room is changed.
	socket.on('room change', ()=>{
		$('#app output ul').textContent = ''
	})
	
	//Save speak roll results checkbox state.
	const speakRollResultsCheckbox = $('#speak');
	speakRollResultsCheckbox.checked = localStorage.speakRollResults === 'true';
	speakRollResultsCheckbox.addEventListener('change', evt => {
		localStorage.speakRollResults = evt.target.checked
	})
	
	
	if (!window['speechSynthesis']) {
		speakRollResultsCheckbox.parentNode.remove()
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
			if (!speakRollResultsCheckbox.checked) { return }
			if (isHistorical) { return } //Don't announce historical rolls, the usual 10 of them are quite verbose together.
			
			if (spokenRolls.has(data.id)) { return } //Don't announce duplicate rolls.
			spokenRolls.add(data.id)
			
			const line = new SpeechSynthesisUtterance(
				`${
					data.name
				} rolled ${
					data.rolls.flat().length > 1 ? '' : 'a '
				}${
					data.result
				}${
					data.comment ? ` ${data.comment}` : ''
				} with: ${
					data.string.includes(', ') || data.string.includes(']+[') //Try to show multi-rolls, but hide individual results for single rolls since it's redundant.
						? data.string
						: data.string.split(':').shift()
				})`
			)
			chosenVoice && (line.voice = chosenVoice)
			line.rate = 1.5
			line.volume = 0.9
			speechSynthesis.speak(line)
		})
		
		socket.on('roll_error', data => {
			if (!speakRollResultsCheckbox.checked) { return }
			
			const line = new SpeechSynthesisUtterance(
				data.type == 'parse'
					? `Couldn't understand "${data.input}".`
					: `Systems error; not your fault, bug DDR.`
			)
			
			chosenVoice && (line.voice = chosenVoice)
			line.rate = 1.5
			line.volume = 0.9
			speechSynthesis.speak(line)
		})
	}
	
	socket.emit('ready')
	
	//Read game name in from URL if it's there. Otherwise use the autofilled value.
	const game = $('#game')
	let gameSwitchFinalised = true //Gets set to false when game name is being edited, so we can replace the most recent browser history rather than appending a new entry as we type.
	syncGameName()
	addEventListener('popstate', syncGameName)
	socket.on('reconnect', syncGameName)
	function syncGameName() {
		game.value = new URLSearchParams(location.search).get('room') || game.value
		console.log('entered', game.value)
		socket.emit('room', game.value)
		document.title = `Dice Roller${game.value?' – ':''}${game.value}`
	}
	
	//When the game name changes, update:
	//	- the game we're subscribed to via websockets
	//	- the window title
	//	- the window's history, so back/forward navigation works
	game.addEventListener('change', ()=>{gameSwitchFinalised = true})
	game.addEventListener('keyup', evt=>{
		console.log('entered', evt.target.value)
		socket.emit('room', evt.target.value)
		
		const newUrl = new URL(location)
		const newSearch = new URLSearchParams(newUrl.search)
		if (evt.target.value != newSearch.get('room')) {
			document.title = `Dice Roller${evt.target.value?' – ':''}${evt.target.value}`
			
			evt.target.value
				? newSearch.set('room', evt.target.value)
				: newSearch.delete('room')
			newUrl.search = newSearch
			if(gameSwitchFinalised) {
				window.history.pushState({}, document.title, newUrl.toString())
				gameSwitchFinalised = false
			} else {
				window.history.replaceState({}, document.title, newUrl.toString())
			}
			
			$('#app output ul').innerHTML='' //Clear results from old room.
		} else {
			console.info('Already in room.')
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