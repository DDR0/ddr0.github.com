#!/usr/bin/env node
//Compile script for ddr0.ca. See render.node.js for details.
"use strict"

if (!process.argv[2]) throw new Error('Render what? Missing file arg. (To compile, run build.js instead.)')

const render = require('./render-file.node.js')
const start = process.hrtime.bigint()
process.stdout.write(render(process.argv[2]))
const end = process.hrtime.bigint()
console.error(`Rendered ${process.argv[2].replace('.html.js', '.html')} in ${Math.round(Number(end - start)/1e6)}ms.`)