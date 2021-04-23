"use strict"

document.addEventListener('DOMContentLoaded', ()=>{
	const findMinIndent = str => 
		Array.from(
			str.matchAll(/^[\t ]*?[^\s]/gm)
		).reduce(
			(minIndent, match)=>Math.min(minIndent, match[0].length),
			Infinity
		)-1
	
	const unindent = (str, amount) =>
		str.split('\n')
			.slice(1,-1) //Remove leading and trailing lines, "vertical indent".
			.map(line => line.slice(amount))
			.join('\n')

	Array.prototype.forEach.call(
		document.querySelectorAll("code.prism-block"),
		codeBlock =>
			codeBlock.innerHTML = unindent(
				codeBlock.innerHTML,
				findMinIndent(codeBlock.innerHTML)
			)
	)
})