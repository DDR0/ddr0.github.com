#!/usr/bin/env node
"use strict"

/* Compile script for ddr0.ca.
	
	Ingests .html.js files and evaluates them, outputting the last statement
	to stdout. Usually this is the results of a big ol' format string.
	
	This script can be run manually, of course, but it is primarily intended
	to be used by the makefile.
*/

const vm = require('vm')
const fs = require('fs')

const render = (filename, constants={}) =>
	vm.runInContext(
		fs.readFileSync(filename, {encoding:'utf8'}), 
		vm.createContext({
			require,
			dump: (...args) => (console.error.apply(console, args), args.slice(-1)[0]),
			include: render,
			paste: filename => fs.readFileSync(filename, {encoding:'utf8'}),
			indent: (level, text) => 
				'\t'.repeat(level)+text.trim('\n').split('\n').join('\n'+'\t'.repeat(level)),
			page: process.argv[2],
			global: constants, //Look up a constant in the script.
			...constants, //Or just reference it, which is easier but may fail if missing.
		}),
		{
			filename,
			timeout: 100,
		}
	).trim('\n')

const start = process.hrtime.bigint()
process.stdout.write(render(process.argv[2]))
const end = process.hrtime.bigint()
console.error(`Rendered ${process.argv[2].replace('.html.js', '.html')} in ${Math.round(Number(end - start)/1e6)}ms.`)