fs = require('fs')

;`
${include('site shell intro.html.frag.js', {
	title: 'Blog',
	header: {
		badge: 'images/icons/page.svg',
		titleImg: 'images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
		`<link href='css/blog.css' rel='stylesheet'>`,
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/blog-rss-feed.xml" />`,
	],
})}
${
	indent(4,
		fs.readdirSync('Blog Posts')
			.filter(file=>file.slice(-5)==='.html')
			.sort().reverse()
			.map(file =>
				paste(`Blog Posts/${file}`) //Replace any references to ~/ with the proper path, since we're moving the files around - the blog posts are *included* in /index.html, but they expect to be in /Blog Posts/*.html. Then, unescape ~\/ to ~/ so we can still have that.
					.replace(/~\//g, `Blog Posts/${file.slice(0,-5)}/`)
					.replace(/~\\\//g, '~/')
			)
			.join('\n\n\n\n\n\n<hr>\n\n\n\n\n\n')
	)
	
}
${paste('site shell outro.html.frag')}
`