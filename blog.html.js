`
${include('site shell intro.html.frag.js', {
	title: 'Blog',
	header: {
		badge: '/images/icons/page.svg',
		titleImg: '/images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
		`<link href='/css/blog.css' rel='stylesheet'>`,
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/blog-rss-feed.xml" />`,
		`<link href='/css/prism-okaidia.css' rel='stylesheet'>`,
		`<script async defer src='/scripts/unindent-code-blocks.js'></script>`,
	],
})}
${
	indent(4,
		require('fs').readdirSync('blog-posts')
			.filter(file=>/\.html\.frag(?:\.js)?$/.test(file))
			.sort().reverse()
			.map(file =>
				file.endsWith('.js')
					? render(`blog-posts/${file}`, {
						page: `/blog-posts/${file.slice(0,-8)}`, 
						postFolder: `/blog-posts/${file.slice(0,-13)}`, //-13: Get rid of ".html.frag.js".
					})
					: paste(`blog-posts/${file}`) //Replace any references to ~/ with the proper path, since we're moving the files around - the blog posts are *included* in /index.html, but they expect to be in /blog-posts/*.html. Then, unescape ~\/ to ~/ so we can still have that.
						.replace(/~&/g, `blog-posts/${file.slice(0,-5)}`) //~& is "this file", used to reference the blog post from the blog main page.
						.replace(/~\//g, `blog-posts/${file.slice(0,-10)}/`) //Get rid of ".html.frag".
						.replace(/~\\\//g, '~/')
			)
			.join('\n\n\n\n\n\n<hr>\n\n\n\n\n\n')
	)
	
}
${paste('site shell outro.html.frag')}
`