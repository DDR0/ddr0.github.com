<!--
	published: 2016-11-16,
	tags: code-golf response,
	desc: Let's write a Javascript function\, isBalanced\, that returns true if a set of braces is balanced.,
	-->
<h2 id="BalancingBraces"><a href="~&">Balancing Braces</a></h2>

<p>I chanced to read an article this morning on <a href="https://medium.com/@benastontweet/balancing-braces-a76e7b8e5f04">Ben Aston's blog</a>, which dealt with balancing braces. You should go read it now, since it's good and since I'm about to critique the heck out of his approach.</p>

<p>The task Ben sets himself is simple: write a Javascript function, isBalanced, that returns true if a set of braces is balanced. Running his solution through <a href="https://jshint.com">jshint</a>, we find it has 13 statements with a <a href="https://en.wikipedia.org/wiki/Cyclomatic_complexity">cyclomatic</a> complexity score of 6. I think it is an inelegant solution for an elegant problem, as my solution came in at 4 statements with a complexity score of 2. (And mine doesn't repeat the characters to be matched either. <img class="emote" src="/images/wesnoth%20icons/icon_wink.gif"> )</p>

<h3>Analysis</h3>
<p>This can be looked at not as a parsing problem, but as a pattern-matching problem instead. You have to think about it recursively.</p>

<p>The key insight we will use is that <strong>this problem is as easy as repeatedly removing pairs of braces</strong>, such as <code>()</code> or <code>[]</code>. There is no case where the braces could be balanced without a pair of braces occurring in the string. By repeatedly removing all the paired braces, we will end up with either an empty string or the non-matching braces.</p>

<p>Let's work this through. <code>'[{}]'</code> has one pair of braces we can spot - <code>{}</code>. Remove it and we are left with <code>'[]'</code> and another pair, <code>[]</code>, which we can also remove. Are there any characters left? No? Then the input was balanced. However, <code>'[{]}'</code> has no pairs of braces, and does have characters left, so it's unbalanced. <code>'()['</code> reduces to <code>'['</code>, which is likewise unbalanced.</p>

<h3>Solution</h3>
<div class="code-container">
	<code>function isBalanced(braces) {</code>
	<code>	do {</code>
	<code>		var matches = braces.split(/\(\)|{}|\[]/);</code>
	<code>		braces = matches.join('');</code>
	<code>	} while (matches.length > 1);</code>
	<code>	return !braces;</code>
	<code>}</code>
</div>

<br>

<figure style="padding-top:1em">
	<iframe src="~/example" style="height:26ex" scrolling="no"></iframe>
	<figcaption style="padding-top:1em"><strong>Live Example:</strong> All tests passing.</figcaption>
</figure>

<p>Given this solution, Ben's statement that "to solve this problem we need to have a function that will return the opener corresponding to a closer" is proven false. We have no such function, and we have solved the problem.</p>

<h3>Comparison</h3>
<p>In our code, <strong>there's a lot of things we don't have to worry about.</strong> We don't have to worry about inverting characters. We don't have to worry about queues. We don't have to worry about what the schema is, or even what <em>a</em> schema is. <strong>We just remove characters from a string.</strong></p>

<p>This post is a lot shorter than Ben's, because my solution is a lot simpler. Often you do not have to think of the right data structure, but instead spend some time thinking of the right algorithm. My solution is simpler, but perhaps Ben's is constrained by an outside influence, not stated in the problem - say, the user of the function will want an error message pointing to the mismatched brace. While we should always strive for the clearest code, it's worth remembering that sometimes it was done that way for a reason.</p>