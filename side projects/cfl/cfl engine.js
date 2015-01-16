"use strict";

void function() {
	var log = console.log.bind(console);

	//Set up global namespace. May have been loaded by interface first.
	window.cfl = window.cfl || {
		interface: {loaded:false}, 
		engine: {loaded:false}
	};

	//Remove 'loading' message.
	cfl.interface.loaded && window.loader && loader.remove();
	var eng = cfl.engine; //namespace

	eng.loaded = true;

	  // ===================================================== //
	 // Program instruction loading                           //
	// ===================================================== //

	eng.jumps = {}; 
	eng.instructionPointer = -1; 
	eng.lastInstruction = -1;
	eng.stack = []; //restriction: can only hold primitives
	eng.opStack = []; //restriction: can only hold primitives
	eng.program = [];

	var parseErrors = []; //Any errors we get while parsing get put here.
	var parseInstructions = function(text) {
		parseErrors = [];
		if(!text) {return [];}

		//Add instructions to the program, but not if any fail to be parsed.
		var newProgramFragments = [];
		var char = 0;
		var sourceExcludedChars = 0;
		var sourceProcessedChars = 0;
		while (text) { //Sod writing a regex for this. I can't figure out how lookbehind works with regards to split().
			//Don't cause an instruction break on newline or comma, if escaped by a comma. Remove the escape comma.
			if(text.slice(char,char+2) === ',,' || text.slice(char,char+2) === ',\n') {
				text = text.slice(0,char) + text.slice(char+1); //This could be optimized, but I don't expect comefrom programs to get very large.
				char++;
				sourceExcludedChars++;
				continue;
			}
			if(text.slice(char,char+2) === '\\n') {
				text = text.slice(0,char) + '\n' + text.slice(char+2);
				char++;
				sourceExcludedChars++;
				continue;
			}
			//Instruction break on newline or comma.
			if(!text[char] || text[char] === '\n' || text[char] === ',') {
				var line = {
					text: text.slice(0, char),
					sourceIndex: sourceProcessedChars + sourceExcludedChars,
				};
				newProgramFragments.push(line);
				text = text.slice(char+1); //Step over the line seperator.
				sourceProcessedChars += char;
				char = 0;
				sourceExcludedChars++;
				continue;
			}
			char++;
		}

		var newProgram = newProgramFragments.map(addInstruction); //TODO: Make ,, the escape sequence for commas.
		var failedInstructionIndex = newProgram.indexOf(false);
		if (1+failedInstructionIndex) { //parse error
			return {
				success: false,
				firstErrorLineIndex: failedInstructionIndex,
				lines: newProgramFragments,
				errors: parseErrors,
			}
		}

		newProgram = splat(newProgram);
		return {
			success: true,
			program: newProgram,
		};
	}

	eng.debug = function() {log('e/p/s/o', eng, eng.program, eng.stack, eng.opStack); debugger;};

	var nul = eng.nul = window.Symbol && Symbol('nul') || '__nul__';
	var validInstructions = []; //This will be generated from applyFns, and contains a list like ['dup', 'drop', '+', '-', etc.] // 'comefrom', 'comefromif' special cased because of line number

	//Add an individual instruction. Be sure to call generateJumpTable() after!
	var addInstruction = function(text) {
		var sourceIndex = text.sourceIndex;
		text = text.text.trimLeft();
		if(!text) {return undefined;}


		var instruction = {};
		var error = {text:text, type:'parse'};

		//line number
		var lineNumEndIndex = text.indexOf(' ');
		var lineNum = parseInt(text.slice(0, lineNumEndIndex), 10);
		if(!(1+lineNumEndIndex) || isNaN(lineNum)) { 
			error.error='noLineNumber';
			return reportError(error); 
		}
		instruction.lineNumber = lineNum;
		error.lineNumber = lineNum;
		text = text.slice(lineNumEndIndex).trimLeft();


		//instruction or value
		//comment or no value → nop instruction
		if (!text || text[0] === '!') {  //comment
			instruction.instruction = 'nop'; 
			instruction.comment = text.slice(1);
		} else if (text[0] === '#') { //number
			var val = parseFloat(text.slice(1));
			if(!isFinite(val)) {
				error.error = 'malformedNumber';
				return reportError(error);
			}
			instruction.value = val;
		} else if (text[0] === '$') { //string
			instruction.value = text.slice(1);
		} else if (text === 'nul') { //nul
			instruction.value = nul;
		} else { //instruction
			text = text.trim();
			var cf = 'comefrom';
			var cfi = 'comefromif';
			if(text.slice(0, cfi.length) === cfi) { //This first, next is less specific and would match too.
				instruction.instruction = cfi;
				line = parseInt(text.slice(cfi.length).trimLeft(), 10);
				if(!isFinite(line)) {
					error.error = 'malformedLineNumber';
					return reportError(error);
				}
				instruction.target = line;
			} else if(text.slice(0, cf.length) === cf) {
				instruction.instruction = cf;
				var line = parseInt(text.slice(cf.length).trimLeft(), 10);
				if(!isFinite(line)) {
					error.error = 'malformedLineNumber';
					error.chunk = text.slice(cf.length).trimLeft();
					return reportError(error);
				}
				instruction.target = line;
			} else if(!(1+validInstructions.indexOf(text))) {
				error.error = 'noSuchInstruction'
				return reportError(error);
			} else {
				instruction.instruction = text;
			}
		}

		instruction.sourceIndex = sourceIndex;
		return instruction;
	}

	var reportError = function(error) {
		log.bind(0,'cfl error:').apply(0,arguments);
		parseErrors.push(error);
		return false;
	};

	//Expand the instructions into a sparse array, indexed by line number.
	var splat = function(parsedProgram) {
		var program = [];

		//First, get rid of undefined instructions.
		parsedProgram = parsedProgram.filter(function(inst) { return inst; });
		parsedProgram.forEach(function(inst) {
			program[inst.lineNumber] = (program[inst.lineNumber] || []).concat(inst);
		});
		return program;
	}

	var generateJumpTable = function(program) {
		var jumps = [];
		program.forEach(function(instSet) { instSet.forEach(setJumpTarget); });
		function setJumpTarget(inst) {
			inst.target && (jumps[inst.target] = {
				dest: inst.lineNumber, 
				conditional: inst.instruction==='comefromif',
				source: inst,
			}); //TODO: add comefromif.
		}
		return jumps;
	};

	//Returns "there is more program to run".
	//Random picker proof: var bkt = {}; for(var x = 0; x < 200000; x++) { var n = [1,2,3,4,5][Math.floor(Math.random()*5)]; ++bkt[n] || (bkt[n]=1); }; bkt;
	var advanceProgramOneStep = function(skipNuls) {
		//Find next instruction.
		if(skipNuls === undefined) { skipNuls = true; }
		var pLen = eng.program.length;
		while(!eng.program[++eng.instructionPointer] && eng.jumps[eng.instructionPointer] === undefined && eng.instructionPointer < pLen && skipNuls) {}; //Note: skipNuls must come last or the first check doesn't increment the instruction pointer.
		var instNum = eng.instructionPointer;

		eng.lastInstructionPointer = instNum;
		log(instNum);

		//"If there is a list of instructions, choose one and do it."
		var error = eng.program[eng.instructionPointer] && apply(eng.program[instNum][Math.floor(Math.random()*eng.program[instNum].length)])

		//Comefrom this line number.
		if(instNum in eng.jumps) {
			var doJump = true;
			if(eng.jumps[instNum].conditional) { //Conditional comefrom, comefromif.
				doJump = !!eng.stack.slice(-1)[0] || eng.stack.slice(-1)[0] === nul;
			}
			//Line is always advanced at the start of this routine; so we have to jump to one below the instruction we want to go to.
			doJump && (eng.instructionPointer = eng.jumps[instNum].dest-1)
		}

		//Return data on this instruction.
		var moreProgram = eng.instructionPointer+1 < pLen;
		return {
			more: !error && moreProgram, 
			instructions: eng.program[instNum], 
			error: error
		};
	};

	eng.load = function(text, opts) {
		//Reset
		text = text || '';
		opts = opts || {};
		eng.stack = []; 
		eng.opStack = [];
		eng.instructionPointer = -1;
		parseErrors = [];

		//Load
		var pprog = parseInstructions(text);
		if(pprog.success) {
			eng.program = pprog.program || [];
			eng.jumps = generateJumpTable(eng.program);
			log({program: eng.program, jumps: eng.jumps});
			return {
				success: true,
				stepProgram: advanceProgramOneStep,
			};
		} else {
			return pprog;
		}
	};




	  // ===================================================== //
	 // Program instruction execution                         //
	// ===================================================== //


	var isFiniteNumber = function(val) {
		return typeof(val) === 'number' && isFinite(val);
	};

	var isSaneValue = function(val) {
		if(typeof val === 'number') { return !isNaN(val); }
		else if(typeof val === 'string') { return true; }
		else { return false; }
	}

	function cflError(data) {
		this.prototype = Error.prototype;
		this.name = "cflError";
		this.message = data.error;
		this.data = data
	}

	var stackPush = function(val) { eng.stack.push(val); };
	var stackPop = function() {
		var val = eng.stack.pop();
		if(val === undefined) { throw new cflError({error: 'emptyStack', desc: 'Tried to pop a value from an empty stack.'}); }
		return val;
	};

	//A deferred op is an infix operator that takes the first two args on stack in reverse order.
	var addDeferredOp = function(opName, opToApply) {
		var closure = {}; //In chrome, a function is weakly named by the variable it's assigned to.
		closure[opName] = function() {
			var b = stackPop();
			var a = stackPop();
			var result = opToApply(a,b);
			if(typeof a !== typeof b || !isSaneValue(result)) { throw new cflError({
				error: 'badOperation', 
				left: a, 
				right: b, 
				operator: opName,
				desc: 'Tried to ' + opName + ' incompatible values.',
			}); }
			stackPush(result);
		}
		closure[opName].toString = function() {return opName;}; //Used to print the opStack in the interface.
		eng.opStack.push(closure[opName])
	}

	var applyFns = {
		//Return false if no errors, or an error object otherwise. 
		nop: function() {},
		comefrom: function() {}, //Preprocessed and taken care of elsewhere.
		comefromif: function() {},
		print: function() { 
			var val = stackPop();
			if(val === nul) {val = 'nul';}
			cfl.interface.loaded 
				? cfl.interface.print(val) 
				: log('error: interface not loaded when printing ' + val); 
		},
		println: function() { 
			var val = stackPop();
			val = val===nul?'nul':val.toString();
			cfl.interface.loaded 
				? cfl.interface.print(val + '\n') 
				: log('error: interface not loaded when printing ' + val); 
		},
		log: function() { 
			var val = stackPop(); 
			if(typeof val === 'number') { log('#'+val); }
			else if(typeof val === 'string') { log('$'+val); }
			else if(val===nul) { log('nul'); }
		},
		not: function() { 
			var val = stackPop();
			stackPush(val===nul||!val?1:0);
		},
		'+': function() { addDeferredOp('+', function(a,b) {return a+b; }); },
		'-': function() { addDeferredOp('-', function(a,b) {return a-b; }); },
		'*': function() { addDeferredOp('*', function(a,b) {return a*b; }); },
		'/': function() { addDeferredOp('/', function(a,b) {return a/b; }); },
		'%': function() { addDeferredOp('%', function(a,b) {return a%b; }); },
		'<': function() { addDeferredOp('<', function(a,b) {return a<b?1:0; }); },
		'=': function() { addDeferredOp('=', function(a,b) {return a===b?1:0; }); },
		'>': function() { addDeferredOp('>', function(a,b) {return a>b?1:0; }); },
		'^': function() { addDeferredOp('^', function(a,b) {return Math.pow(a,b); }); },
		dup: function() { var val = stackPop(); stackPush(val), stackPush(val); },
		drop: function() { stackPop(); },
		reach: function() { 
			var distToLookBack = stackPop();
			if(!isFiniteNumber(distToLookBack)) { 
				throw new cflError({error: 'notANumber', value: distToLookBack, desc: 'Reached using a bad value. This operation requires a positive, whole number.'}); }
			if(distToLookBack <= 0 || distToLookBack > eng.stack.length) { 
				throw new cflError({error: 'invalidIndex', value: distToLookBack, desc: 'Reached to a nonexistant number. Reach requires a positive number not greater than the size of the current stack.'}); }
			stackPush(eng.stack[eng.stack.length-distToLookBack]); 
		},
		swap: function() { var a = stackPop(), b = stackPop(); stackPush(a), stackPush(b);},
		str: function() { stackPush(''+stackPop()); },
		num: function() { 
			var valueToConvert = stackPop();
			var numericValue = +valueToConvert;
			if(isNaN(numericValue)) {
				throw new cflError({error: 'notCoercibleToNumber', value: valueToConvert, desc: 'Could not interpret value as a number. Valid examples: "10", "10.5", or "0xA".'}); }
			stackPush(numericValue); 
		},
		calljs: function() {
			//Load the path.
			var fnPath = stackPop();
			if(typeof fnPath !== 'string') { throw new cflError({error: 'notAString', value: fnPath, desc: 'Calljs requires a string as the first arg, to be used as a key for the window object in javascript. For example, "cos<Math" would call the cosine routine.'}); }
			var fnPathList = fnPath.split('<');
			var target = window;
			var context = window.parent; //Context is the holder of the function.
			while (fnPathList.length) {
				var pathFragment = fnPathList.pop();
				var context = target;
				target = target[pathFragment];
				if(target === undefined || target === null) { 
					throw new cflError({error: 'invalidJSPath', value: fnPath, fragment: pathFragment, desc: '$'+pathFragment+' in the calljs path did not resolve.'}); }
			}
			if(typeof target !== 'function') {
				throw new cflError({error: 'invalidJSPath', value: fnPath, desc: 'The calljs path did not resolve to a function.'}); }

			//Load the arity.
			var numArgs = stackPop();
			if(typeof numArgs !== 'number') {
				throw new cflError({error: 'invalidFunctionArity', value: numArgs, desc: 'The second arg of calljs was not a number. This value represents the arity of the javascript function being called, and determines how much of the stack is fed to the function.'}); }
			if(numArgs > eng.stack.length) {
				throw new cflError({error: 'invalidFunctionArity', value: numArgs, desc: 'The calljs function requested more args than were in the stack.'}); }

			//Load the args.
			var args = [];
			for (;numArgs--;) { args.push(stackPop()); };

			//Call the function.
			try {
				var result = target.apply(context, args);
			} catch (err) {
				throw new cflError({
					error: 'javascriptError', 
					value: err, 
					desc: 'When calljs ran '+fnPath+'('+args.join(',')+'), it threw an error.',
				}); 
			}

			//Coerce the value for our limited type system.
			if(typeof result === 'string' || typeof result === 'number') { stackPush(result); }
			else if(typeof result === 'boolean') { stackPush(result?1:0); }
			else { stackPush(nul); }
		},
		readjs: function() {
			//Load the path.
			var valPath = stackPop();
			if(typeof valPath !== 'string') { throw new cflError({error: 'notAString', value: valPath, desc: 'Readjs requires a string as the first arg, to be used as a key for the window object in javascript. For example, "cos<PI" would put #3.14 on the stack.'}); }
			var valPathList = valPath.split('<');
			var result = window;
			while (valPathList.length) {
				var pathFragment = valPathList.pop();
				result = result[pathFragment];
				if((result === undefined || result === null) && valPathList.length) { 
					throw new cflError({error: 'invalidJSPath', value: valPath, fragment: pathFragment, desc: '$'+pathFragment+' in the readjs path did not resolve.'}); }
			}
			//Coerce the value for our limited type system.
			if(typeof result === 'string' || typeof result === 'number') { stackPush(result); }
			else if(typeof result === 'boolean') { stackPush(result?1:0); }
			else { stackPush(nul); }
		},
		depth: function() { stackPush(eng.stack.length); },

	};
	validInstructions = Object.keys(applyFns);
	console.warn(validInstructions);

	var apply = function(instruction) {
		if(instruction.instruction) {
			try { applyFns[instruction.instruction](); } 
			catch (err) { 
				if (!(err instanceof cflError)) { throw err; } 
				else { 
					err.data.instruction = instruction;
					err.data.opStack = false;
					return err.data; 
				}
			}
		} else if(instruction.value !== undefined) {
			stackPush(instruction.value);
			//Dequeue any operators on the stack, since each operator can only be waiting for one value and any operator waiting for one value must return one value.
			while(eng.opStack.length) {
				try { eng.opStack.pop()(); }
				catch (err) { 
					if (!(err instanceof cflError)) { throw err; } 
					else {
						err.data.instruction = instruction;
						err.data.opStack = true;
						return err.data; 
					}
				}
			}
		} else {
			debugger;
			throw new Error('Internal engine error: Tried to process an instruction without an instruction code or a value.');
		};
	}
}()