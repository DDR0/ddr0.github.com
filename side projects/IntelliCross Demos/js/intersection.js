(()=>{
	const $ = document.querySelector.bind(document)
	const $$ = document.querySelectorAll.bind(document)
	
	//Main menu.
	$('#content-header .menu-button').addEventListener('click', ()=>
		$('#header-menu').toggleAttribute('hidden'))
	
	//Sync iframe svg selected buttons to our HTML options group.
	$('iframe').contentWindow.addEventListener('message', msg => {
		if (msg.origin != origin) { return }
		$('#intersection-buttons').options[msg.data.button-1].selected = msg.data.state
	})
	
	//Intersection button group select radio button logic.
	{
		const buttonSelectionButtons = $$('#intersection-button-group-selection input')
		Array.prototype.forEach.call(buttonSelectionButtons, button => 
			button.addEventListener('change', ()=>{
				Array.prototype.forEach.call(buttonSelectionButtons, button => 
					button.parentElement.classList.toggle('selected', button.checked)
				)
			})
		)
	}
	
	//Add and remove audio elements from the playlist.
	{
		const phaseAudio = $('#phase-audio select')
	 	$('#phase-audio button.add').addEventListener('click', ()=>{
	 		const opt = document.createElement('option')
	 		opt.text = "Empty Entry"
	 		phaseAudio.add(opt, null)
	 		phaseAudio.selectedIndex = phaseAudio.childElementCount - 1
	 		
	 		$('#phase-audio button.add').disabled = phaseAudio.length >= 4
	 		$('#phase-audio button.remove').disabled = false
	 	})
	 	$('#phase-audio button.remove').addEventListener('click', ()=>{
	 		//Note DDR 2020-07-15: `selectedOptions` mutates as we remove items from it. We create the array so we can simply iterate without having to worry about our collection. (This is by far the simpler option.) We destructure index at the start because it, too, will change as the function executes - when we remove the element, it doesn't have an index any more!
	 		Array.from(phaseAudio.selectedOptions).forEach(({index}) => {
	 			phaseAudio.remove(index)
		 		phaseAudio.selectedIndex = Math.min(index, phaseAudio.childElementCount-1)
		 		
		 		$('#phase-audio button.add').disabled = false
	 		})
	 		$('#phase-audio button.remove').disabled = !phaseAudio.length
	 	})
	}
	
	$('#playlist-script button').addEventListener('click', ()=>
		window.location = '/help.html')
})()