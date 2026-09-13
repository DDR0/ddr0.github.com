const Prism = require('prismjs')
require('prismjs/components/')(['js'])

;`
<!--
	published: 2026-09-13,
	tags: web-dev web-components practices,
	desc: I've found a useful way to hold Web Components. It is a technology worth paying attention to!,
-->

<p>There are three places to store state in front-end web development. <i>Very</i> roughly:</p>
<ol>
	<li>The backend - the frontend makes an HTTP request and retrieves a new web page from the server. Application state lives on the backend, usually keyed by URL.</li>
	<li>Javascript and its various stores – in a variable, in the various application stores, cookies, etc. - as Evercookie showed, there's a lot of places you can store state in Javascript.</li>
	<li>And, in the DOM, as the nodes and attributes that make up the web-page.</li>
</ol>

<p>By storing state in the DOM and using Web Components to display that state, we are guided to write very maintainable, composable code.</p>

<p>Let's take an example were we're doing a dynamic visualisation of some tabular data on the front-end. We have two parts — the application — the HTML/CSS/JS which provides the logic and display for our data. The second part is the data, which comes in from a separate request. We've opted not to do server-side rendering, because the refresh period is too long for the real-time interactive experience we want. Additionally, we have a fairly small data-set, a few thousand entries at most.</p>

<p>The standard approach I would have taken previously would be to load the data into a varibale, do the processing there, and display the results by writing them out to an HTML Canvas element or the DOM. Then, when something changes, read the stored data and update the output in an event handler. When new data arrives, update the store and re-update the output.</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		import data from "/api/v1/heatmap-data.json" with { type: "json" };

		const canvas = document.querySelector('canvas[heatmap-display]');
		const draw = datum => { ... }; //lots of implementation details
		const update = datum => { ... };

		const render = data => {
			for (const entry of data) {
				draw(entry); //show the data on the canvas
			}
		};

		render(data);

		(new EventSource("/api/v1/heatmap-update-stream")).onMessage = event => {
			update(data, event.data); //however you want to merge in the update
			render(event.data);
		}
`, Prism.languages.js, 'js'))
}</code>

<p>This approach works fine! You get a nice, performant application out of it. However, it does not naturally push us to split our concerns, and it isn't really reusable - more of a one-off script. We can do better!</p>

<p>The approach I would take now with web components pushes you to split concerns, and naturally results in a reusable component library. Good tools make good results something you don't have to push for! Using web components, I would load the data from the API into the DOM, and then let the web component handle the rendering.</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		import data from "/api/v1/heatmap-data.json" with { type: "json" };

		const heatmap = document.querySelector('heatmap-display');

		//Copy the JSON to the DOM. Much simpler than rendering to canvas!
		const render = data => {
			for (const entry of data) {
				const node = heatmapEntryTemplate.content.cloneNode(true).children[0];
				for (const [key, value] of Object.entries(entry))
					node.querySelector(\`[field=\${key}]\`).textContent = value;
				heatmap.appendChild(node);
			}
		};

		render(data);

		(new EventSource("/api/v1/heatmap-update-stream")).onMessage = event =>
			render(event.data);
	`, Prism.languages.js, 'js'))
}</code>

<p>This might result in a DOM which looks like this:</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		<heatmap-display>
			<template>
				<tr>
					<td field=x></td>
					<td field=y></td>
					<td field=value></td>
				</tr>
			</template>
			<tr><td field=x>2</td><td field=y>3</td><td field=value>1783</td></tr>
			<tr><td field=x>5</td><td field=y>-2</td><td field=value>37</td></tr>
			<tr><td field=x>7</td><td field=y>12</td><td field=value>437</td></tr>
			<tr><td field=x>5</td><td field=y>2</td><td field=value>1301</td></tr>
		</heatmap-display>
	`, Prism.languages.js, 'js'))
}</code>

<p>The new code is very similar, but by rendering to the DOM we have a few major advantages.</p>

<ol>
	<li>The rendering code is much shorter than it would be otherwise.</li>
	<li>Our concerns are now isolated – all of the script is now dedicated to one thing, moving data around. The rendering and interactivity is handled internally by our custom web component.</li>
	<li>Our DOM now contains all our data, so we can do things like <strong>copying the DOM textually to debug it.</strong></li>
</ol>

<p>This last point is surprisingly useful. We can copy the DOM around and make sure our component works in any given state, and modify this state by modifying the HTML in our developer tools or our text editor. We have a declarative window into our application state! This also means we can also easily generate the initial state server-side if we ever want! We have a clear, simple migration path.</p>

<p>On the implementation side, I find things are less elegant. While the encapsulation is worth the cost, I either haven't worked out how the technologies at play are supposed to fit together or they just don't fit together very well. I imagine this will be rectified moving forward, but for now this is what I have found worked best for me.<p>

<p><strong>The Good:</strong> The web component implementation can use the DOM observers to update its visualisation and internal state when the DOM changes. This is simple and performant. Visibility observers can further reduce the cost of an expensive render if the component involves real-time visualisation or just an expensive Canvas2D render.</p>

<p>You can strongly isolate your component from the rest of the page as well, which serves to limit complexity blow-up on larger pages – especially regarding styling! By making it so that a page can't muck with your component, you also make it impossible for a page to come to rely on internal implementation details which might limit your options to update your component in the future.</p>

<p><strong>The Bad:</strong> Styling is weird. You can style your custom element externally, in your regular CSS files, if you use an "open" <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_components#shadow_dom">shadow root</a>. However, you don't get most of the benefits of isolation then. But if you are using a closed shadow root, you need to load the styling for your component in somehow, and it seems to require JS as of late 2026. It's just a bit of the technology I find awkward to use.</p>

<p>Similarly, the internal HTML structure of your web component must come from somewhere. It's very awkward to use the DOM API to manually create every node, so I invariably want to have a template somewhere with my content in it. But, where does this template live? Like the CSS, it can be loaded in via XHR/fetch(), but this incurs a delay as loading can't start immediately. It can be inlined in a JS string, but we miss most of the benefits of having an HTML <i>file</i> then - automatic syntax highlighting, build optimizations/includes, etc. I have worked around this by including the HTML for my web components on the page as a <code>&lt;template&gt;</code>, but this again trades isolation (and reusability/composability) for convenience. Still, having a very convenient implementation is a definite win for a small project!</p>

<p>There are upgrade paths for all these issues as a project gets larger and the target cost/convenience ratio changes, which to me is the best reason to recommend web components as a technology. You can start to use them in any capacity, and there's always going to be an obvious upgrade path. It's very hard to paint yourself into a corner with them! In the end, I think that's some of the highest praise I can give a technology. I'd definitely recommend paying it some attention if you do web development.</p>
`