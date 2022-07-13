const Prism = require('prismjs')

;`
<!--
	published: 2022-05-15,
	tags: js microblog web-dev,
	desc: Quick JS Hydration,
	capreq: prism,
	title: Hydrating Objects in Javascript,
-->

<h3>What is Hydration?</h3>

<p>Hydration is a step which sometimes occurs after parsing your data. In some languages, such as Javascript, the parsing of the data from source text is usually done via <code>JSON.parse(…)</code> a DOM method, or a fetch reply's <code>.toJson()</code>. However, while this converts the text into your language's data structure, it doesn't convert them into <strong>your</strong> data structures.</p>
<p>For example, take a Rectangle class. If you parse a rectangle stored as x1y1x2y2 coordinates with <code>JSON.parse(…)</code>, you don't get your Rectangle object with the nice <code>.width</code> and <code>.height</code> properties. Hydration is the process of constructing your Rectangle objects from the rectangle x1y1x2y2 data you parsed.</p>
<p>Hydration usually goes hand-in-hand with the validation of your data, because if you verify the data in one place and then construct the objects in another place, the two places will <strong>inevitably</strong> get out of sync at some point. (See Alexis King's "<a href="https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/">Parse, Don't Validate</a>" post from 2019 for more details on the matter.) To that end…</p>

<h3>Simple Hydration Method</h3>

<p>I have written up a basic 8-line method to hydrate and validate your data from parsed JSON. It lazily evaluates and validates the results, so it will work well with large data sets. The hydrated data is used exactly like a normal (read-only) data structure.</p>

<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		const hydrate = (structure, data) =>
			new Proxy(Object.create(null), {
				get: (cache, prop) => {
					if (prop in cache) return cache[prop]
					if (prop in structure) 
						return cache[prop] = structure[prop](data[prop])
					throw new Error(\`unknown key \${prop}\`);
				}
			})
	`, Prism.languages.javascript, 'javascript'))
}</code>

<p class=noindent>Usage Example:</p>
<code class="prism-block language-js">${
	indent(-1, Prism.highlight(`
		const data = hydrate(
			{
				a: Number,
				b: String,
				c: d => hydrate({
					e: Number,
					f: fetch.bind(window),
				}, d),
			},
			{ //Or, say, await (await fetch('https://example.com/').body).toJson().
				a: 1,
				b: "two",
				c: {
					e: 3,
					f: "https://example.com/",
				}
			}
		);
		
		console.log(data.a, data.b, data.c.f)
		//1, "two", Promise{&lt;pending&gt;}
	`, Prism.languages.javascript, 'javascript'))
}</code>

<p>Here, I've hydrated some built-in object Javascript has, but you can use any object you have on hand of course. Note that because the hydration is lazy, we won't fire off an HTTP request until we actually ask for <code>data.c.f</code> from our data structure.</p>

<p>Because the hydrating data is used like a normal data structure, so we can pass the results from <code>hydrate()</code> to other functions and they will work without modification. We have injected lazy-loading data into our program!</p>

<h3>How does it work?</h3>

<p>This solution is based around the <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxy</a> object, which comes with the Javascript standard library. (It is available in all browsers aside from Internet Explorer.) When we ask for a property of a proxy, eg <code>data.a</code>, we get to run code to determine what that property is. In the <code>get</code> function, on line 4, we check if we've already hydrated this object. If we have, we return the results of that so we don't end up repeating work and duplicating references. If we don't have the cached value, then on line 5 we check if we can construct a new one. This works by taking the constructor from the structure object, and the data from the data object, and calling the constructor with it. We store the results, which I've also seen called <em>memoization</em>, for the next time we're asked for this data. This avoids constructing the object again, which would be slow and cause problems - data.a might not equal data.a if we didn't store the reference, for example! Finally, if we don't have a constructor to call to validate the data and produce a hydrated object, we throw an error.</p>

<h3>Limitations</h3>

<p>This is demonstration code. It doesn't really handle lists, although that could be added in as another <code>if</code> statement. If you wanted to allow setting values in the hydrated data, you would have to add a <code>set</code>ter. The syntax for hydrating a sub-object could be improved by having the function return itself partially bound if only one arg is passed in. But these are all very approachable, and I think show the beauty of Javascript - a clean, functional style enabling a traditional, organized object-oriented approach.</p>

<p>There are, of course, libraries which will transport your objects better than this code, such that you don't have to maintain a mapping in the client-side code. (The first arg in the example function call.) However, they will be by necessity more heavy-weight and harder to understand. I am, personally, a programmer who likes to stay close to the browser. If you understand your tools and work with their strengths, you can make some amazingly performant, understandable web pages.</p>

<p class=noindent>No need to get complicated.</p>
`