`
${include('site shell intro.html.frag.js', {
	title: 'Gallery',
	header: {
		badge: 'images/icons/work.svg',
		titleImg: 'images/text-gallery.png',
		titleAlt: 'gallery',
	},
	additionalHeadFields: [
		`<link href='css/gallery.css' rel='stylesheet'>`,
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/gallery-rss-feed.xml" />`,
	],
})}${''/*Note: We have an easter egg in this footer, so just leave everything properly indented here.*/}
				<!-- FROGATTO -->
				<!-- Oh, wouldn't it be nice to be able to define a height variable here… but can't do that. -->
				<section>
					<a href="https://www.frogatto.com/"><img class="cover left" src="images/gallery/frogatto forest-crossroads (small).png"></a>
					<h2>Frogatto &&nbsp;Friends</h2>
					<p>A beautiful 2D platformer game I have been working on since 2009 with Lost Pixel. You can buy it on <a href="https://www.frogatto.com/">Frogatto.com</a> for $9.99. <a href="https://en.wikipedia.org/wiki/Digital_rights_management">DRM</a>-free. 10+ hours of gameplay. No internet connection required. Hand-pixelled artwork. Family-friendly. Source available on <a href="https://github.com/frogatto/frogatto/">github</a>, coming soon to Steam!</p>
				</section>
				<hr>
				
				<!-- Krontech Chronos -->
				<section>
					<a href="https://www.krontech.ca/"><img width=300 height=300 class="cover right" src="images/gallery/chronos-2.png"></a>
					<h2>Chronos UI & Web API</h2>
					<p>Between 2018 and 2020 I worked on the Chronos High-Speed Camera, from <a href="https://krontech.ca">Kron Technologies</a>. Among other jobs, I redesigned the camera's UI and added a remote-control web API to it. The update was generally well-received, and can be applied to your camera by following the instructions on <a href="http://forum.krontech.ca/index.php?topic=531.msg2999#msg2999">the forum release thread</a>.</p>
					<p>A picture of <a href="images/gallery/chronos-1.png">the new UI</a> is also available. (Compare with this screen from <a href="images/gallery/chronos-3.png">the original one</a>.)</p>
					<p>I also worked on the Chronos Ring, a loop of 100 cameras, as seen on <a href="https://www.youtube.com/watch?v=qPvpl91jIvc">Beyond the Press</a>.
				</section>
				<hr>
				
				<!-- CANDY CRUNCH -->
				<script src='https://code.jquery.com/jquery-2.0.0.min.js'></script>
				<section>
					<!-- Measured width/height is 641, 643. Half that is 320, 321. We have two margins, so half that is 160/161. Margin right is +2ex. -->
					<iFrame class='cover left' height='643' id='candy-crush' src='Candy Crunch/minimal.html' style='-webkit-transform:scale(0.5,0.5); transform:scale(0.5,0.5); margin-left:-161px; margin-right:-150px; margin-top:-161px; margin-bottom:-161px; max-width:200%;' width='641'></iFrame>
					<h2>Candy Crunch</h2>
					<p>Over the course of two weeks in the spring of 2013, I was commissioned by a company called <a href="https://ayogo.com">Ayogo</a> to program a match-3 game. Candy Crunch was the outcome. Match more than three candies together to score a bonus. There is also a <a href="Candy Crunch/index.html">double-sized version</a>. You can <button onclick="$('#candy-crush')[0].contentWindow.location.reload()">restart</button> the game.</p>
				</section>
				<hr>
				
				<!-- CUBE TRAINS -->
				<section>
					<a href="cube trains/index.html"><img class="cover right" src="images/gallery/cube trains.jpeg"></a>
					<h2>Cube Trains</h2>
					<p>A 3D puzzle game with a train theme, which I made over the course of 2011. It features roughly a dozen puzzles of varying difficulty, and has an expansion pack which grants 11 more. While I considered it rather nice, it was a commercial failure. Comes with editor & player. Code on <a href="https://github.com/DDR0/Cube_Trains">Github</a>. No digital rights management software included.</p>
				</section>
				<hr>
				
				<!-- OPEN PIXEL PLATFORMER -->
				<section>
					<a href="https://github.com/DDR0/open_pixel_platformer"><img class="cover left" src="images/gallery/open platformer project jungle test level mod.png"></a>
					<h2>Open Pixel Platformer</h2>
					<p>This project aims to make a free, open-source platformer for coders and artists to use as a resource. I lead the programming side of the project. Code on <a href="https://github.com/DDR0/open_pixel_platformer">Github</a>. Discussion is at a <a href="https://www.pixeljoint.com/forum/forum_topics.asp?FID=23">sub-forum on PixelJoint</a>.</p>
				</section>
				<hr>
				
				<!-- CITYECHO -->
				<section>
					<img class="cover right" width=300 height=300 src="images/gallery/cityecho.png">
					<h2>Cityecho</h2>
					<p>An old startup I cofounded, to try to improve the rental market in Vancouver. The idea was that, if folk could get together and find roommates more easily, then they could split larger houses than they do now and everyone would have to pay less in aggregate. This did not pan out, as we failed to bootstrap the project and a late pivot into rental payment did not work either.</p>
				</section>
				<hr>
				
				<!-- ComeFrom 2 -->
				<section>
					<a href="https://ddr0.github.io/side projects/cfl"><img class="cover left" style="width:126.5px" src="images/gallery/cfl.png" alt="
					program:
					10 #0
					20 comefrom 120
					30 +
					40 #1
					50 dup
					55 dup
					60 <
					70 #10
					80 drop
					100 comefromif 75
					120 drop
					130 comefrom 90
					145 drop
					opStack:
					[]
					stack:
					[1,2,2,2]
					"></a>
					<h2>ComeFrom 2</h2>
					<p>ComeFrom 2 is an esoteric language which explores the implications of only being able to COMEFROM lines, not GOTO them. Since no stupid idea is any use if it's not accessible, an <a href="https://ddr0.github.io/side projects/cfl/">online IDE</a> is available. Be sure to run the 'Counting Up to Ten' program! For a more detailed explanation and introduction, see the <a href="https://esolangs.org/wiki/ComeFrom2">esolangs.org page</a>.</p>
					<p>ComeFrom's real coup de grâce, however, is the <em>conditional</em> comefrom. By examining the top variable on the stack, we eliminate the need for if-based conditionals and loops entirely.</p>
				</section>
				<hr>
				
				<!-- EDITABLED -->
				<section>
					<iFrame class='cover right' height='300' id='editabled' onclick="$('#editabled')[0].focus()" src='editabled/fullscreen.html' width='400'></iFrame>
					<h2>Editabled</h2>
					<p>A pixel editor demo. You can draw sharp lines on it with your mouse and move around with the arrow keys. (Hold alt and click on the example to grant it keyboard focus.) Infinite scroll in any direction. Features a multi-threaded compositing engine. You can <button onclick="var e = $('#editabled')[0]; e.src = e.src; //Basically, we're not allowed to reload the window content here because it's not of this domain. Perhaps we should, uh, make it so.">clear</button> the canvas if you've messed up, since there is no ereaser yet. There is a <a href="editabled/fullscreen.html">full-page version</a>.</p>
				</section>
				<hr>
				
				<!-- CANVASGAME -->
				<section>
					<a href="https://ddr0.github.io/side%20projects/canvasgame.html"><img class="cover left" style="width:176.5px;" src="images/gallery/html game.gif"></a>
					<h2>canvasgame</h2>
					<p><a href="https://ddr0.github.io/side%20projects/canvasgame.html">canvasgame</a> is a demo two-player game, written in Javascript. It was written in one day to learn how to make an HTML5 game. Controls: a/e to move and o to fire missile for player 1, numpad 4/6 to move and 5 to fire area bomb for player 2.</p>
				</section>
				<hr>
				
				<!-- MISCELLANEOUS -->
				<p>
					Minor Links & Side Projects:
					<ol>
						<li><a href="/side projects/$⌚">money calculator</a></li>
						<li><a href="/side projects/colour">light painting tool</a></li>
						<li>accessible D&D dice roller: <a href="/d">d</a> or <a href="/🎲">🎲</a>. (Version history: <a href="/⚀">⚀</a>, <a href="/⚁">⚁</a>.)</li>
						<li><a href="/side projects/reminder">periodic reminder tool</a></li>
					</ol>
					
					See also: <a href="/files/personal/resume.pdf">my resume</a>.
				</p>
				<p>Questions? Comments? I like <a href="contact.html">hearing</a> from people.</p>
			</div>
		</div>
		<footer> ${''/*Note: We have an easter egg in this footer, so we can't just paste in the standard footer fragment.*/}
			Site ©2020 David Roberts.
			<a href='#' onclick='window.city.toggleVisibility()' style='float: right; margin-right: 20%;'>
				<img src='images/easter-egg pull.svg'>
			</a>
			<canvas height='0' id='background-city' width='0'></canvas>
			<script src='https://code.createjs.com/preloadjs-0.3.0.min.js'></script>
			<script src='background-town/setup.js'></script>
		</footer>
	</body>
</html>
`