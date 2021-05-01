<!--
	published: 2013-11-26, modified: 2014-08-04,
	tags: demo interactive createjs article example web-dev html5,
	desc: I have found it difficult to find nice\, simple examples of how to lay out an EaselJS program. Here are five.
-->
<h2><a href="~&">Practical CreateJS Examples</a></h2>
<!-- /This is a trigger to start looking for elements with data-code-sources. The script pans through the entire page looking for it, because I don't know to to 'get elements after this element'. We break at the <hr> -->
<script class='start-code-viewer-scan'>
	"use strict";
	var createjsExamples = {
		play: function play(iframe, url) {document.getElementById(iframe).src = url;},
		stop: function stop(iframe) {document.getElementById(iframe).src = ""},
		show: function show(iframe, url) {
			var codeWindow = window.open("~/code viewer", '_blank');
			codeWindow.blur();
			
			function sendURL(event) {
				if(event.data === "need-url") {
					console.log('sending url');
					codeWindow.postMessage({url:url, iframe:iframe}, window.location.origin);
					codeWindow.removeEventListener("message", sendURL, false);
					
					var listenForSelect = function(event) {
						if(event.data && event.data.type) {
							console.log('got event ' + event.data.type, event);
							//if("event-type" === event.data.type) {}
						}
					};
					//codeWindow.addEventListener("message", listenForSelect, false);
					codeWindow.addEventListener("beforeunload", function() {
						configureEvents(iframe, codeWindow, true);
					});
					
					configureEvents(iframe, codeWindow, false);
				}
			};
			codeWindow.addEventListener("message", sendURL, false);
		},
	};
	
	(function scopeForConfigEvents() {
		var enable = false;
		var noop = function(){};
		var light  = "#f7ff59" //Link colours.
		var medium = "#e4ed3f"
		var dark   = "#a8a433"
		
		window.configureEvents = function configureEvents(target, display, disable) {//takes id of one of the code examples and a boolean.
			if(typeof(target) === 'undefined' || typeof(disable) === 'undefined') {throw new Error('target ('+target+') and disable ('+disable+') must be defined.')}
			enable = typeof(disable)==='boolean' ? !disable : !enable;
			var triggerTag = 'data-code-viewer-scan';
			var codeTag = 'data-code-source';
			var context = "«none»";
			var mode;
			
			var searchForStart = function(child) {
				//Scans forward for data attr start. This triggers the rest of the code.
				var trigger = child.getAttribute(triggerTag);
				if("start" === trigger) {mode = processData;}
				else if(trigger) {throw new Error("Found "+trigger+" attr before finding start attr of "+triggerTag+". ("+child+")");}
			};
			
			var processData = function(child) {
				//This scans forward until we hit the end data attr.
				var trigger = child.getAttribute(triggerTag);
				var code = child.getAttribute(codeTag);
				var classes = child.classList;
				var depressed = false;
				
				if(code) {context = child.getAttribute('id');}
				
				if(context === target) {
				
					if([].indexOf.call(classes, "cjs-line") > -1) {
						//console.log('found one', classes, child);
						
						child.style.backgroundColor = enable?medium:"transparent";
						child.style.cursor = enable?"pointer":"auto";
						
						[[//Events for the highlighted code.
						'click', function(code, lines, event) {
								event.preventDefault(); //If we happen to have a highlighted /link/, we don't want it to open up on us when we click for code.
						}],[
						'mousedown', function(code, lines, event){
								child.style.backgroundColor = !depressed ? dark : medium;
								display.postMessage({'type': "mousedown", 'lines':lines, depressed:!depressed}, window.location.origin);
								event.preventDefault();
						}],[
						'mouseup', function(code, lines, event){
								child.style.backgroundColor = (depressed = !depressed) ? dark : medium;
								display.focus(); //Iffy. But worth a shot.
								display.postMessage({'type': "mouseup", 'lines':lines, depressed:!depressed}, window.location.origin);
						}],[
						'mouseover', function(code, lines, event){
								child.style.backgroundColor = light;
								display.postMessage({'type': "mouseover", 'lines':lines, depressed:depressed}, window.location.origin);
						}],[
						'mouseout', function(code, lines, event){
								child.style.backgroundColor = depressed?dark:medium;
								display.postMessage({'type': "mouseout", 'lines':lines, depressed:depressed}, window.location.origin);
						}]].forEach(function(eventPair) {
							(function(eventName, callback) {
								child['on'+eventName] = (enable?callback:noop
									).bind(this, context, [].filter.call(classes, function(x) { //This binds the numeric classes to the 'lines' arg.
										return !isNaN(x);
									}));
							}).apply(this, eventPair);
						});
					}
				}
				
				if("end" === trigger) {
					mode = searchForStart;
				} else if("start" === trigger) {
					throw new Error("Found start attr before finding end attr of "+triggerTag+". ("+child+")");
				}
			};
			
			mode = searchForStart;
			[].forEach.call(document.getElementById('content-pane').children, function processElement(elem) {
				mode(elem);
				[].forEach.call(elem.children, processElement); //I have a feeling this may play hell with slower devices.
			});
		};
	})();
</script>
<p style='font-size: 10px;'>Note: Some examples were previously discussed in the October 2013 issue of the <a href="https://sdjournal.org/">Software Developer's Journal</a>. Some updates were made as of August 2014.</p>
<span data-code-viewer-scan='start'></span>
<p>I have found it difficult to find nice, simple examples of how to lay out an <a href="https://createjs.com/#!/EaselJS" class="external">EaselJS</a> program. The <a href="https://createjs.com/Docs/EaselJS/modules/EaselJS.html">documentation</a> and <a href="https://github.com/CreateJS/">examples</a> generally do a good job of covering the nuts and bolts of the library, but I find that some additional assembly instructions would be helpful. So, in rough order of my progression through the library, here are 5 examples:</p>
<h3>Example 1: A Basic Scene</h3>
<iframe id="clouds-1" class="iframe-player" data-code-source="~/1-0 Clouds" width="300" height="150" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('clouds-1', '~/1-0 Clouds');">play</button>
		<button onclick="createjsExamples.stop('clouds-1');">stop</button>
		<button onclick="createjsExamples.show('clouds-1', '~/1-0 Clouds');">code</button>
	</div>
<script>createjsExamples.play('clouds-1', '~/1-0 Clouds'); //A sort of 'hook' for the post, perhaps? Ideally, would only be enabled if this were the first post on the page.</script>
<p>We'll start with a small platformer mockup, very basic. In it, we want to have some clouds float behind the player. We'll create a new HTML file, <span class="cjs-line 5">import our library</span>, and write a simple scene. (You can grab the library I used from <a class="external" href="https://code.createjs.com/createjs-2013.05.14.min.js">https://code.createjs.com/createjs-2013.05.14.min.js</a>. Other versions are available on the <a href="https://code.createjs.com/">CDN page</a>.)</p>
<p>As a first attempt, we add the <span class="cjs-line 25">ground</span>, <span class="cjs-line 30">a cloud</span>, and <span class="cjs-line 41">an actor</span>. Since we're planning to add more clouds later, we've made that code a function. And – what do you know, it works! Our little cloud wafts gently across the sky, behind our actor.</p>
<p>(Aside: To view the code for the example, I recommend moving the tab the 'code' button opens to a new window… the popup code can be a bit flaky. When you mouse over the highlights here, they'll highlight there as well. A more reliable way to view the code might be to play the example, and then select 'view frame source' from the right-click menu. The code is also available on <a href="https://github.com/DDR0/ddr0.github.com/tree/master/blog-posts/03.CreateJS_Examples">Github</a>.)</p>
<iframe id="clouds-2" class="iframe-player" data-code-source="~/1-1 Clouds" width="300" height="150" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('clouds-2', '~/1-1 Clouds');">play</button>
		<button onclick="createjsExamples.stop('clouds-2');">stop</button>
		<button onclick="createjsExamples.show('clouds-2', '~/1-1 Clouds');">code</button>
	</div>
<p>Here, we've added <span class="cjs-line 30 31 32 33">a function to add clouds to our scene every two seconds</span>. While the first cloud works just fine, the other clouds float over our player because they're added after the player is. An index-based solution, like "add this after the first 5 objects", will be a rolling disaster. The best way I've found so far to deal with this problem, generally, is to have named z-orders. Even giving z-orders by an arbitrary number grows difficult to manage after a while.</p>
<p>Z-orders are also known as layers, and fill the same role as a 3D game's depth buffer.</p>
<iframe id="clouds-3" class="iframe-player" data-code-source="~/1-2 Clouds" width="300" height="150" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('clouds-3', '~/1-2 Clouds');">play</button>
		<button onclick="createjsExamples.stop('clouds-3');">stop</button>
		<button onclick="createjsExamples.show('clouds-3', '~/1-2 Clouds');">code</button>
	</div>
<p>Luckily, CreateJS implements the best of the three systems. They just don't tell you about it. Instead, <a href="https://www.createjs.com/Docs/EaselJS/classes/Container">the documentation</a> merely suggests that containers are a good way of grouping together objects that you would like to transform in the same manner. They are also a <em>great</em> way of grouping together objects you'd like to keep beneath other objects. At the start of the program, you can define all the z-orders that will exist as containers, and give them descriptive names. Now, as the program progresses, we can add objects into the right layer.</p>
<p>Here, we've added some <span class="cjs-line 17">containers</span> to the stage, and <span class="cjs-line 23 24 25">passed those containers into the various functions that add our objects</span>. Now, although <span class="cjs-line 36 41 52">our functions are unchanged</span> from the previous example, we have our clouds correctly added to the middle layer.</p>
<h3>Example 2: Caching & Performance</h3>
<p>In many games, we use a board or background that we don't want to have move every frame. For example, we might have a scorecard that we put some text objects on, or a game where you have a few animated actors on a still background. We'll look at a dummy minesweeper game with two blue bars that track the mouse.</p>
<iframe id="mines-1" class="iframe-player" data-code-source="~/2-0 Minesweeper" width="320" height="320" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('mines-1', '~/2-0 Minesweeper');">play</button>
		<button onclick="createjsExamples.stop('mines-1');">stop</button>
		<button onclick="createjsExamples.show('mines-1', '~/2-0 Minesweeper');">code</button>
	</div>
<p>To build an example that stresses our computer a little, we'll make a simple game of minesweeper with each tile as an image object. Our play-field is <span class="cjs-line 22">40² tiles</span>, so we'll have 1600 objects to play around with. We'll lay some <span class="cjs-line 38 39">blue bars</span> on top to provide interactivity for the demo.</p>
<p>If we play the example and open up our task manager, or shift-esc on Chrome, we can see that the game is taking up more CPU than it should be. (It uses about 90% here, and lags like crazy.) CreateJS is geared towards creating fully dynamic scenes, so unless we explicitly tell it that it can cache an object, it will render that object to canvas each frame. As a result, our simple game has to draw 1600 objects <span class="cjs-line 53">50 times a second</span>.</p>
<iframe id="mines-2" class="iframe-player" data-code-source="~/2-1 Minesweeper" width="320" height="320" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('mines-2', '~/2-1 Minesweeper');">play</button>
		<button onclick="createjsExamples.stop('mines-2');">stop</button>
		<button onclick="createjsExamples.show('mines-2', '~/2-1 Minesweeper');">code</button>
	</div>
<p>To fix this, we'll <span class="cjs-line 20">cache the background layer</span> that is holding the tiles. Now, when we go to draw a frame to screen, we'll just draw three objects – the background, and the two blue bars on top of it. However, we will need to refresh our cache when it goes stale. The cash starts empty, so we'll add <span class="cjs-line 31">a refresh call when we've loaded the tile image we need to update it</span> on line 31. The only time the player will invalidate the cash is when they click on a tile, so we'll add in a similar call to <span class="cjs-line 37">refresh the cache when the tile's "clicked" image is ready to be drawn</span>. (If we had used <a href="https://www.createjs.com/#!/PreloadJS">PreloadJS</a>, we wouldn't have to wait to update the cache here.)</p>
<p>Now, making sure we stop the first example before measuring the CPU usage of the second, we find that our game only uses a little bit of our available CPU. My edition of Chrome reports about 15% usage, and I don't experience the lag that the first version had.</p>
<p>Many older games drew the mouse cursor on screen in the manner we draw the blue bars here. This was because the common operating systems at the time could only render a simple black-and-white image as a custom cursor. This introduced around one to three frames of delay between moving the mouse and seeing the results, depending on how many steps the rendering pipeline was. This was barely noticeable when the game ran fast, but when you dipped down into 20 or 30 fps moving the mouse became a bit of a speculative operation. Today, most everything (including Javascript, via CSS) supports full-colour custom cursors.</p>
<em>
<p>Update: Sebastian DeRossi, from the CreateJS team, has sent me a reworked version previous minesweeper example!</p>
<iframe id="mines-3" class="iframe-player" data-code-source="~/2-2 Minesweeper Remastered" width="320" height="320" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('mines-3', '~/2-2 Minesweeper Remastered');">play</button>
		<button onclick="createjsExamples.stop('mines-3');">stop</button>
		<button onclick="createjsExamples.show('mines-3', '~/2-2 Minesweeper Remastered');">code</button>
	</div>
<p>
To be honest, it has been about half a year since I wrote this and he replied and I got around to trying to figure out what was happening. I don't really know what to make of this, code-wise…
<img class="emote" src="/images/wesnoth icons/icon_pensive.gif">
It's a remarkably different way to do things, and probably quite a bit more robust!
</p>
</em>
<h3>Example 3: Resizing</h3>
<p>A proper web-based game ought to be able to resize gracefully with the browser, especially on mobile where a game might be flipped around as the device rotates.</p>
<p>Here, <span class="cjs-line 45 58">we'll draw a rotating circle</span>. We'll be able to see the redraw area, and any extra logic frames that are caused by our changes. If we drag the corner, we can see a bit of lag and flickering as the <span class="cjs-line 68">resizing logic</span> clears the canvas before a repaint occurs. There is a bit of messiness surrounding the resizing, because there is no event fired when a DOM element changes size.</p>
<iframe id="resize-2" class="iframe-player" data-code-source="~/3-1 Resize" width="300" height="250" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('resize-2', '~/3-1 Resize');">play</button>
		<button onclick="createjsExamples.stop('resize-2');">stop</button>
		<button onclick="createjsExamples.show('resize-2', '~/3-1 Resize');">code</button>
	</div>
<p>To get rid of the resizing flicker, we just have to re-render the stage when the element is resized. This is easily accomplished by <span class="cjs-line 64">a single call to the stage's update method</span> on line 64.</p>
<h3>Example 4: Working with the DOM</h3>
<p>When making an HTML5 game, it is a good idea to actually use traditional HTML5 to lay out the interface for your game. Layout is, after all, what HTML5 was born for.</p>
<iframe id="DOM-1" class="iframe-player" data-code-source="~/4-0 DOM Interface" width="300" height="200" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('DOM-1', '~/4-0 DOM Interface');">play</button>
		<button onclick="createjsExamples.stop('DOM-1');">stop</button>
		<button onclick="createjsExamples.show('DOM-1', '~/4-0 DOM Interface');">code</button>
	</div>
<p>In this example, we'll use the titular character from <a href="https://www.frogatto.com/">Frogatto & Friends</a>, and display a small interactive message.</p>
<p><span class="cjs-line 72">When our character is clicked on</span>, <span class="cjs-line 77">we register an event handler for the mouse move event</span> so we can drag Frogatto around. When that triggers, we <span class="cjs-line 81">draw him</span> and then <span class="cjs-line 80">recalculate the position of the speech bubble</span>. (If we don't do both these at once, it will look strange as the speech bubble will move across the screen at a higher framerate than Frogatto will.) To extract the positioning information for the HTML speech bubble, we'll use <span class="cjs-line 95">the player's localToGlobal function</span> and specify an offset for the speech bubble to be at.</p>
<h3>Example 5: Reading from Canvas</h3>
<p>While CreateJS is nice, sometimes you want to "drop down to the wire"… so to speak… and work with the raw canvas itself. CreateJS imposes some restrictions on how we can do this – we can't just interject arbitrary commands into our drawing chain. We can, however, read from or write to a cached canvas. In the following example, we'll write a minimalistic game to use as the seed data, and then write a droplet pixel effect in Javascript.</p>
<iframe id="pixel-1" class="iframe-player" data-code-source="~/5-0 Pixel Effects" width="346" height="274" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('pixel-1', '~/5-0 Pixel Effects');">play</button>
		<button onclick="createjsExamples.stop('pixel-1');">stop</button>
		<button onclick="createjsExamples.show('pixel-1', '~/5-0 Pixel Effects');">code</button>
	</div>
<p>To put together our scene, <span class="cjs-line 10 21">we'll define a forest background via CSS</span> because it is very simple to do it that way. We also <span class="cjs-line 12">position the game canvas on top of everything else</span>, because we want to be able to put some lighting effects over our droplet output.</p>
<p>After we set up our stage, the next segment of our program defines the CreateJS spritesheet that we'll use as our player. We then <span class="cjs-line 68">create a new player object itself from the spritesheet</span>.</p>
<p>On line 74, we have <span class="cjs-line 74">a function that describes, in the form f(<em>x</em>), the lowest point <em>y</em> we can be at</span>. When we move Frogatto, we <span class="cjs-line 85">use this to make sure he's never lower than the ground</span>. The <span class="cjs-line 95">key down</span> and <span class="cjs-line 115">key up</span> event listeners set velocity and orientation of the player.</p>
<p>Now that we have our minimalistic platformer up and running, we'll add a pixel effect to the black bit underneath our feet. This is covered by <span class="cjs-line 22">the second canvas</span>, and won't use CreateJS.</p>
<iframe id="pixel-2" class="iframe-player" data-code-source="~/5-1 Pixel Effects" width="346" height="274" scrolling="no"></iframe>
	<div class="iframe-player-buttons">
		<button onclick="createjsExamples.play('pixel-2', '~/5-1 Pixel Effects');">play</button>
		<button onclick="createjsExamples.stop('pixel-2');">stop</button>
		<button onclick="createjsExamples.show('pixel-2', '~/5-1 Pixel Effects');">code</button>
	</div>
<p>Here, we've added <span class="cjs-line 123">a section of Javascript to the end of our file</span>. Every five frames <span class="cjs-line 131">it copies the last line of our CreateJS-controlled canvas to the first line of the background canvas</span>. We can read from any cached object in CreateJS this way. The stage itself is always cached to canvas, since that is what is displayed on screen.</p>
<p>This appears to work as it should. The next bit… not so much. While it still runs and demonstrates the point of the tutorial, it does not do so <em>correctly</em>, and I can't figure out why. When I run the program, I see some blooms of colour coming in from the bottom of the image – but there should be nothing of interest seeded there. (It's also rather slow, so no <a href="https://www.wab.com/" class="external">street cred</a> for me in that department either.)</p>
<p>Due to the highly repetitive, cpu-bound nature of the shader effect, I've pulled out many variables for caching and ease of manipulation. Of particular note is <span class="cjs-line 139">the dataSize variable</span>, which ensures we don't have to <span class="cjs-line 151">look up an expensively-derived length property in an important loop</span>.</p>
<p>There are a few options when it comes to looping over an array in Javascript. In order of speed, from slowest to fastest: array.map → array.forEach → reversed for-loop → for-loop. However, I advise using map and forEach when possible, because there are less moving parts to mess up compared to a for-loop.</p>
<p>The way <span class="cjs-line 154">our pixel effect</span> works is fairly simple, in theory. In the typed array that contains our image data, we have each channel of each pixel of each line of our image, all one after the other. Our code here looks forward/back one row, then one pixel, and then both. It takes the maximum value it finds. It then subtracts 2 from that value, to make our effect disappear after a while. The result is written to a new array so it doesn't interfere with calculating the next pixel. This doesn't wrap around to 255 after 0, because we are writing to a <a class="cjs-line 142 external" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays#Typed_array_subclasses">Uint8ClampedArray</a>. Since Javascript lets us read from outside the defined array, our code will simply fail for the first and last lines, returning NaN to the Uint8ClampedArray. This is converted to 0, so the first and last rows of our image will be black.</p>
<h3>Afterword</h3>
<p>I hope this provides some examples of good architecture in CreateJS. In some cases, I've chosen simplicity over correctness. I feel this is an acceptable trade-off, because it is much easier to correct something in-place than it is to rearchitect it. Good luck with your project!</p>
<!-- /Replace this with the last element in the article, when we've written it. -->
<span data-code-viewer-scan='end'></span>
