"use strict"
const $ = document.querySelector.bind(document)

const socket = io.connect('', { path:'/⚁/ws' })
document.addEventListener("DOMContentLoaded", ()=>{
	function connected() {
		$('#status span').textContent = "Connected"
		for (let elem of document.querySelectorAll('#roll-entry input, #roll-entry button')) {
			elem.disabled = false
		}
	}
	function disconnected() {
		$('#status span').textContent = "Not Connected; Offline"
		for (let elem of document.querySelectorAll('#roll-entry input, #roll-entry button')) {
			elem.disabled = true
		}
	}
	socket.on('connect', connected)
	socket.on('reconnect', connected)
	socket.on('connect_error', disconnected)
	socket.on('reconnect_error', disconnected)
	socket.on('roll', data => {
		console.info('roll', data);
		const outputList = $('#app output ul')
		
		if (outputList.querySelector(`[roll-id="${data.id}"]`)) {
			return console.info('ignoring dup roll', data.id)
		}
		
		debugger
		
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
			li.textContent = `Systems error; not your fault, bug DDR.`
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
		let chosenVoice
		const chooseVoice = ()=>{
			chosenVoice = speechSynthesis.getVoices().sort(
				(a,b) => scoreVoice(b) - scoreVoice(a)
			)[0]
			console.log('selected voice', chosenVoice, chosenVoice&&scoreVoice(chosenVoice))
		}
		chooseVoice()
		
		let cue;
		const cueAnnouncer = ()=>{
			const startAnnouncer = ()=>{
				console.info('announcer started; clearing', cue, cueAnnouncer)
				clearTimeout(cue)
				socket.off('roll', cueAnnouncer)
				
				const spokenRolls = new Set()
				socket.on('roll', data => {
					if (!$('#speak').checked) { return }
					
					if (spokenRolls.has(data.id)) { return }
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
			console.info('announcer queued; clearing', cue)
			clearTimeout(cue)
			cue = setTimeout(startAnnouncer, 100)
		}
		console.info('cueing announcer')
		socket.on('roll', cueAnnouncer)
	}
	
	socket.emit('ready')
	
	
	
	$('#roll-entry').addEventListener('submit', evt=>{
		evt.preventDefault()
		
		const roll = {
			name: $('#name').value || 'Anon',
			input: $('#roll').value,
			id: Math.random().toString(32).slice(2),
		}
		socket.emit('roll', roll)
		console.log('roll', roll)
		
		//Good, the roll appears to have worked. Clear the input and focus for next roll.
		$('#roll').value = ''
		$('#roll').focus()
	})
})