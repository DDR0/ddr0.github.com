const Prism = require('prismjs')

;`
<!--
	capreq: prism,
	published: 2022-08-14,
	tags: arduino embedded code,
	desc: A variadic Arduino Serial.println(). Because convenience is king.,
	title: A Variadic println() for Arduino,
-->
<p>The Arduino ecosystem provides <code>Serial.print(x);</code> and <code>Serial.println(x);</code>, the latter adding a newline after the value. I almost universally want to print out out a tag so I know what's what though, so something like <code>Serial.printlnMulti(x, y, z, ...)</code> would be convenient. (<code>x</code>, <code>y</code>, and <code>z</code> and so on can be any type here.)</p>
<p class=noindent>And indeed, we can make it so.</p>
<strong>debug.hpp:</strong>
<code class="prism-block language-js">${Prism.highlight(`
	#pragma once

	#include <Arduino.h>

	template <class ...Types>
	void debug(Types&& ...inputs)
	{
		(Serial.print(inputs), ...);
		Serial.println();
	}
`, Prism.languages.js, 'js')}</code>
<p class=noindent>Usage like <code>debug("analog value: ", analogRead(35));</code>. You can have any number of args to the function, of course.</p>
<p class=noindent>What are the size implications of this, however? C++ is big on zero-cost abstractions, so ideally the above should copile the same as:</p>
<code class="prism-block language-js">${Prism.highlight(`
	Serial.print("analog value: ");
	Serial.println(analogRead(35));
`, Prism.languages.js, 'js')}</code>
<p>Testing this in my non-trivial project, substituting one debug stanza of many, we get a total size for the fancy C++ 17 version, 279957 bytes. This compares favourably to the baseline of 279973 bytes, as we have paid a total of -20 bytes for our indescretions. A win for expressing what you want over expresning how to do it, I guess. ¯\\_(ツ)_/¯</p>
`