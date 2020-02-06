`
${include('site shell intro.html.frag.js', {
	title: 'Gallery',
	header: {
		badge: 'images/icons/work.svg',
		titleImg: 'images/text-gallery.png',
		titleAlt: 'gallery',
	},
	additionalHeadFields: [
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/gallery-rss-feed.xml" />`,
	],
})}${''/*Note: We have an easter egg in this footer, so just leave everything properly indented here.*/}
				<!-- Nothing here, let the background show through! -->
				
				<script src='https://code.jquery.com/jquery-2.0.0.min.js'></script>
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