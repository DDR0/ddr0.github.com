const Prism = require('prismjs')

;`
<!--
	published: 2021-04-20,
	tags: wasm js web-dev,
	desc: What happens when you use a SharedArrayBuffer as a WASM source?,
	capreq: prism,
-->
<h2 id="shared-wasm-buffer"><a href="${page}">Shared Array Buffers With WASM</a></h2>

<p>Yesterday, I solved a long-standing question I'd had - how do you get data out of a  WebAssembly program without having to copy it back? Ideally, in such a way that a web worker wouldn't have to copy it back to the main thread either. I've been able to find some information on this around the web, but much of it seems to be rather outdated or does not address the issue. I decided to have a crack at it myself and figure out the state of the art by writing a small proof-of-concept.</p>

<h3>Version 1</h3>

<p>My first approach was to try to create the web worker using a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer">SharedArrayBuffer</a> backing its code. As a bonus, we should be able to redefine bytecode on the fly then which will be fun.</p>

<p>Copying from <a href="https://depth-first.com/articles/2020/01/13/first-steps-in-webassembly-hello-world/">Depth-First's excellent guide</a> (read it before this post), we arrive at something like this:</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		(async () => {
			const memory = new WebAssembly.Memory({ initial: 1 });
			
			const log = (offset, length) => {
				const bytes = new Uint8Array(memory.buffer, offset, length)
				const string = new TextDecoder('utf8').decode(bytes);
				console.log(string)
			};
			
			//Blob generated with compile with \`wat2wasm hello.1.wat --enable-threads --out /dev/stdout | base64 --wrap 0\`
			const unsharedData = new TextEncoder().encode(atob(\`
				AGFzbQEAAAABCQJgAn9/AGAAAAIZAgNlbnYGbWVtb3J5AgABA2VudgNsb2cAAAMCAQEHCQE
				FaGVsbG8AAQoKAQgAQQBBDRAACwsTAQBBAAsNSGVsbG8sIFdvcmxkIQ==
			\`))
			const sharedData = new Uint8Array(new SharedArrayBuffer(unsharedData.length))
			sharedData.set(unsharedData)
			
			sharedData[sharedData.length - 1] = '?'.charCodeAt()
			
			const { instance } = await WebAssembly.instantiate(sharedData, {
				env: { log, memory }
			});
			
			instance.exports.hello()
			sharedData[sharedData.length - 1] = '.'.charCodeAt()
			instance.exports.hello()
		})()
	`, Prism.languages.javascript, 'javascript'))
}</code>

<p>Here, we start by defining some <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/Memory">WebAssembly memory</a> to pass args around with. (The <code>initial</code> value is in number of 64-KiB pages to allocate.) We then define a function, <code>log</code>, which will take this memory and print the contents using <code>console.log(…)</code>. We'll call this from our WASM code, which we've serialised in this case as a base64 string. (The source of which is <a href="${postFolder}/hello.1.wat">hello.1.wat</a>, compiled using <a href="https://webassembly.github.io/wabt/doc/wat2wasm.1.html">wat2wasm</a> from <a href="https://github.com/WebAssembly/wabt">WABT</a>.)</p>

<p>To get our shared memory, we create a new array backed by a <code>SharedArrayBuffer</code>. In JS, all the <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray"><em>typed</em> arrays</a> have a backing buffer. Usually, by default, it's an <code>ArrayBuffer</code>. Amusingly enough, an <code>ArrayBuffer</code> <em>can</em> be shared between multiple typed arrays, even of different types. The <code>SharedArrayBuffer</code> is called so because it can be passed between web workers without copying as well, which a regular <code>ArrayBuffer</code> can't do. This is the behaviour we're after.</p>

<p>So, let's test it! First, we'll set the final byte of our WASM program to <code>?</code>, from it's original value of <code>!</code>, to prove we're loading the right memory and can manipulate it. Then, we start the WebAssembly program and call the <code>hello()</code> function of the <code>instance</code> we created. This in turn calls our <code>log()</code>, which prints "Hello, world?".</p>

<p class="noindent"><em>(Note: <code>WebAssembly.instantiate(…)</code> will also let you pass in an <code>ArrayBuffer</code>/<code>TypedArrayBuffer</code>, in addition to the <code>Uint8Array</code> we have here… in Firefox and not in Chrome.)</em></p>

<p>Now we modify our memory again, this time changing the final byte to <code>.</code>. However, calling into <code>hello</code> again, we find we get the same output, "Hello, world?". We can't just poke the memory of a running WASM program, it would seem - probably for the best. So, what do we do now?</p>

<h3>Version 2</h3>

<p>We have one other memory-buffer-ish object we can tweak. Let's see if we can't get that initial <code>const memory = …</code> declaration to be a shared buffer, instead of an unshared buffer. Some brief searching later, and we find that <code>WebAssembly.Memory</code> can indeed take a <code>shared</code> flag. It's not very well supported, but let's rework our code to try to test it anyway. (I believe the <code>shared</code> flag is part of the <a href="https://developers.google.com/web/updates/2018/10/wasm-threads">WebAssembly Threads</a> system, which seems to just be referring to using shared memory to communicate between workers VS message passing.)</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		(async () => {
			const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared:true });
			
			let globalBytes = null
			const log = (offset, length) => {
				const bytes = new Uint8Array(memory.buffer, offset, length)
				globalBytes = bytes
				
				//Can't use TextDecoder because it doesn't handle shared array buffers as of 2021-04-20.
				//const string = new TextDecoder('utf8').decode(bytes);
				const string = bytes.reduce(
					(accum,byte)=>accum+String.fromCharCode(byte), '')
				
				console.log(string)
			};
			
			//Blob generated with compile with \`wat2wasm hello.2.wat --enable-threads --out /dev/stdout | base64 --wrap 0\`
			const wasm = new TextEncoder().encode(atob(\`
				AGFzbQEAAAABCQJgAn9/AGAAAAIaAgNlbnYGbWVtb3J5AgMBAQNlbnYDbG9nAAADAgEBBwk
				BBWhlbGxvAAEKCgEIAEEAQQ0QAAsLEwEAQQALDUhlbGxvLCBXb3JsZCE=
			\`))
			const { instance } = await WebAssembly.instantiate(wasm, {
				env: { log, memory }
			});
			
			instance.exports.hello()
			globalBytes[0] = '\\''.charCodeAt()
			instance.exports.hello()
		})()
	`, Prism.languages.javascript, 'javascript'))
}</code>

<p>With our new memory declaration returning a shared buffer… on most non-Apple desktop browsers… 😬 we can now test this method of memory manipulation. We immediately find three things:
<ol>
	<li>Our WASM program needs to have it's memory declaration updated too, yielding <a href="${postFolder}/hello.2.wat">hello.2.wat</a> and a new base64 blob.</li>
	<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder"><code>TextDecoder</code></a> doesn't accept a SharedArrayBuffer, so we have to write our own little routine here. I guess this is because, as the bytes could change at any time, we could potentially output invalid utf-8 as our data shifted under us. We don't care for this single-threaded demo, but it would be an issue normally.</li>
	<li>We must capture the newly-shared text buffer in the callback (as <code>globalBytes</code>), so we won't bother manipulating it before we instantiate our WebAssembly program.</li>
</ol>
<p>To test this, we call <code>hello()</code> again, which sets <code>globalBytes</code> to our "Hello, world!" message. We now set the first character to an apostrophe, and call in to our function again to test if we were able to set data visible to WASM. It prints "'ello, world!", thus demonstrating we are! Since we're working with a <code>SharedArrayBuffer</code> here, we can share this reference across threads to get fast, efficient data transfer.</p>
`