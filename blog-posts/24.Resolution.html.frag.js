const Prism = require('prismjs')
require('prismjs/components/')(['js', 'bash'])

;`<!--
	published: 2026-07-27,
	tags: web-dev rust wasm multithreading html5 fix AI,
	desc: I asked an AI and it figured out what was wrong with my multithreaded web workers.,
-->

<p>
	After three years, I have solved the mystery why my webassembly won't load correctly as mentioned in <a href="/blog-posts/19.Negative_Results">Negative Results</a>, itself a follow-up to <a href="/blog-posts/13.Shared_Array_Buffers_With_WASM">Shared Array Buffers with WASM</a>. I asked <a href="https://www.perplexity.ai/products/computer">an AI</a>.
</p>

<p>
	It turns out we needed to explicitly set the stack memory location during setup, so that each program got <em>separate</em> stack memory to work with. To do this, and allocate thread-local storage areas as well, we add <code class="prism-span language-bash">${Prism.highlight(`--export=__stack_pointer --export=__wasm_init_tls --export=__tls_size --export=__tls_base --export=__tls_align`, Prism.languages.bash, 'bash')}</code> to the Rust link args, and then set them like this:
</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		const REGION_BASE = 2 * 1024 * 1024 //Above the module's static data, heap base, and world.globalTick.
		const STACK_SIZE  = 512 * 1024      //Plenty for this program; grows downward from the top of the block.
		const align = n => (n + 15) & ~15
		const tlsSize = align(exports.__tls_size.value) //0 here (no #[thread_local]s), but honour it for correctness.
		const blockSize = tlsSize + STACK_SIZE
		const blockBase = REGION_BASE + workerIndex * blockSize
		
		//TLS sits at the bottom of the block; the shadow stack occupies the rest and grows down from the top.
		//Set the private shadow stack FIRST, before any wasm call (including TLS init), so the
		//very first function entry runs on this worker's own stack rather than the shared one.
		exports.__stack_pointer.value = blockBase + blockSize
		exports.__wasm_init_tls(blockBase)
	`, Prism.languages.js, 'js'))
}</code>

<p>
	The <a href="${postFolder}/stardust_multithreading_fix(2).patch">minimal diff</a> on top of <a href="https://github.com/DDR0/Stardust-WASM/commit/de6020d072ef058337f228d1f39d23379f8069a2">my minimal test-case</a> to fix it shows exactly how to do this, if you have run into the same solution and need a fix.
</p>

<p>
	However, this is not directly what the AI produced. What it did is quite interesting, and kind of reinforces the "incredibly brilliant, incredibly stupid" bimodality of these expert systems. The <a href="${postFolder}/stardust_multithreading_fix.patch">first patch</a> it produced fixed the issue, but by patching the <em>compiled WASM binary</em> the worker ran, instead of patching the source code <em>right next to it in the folder</em>. The fix was another prompt to "not do that" producing <a href="${postFolder}/stardust_multithreading_fix(1).patch">a saner patch</a>, but my goodness… brilliant but blind. 🤦
</p>
`