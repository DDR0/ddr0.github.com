const parseFileName = RegExp.prototype.exec.bind(/(?<number>\d*)\.(?<title>[\w-]*)\.(?<ext>html\.frag(?:.js)?)/)
const parsePostContent = RegExp.prototype.exec.bind(/^`?\s*?<!--(?<metadata>(?:.|\n)*?)-->\n?(?<content>(?:.|\n)*)/)

const genpost = file => {
	const match = parseFileName(file)
	
	const postContent = parsePostContent(
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
	if(!postContent) {
		throw new Error(`Could not find metadata block in ${match.input}.`)
	}
	const metadata = new Map(
		postContent.groups.metadata
			.replace(/\\,/g, '\uF000').replace(/\\:/g, '\uF001') //Backslash escapes for structural characters. (Use private-range characters for this, since we shouldn't be publishing those anyway.) Shoulda just used JSON. :p
			.split(',').map(s=>s.split(':').map(s=>s
				.replace(/\uF000/g, ',').replace(/\uF001/g, ':')
				.trim() ))
	)
	if(!metadata.get('published')) {
		console.error('metadata:', metadata)
		throw new Error(`Could not find published date metadata in ${match.input}.`)
	}
	if(!metadata.get('title')) {
		metadata.set('title', match.groups.title.replace(/_/g, ' '))
	}
	
	return `
		${'\t'+indent(3, `
			<h2 id="${match.groups.title.replace(/_/g, '-').toLowerCase()}">
				<a href="/blog-posts/${file.slice(0, file.endsWith(".js")?-13:-10)}">${metadata.get('title')}</a>
			</h2>
		`)}

		${postContent.groups.content}
		
		${indent(4, metadata.get('tags')
			? `<span class="tags">tags: ${
				indent(4, metadata.get('tags').split(' ').map(tag => `
					<a href="/blog-posts/tags#${tag}">${tag.replace(/-/g, ' ')}</a>
				`.trim()).join(', '))
			}</span>`
			: `<!-- this post is untagged -->`
		)}
	`
}

;`
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
			.map(genpost)
			.join('\n\n\n\n\n\n<hr>\n\n\n\n\n\n')
	)
	
}
${paste('site shell outro.html.frag')}
`