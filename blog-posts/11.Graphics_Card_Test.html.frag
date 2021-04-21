<!--
	published: 2021-04-17,
	tags: webgl privacy demo web-dev,
	desc: Is your graphics card exposed to the web? Find out here.,
-->
<h2 id="Graphics-Card-Test"><a href="~&">Graphics Card Exposure Test</a></h2>

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
			.textContent = `For example, you are running ${gpu.vendor}'s ${gpu.card}.`
	} catch (e) {
		console.info("Graphics card test failed.", e)
	}
}</script>

<div class="code-container"
>	<code>//Function to grab GPU data.</code>
	<code>const getGPU = () => {</code>
	<code>	const ctx = document.createElement('canvas').getContext('webgl') </code>
	<code>	const ext = ctx.getExtension('WEBGL_debug_renderer_info')</code>
	<code>	return {</code>
	<code>		card: ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL),</code>
	<code>		vendor: ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL),</code>
	<code>	}</code>
	<code>}</code>
	<code></code>
	<code>//Put the GPU data into the web page.</code>
	<code>const gpu = getGPU()</code>
	<code>document.getElementById('graphics-card-test-output')</code>
	<code>	.textContent = `Yours is ${gpu.vendor}'s ${gpu.card}.`</code>
</div>