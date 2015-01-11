"use strict";

addEventListener('load', function() {
	//Set up global namespace. May have been loaded by engine first.
	window.cfl = window.cfl || {
		interface: {loaded:false}, 
		engine:    {loaded:false},
	};
	cfl.interface = {loaded: true};

	//Remove 'loading' message.
	cfl.engine.loaded && window.loader && loader.remove();

	window.log = console.log.bind(console);

	var advanceProgram = function() {}; 
	var runner = -1;
	var error = false; //The last error we encountered.

	var startRunningProgram = function() {
		clearTimeout(runner);
		var inst = advanceProgram();
		if(inst && inst.more) {
			runner = setTimeout(startRunningProgram, 
			                    speedInput.value.length ? speedInput.value*1000 : Infinity); }
		if(inst.error) {
			error = inst.error;
			console.warn(error);
		}
		updateDisplay(); 
		log('ran step', inst.instructions && inst.instructions[0].lineNumber);
	}

	var updateDisplay = function() {
		var e = cfl.engine;

		program.innerHTML = Array.prototype.concat.apply([], 
			e.program.filter(function(e) {return e;}))
			.map(function(instruction) {
				var cflLine = '<span class="cflLineNumber">'+instruction.lineNumber+'</span> '
					+ (typeof instruction.value === 'number' || instruction.value ? '<span class="cflValue">'+(typeof instruction.value === 'string'?'$':'')+(typeof instruction.value === 'number'?'#':'')+instruction.value.toString()+'</span> ' : '') //toString to work around nul symbols.
					+ (instruction.instruction && !instruction.comment ? '<span class="cflInstruction">'+instruction.instruction+(instruction.target ? ' '+instruction.target : '')+'</span> ' : '')
					+ (instruction.comment ? '<span class="cflComment">!'+instruction.comment+'</span> ' : '')
					+ (error && instruction.lineNumber === cfl.engine.lastInstructionPointer ? '<span class="cflError">' + (error.opStack ? 'Error encountered when processing the opStack' : 'Error encountered when processing this line') + ': "' + error.desc + '"</span>' : '')
					;
				return cfl.engine.lastInstructionPointer === instruction.lineNumber
					? '<strong>' + cflLine + '</strong>'
					: cflLine;
			}).join('\n');

		//program.textContent = JSON.stringify(e.program); //TODO: Merge this with the text entry box.
		opStack.textContent = '['+e.opStack.join(', ')+']';
		stack.textContent = JSON.stringify(e.stack);
	};

	var prevProgram = "";
	var onInput = function() {
		var e = cfl.engine;
		if (input.value === prevProgram) { return; };
		error = false;
		var newProgram = e.load(prevProgram = input.value);
		advanceProgram = newProgram.success ? newProgram.stepProgram : function() {};
		newProgram.success || console.error('parse error', newProgram.errors[0]);
		newProgram.success && startRunningProgram();
	};

	(cfl.interface.print = function(text) {
		output.textContent += text;
	})('cfl sesson log for '+((new Date).toLocaleDateString())+'\n====================\n');

	setTimeout(onInput, 500);

	input.addEventListener('keypress', function(event) {
		1+[13, 188, 44, '\n', ','].indexOf(event.key || event.keyCode || event.which) 
			&& onInput(); //13 is enter, 44/188 comma
	});
	input.addEventListener('change', onInput);
	input.addEventListener('paste', requestAnimationFrame.bind(window, onInput));

	speedSlider.addEventListener('input', function() {speedInput.value=Math.pow(speedSlider.value, 2).toFixed(2);});
	speedInput.addEventListener('input', function() {speedSlider.value=Math.sqrt(speedInput.value);});

});