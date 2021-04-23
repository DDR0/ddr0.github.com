"use strict"

{
	//Code blocks come indented. This is a problem, as they are preformatted and
	//so appear quite far to the right, and with a little extra space before and
	//after them. This script goes through and doctors the code blocks such that
	//they have no spare whitespace around them.
	
	const unindented = new Set() //Track unindented blocks of code.
	
	const unindent = ()=>{
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
			codeBlock => {
				//Unindent isn't idempotent, so only run it once.
				if (unindented.has(codeBlock)) { return }
				unindented.add(codeBlock)
				
				codeBlock.innerHTML = unindent(
					codeBlock.innerHTML,
					findMinIndent(codeBlock.innerHTML)
				)
			}
		)
	}
	
	unindent() //Do whatever we have now, before everything's loaded, quick.
	document.addEventListener('DOMContentLoaded', unindent) //Check again, as we have all the document now.
}