const Prism = require('prismjs')

;`
<!--
	published: 2021-04-17,
	tags: webgl privacy demo web-dev,
	desc: Is your graphics card exposed to the web? Find out here.,
	capreq: prism,
-->
<h2 id="Graphics-Card-Test"><a href="${page}">Graphics Card Exposure Test</a></h2>

<p>Sometimes, your graphics card's details are exposed to the web. <b id="graphics-card-test-output">Yours are not right now, though, which is good.</b> Try opening this page in different browsers – I found Chrome had much more information than Firefox, for example.</p>

<h3>The Code</h3>

<script>{
	const getGPU = () => {
		const ctx = document.createElement('canvas').getContext('webgl') 
		const ext = ctx.getExtension('WEBGL_debug_renderer_info')
		return {
			card: ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL),
			vendor: ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL),
		}
	}
	
	try {
		const gpu = getGPU()
		document.getElementById('graphics-card-test-output')
			.textContent = \`For example, you are running \${gpu.vendor}'s \${gpu.card}.\`
	} catch (e) {
		console.info("Graphics card test failed.", e)
	}
}</script>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		//Function to grab GPU data.
		const getGPU = () => {
			const ctx = document.createElement('canvas').getContext('webgl') 
			const ext = ctx.getExtension('WEBGL_debug_renderer_info')
			return {
				card: ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL),
				vendor: ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL),
			}
		}
		
		//Put the GPU data into the web page.
		const gpu = getGPU()
		document.getElementById('graphics-card-test-output')
			.textContent = \`Yours is \${gpu.vendor}'s \${gpu.card}.\`
	`, Prism.languages.javascript, 'javascript'))
}</code>
`