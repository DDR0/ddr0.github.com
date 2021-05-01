const Prism = require('prismjs')

;`
<!--
	published: 2021-04-20,
	tags: js quirk microblog web-dev,
	desc: Same script\\, multiple tags. What happens?,
	capreq: prism,
	title: Same Script\\, Multiple Tags,
-->

<p>Today, I happened on a fun quirk of web-dev. What happens if you include the same script twice, say like this:</p>

<code class="prism-block language-html">${
	indent(-1, Prism.highlight(`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<script src="test.js" type="module"></script>
				<script src="test.js" type="module"></script>
	`, Prism.languages.html, 'html'))
}</code>

<p><code>test.js</code> only runs once, despite being included twice. It seems modules have a specific trait where they're only ever evaluated once, I believe specified in <a href="https://262.ecma-international.org/6.0/#sec-moduleevaluation">steps 4 and 5 of ECMAScript 6.0 section 15.2.1.16.5</a>.</p>

<p class=noindent>Nothing good ever comes of running scripts multiple times. I'm glad it's out.</p>

<p class=noindent>P.S.: Fun fact: You can still <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/open"><code>document.write(…)</code></a> in an ECMAScript module, which just feels… <em>wrong.</em> (At least the <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with">with</a> statement is history there, as modules are always in strict mode.)</p>
`