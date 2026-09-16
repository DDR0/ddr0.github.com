const Prism = require('prismjs')

;`
<!--
	published: 2021-04-17,
	tags: webgl privacy demo web-dev,
	desc: Is your graphics card exposed to the web? Find out here.,
	capreq: prism,
	title: Graphics Card Exposure Test,
-->

<p>Sometimes, your graphics card's details are exposed to the web. <strong id="graphics-card-test-output">Yours are not right now, though, which is good.</strong> Try opening this page in different browsers – I found Chrome had much more information than Firefox, for example.</p>

<h3>The Code</h3>

<script type=module>{
	const getGPU = () => {
		const ctx = document.createElement('canvas').getContext('webgl')
		return {
			card: ctx.getParameter(ctx.RENDERER),
			vendor: ctx.getParameter(ctx.VENDOR),
		}
	}
	
	try {
		const {vendor, card} = getGPU()
		document.getElementById('graphics-card-test-output')
			.textContent = \`For example, you are purportedly running \${vendor}'s \${card}.\`
	} catch (e) {
		console.info("Graphics card test failed.", e)
	}
}</script>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		//Function to grab GPU data.
		const getGPU = () => {
			const ctx = document.createElement('canvas').getContext('webgl')
			return {
				card: ctx.getParameter(ctx.RENDERER),
				vendor: ctx.getParameter(ctx.VENDOR),
			}
		}
		
		//Put the GPU data into the web page.
		const {vendor, card} = getGPU()
		document.getElementById('graphics-card-test-output')
			.textContent = \`For example, you are purportedly running \${vendor}'s \${card}.\`
	`, Prism.languages.javascript, 'javascript'))
}</code>
`