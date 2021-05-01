const capreq = (metadata.get('capreq')||'').split(',').map(e=>e.trim())

;`
${include('site shell intro.html.frag.js', {
	title: metadata.get('title'),
	header: {
		badge: '/images/icons/page.svg',
		titleImg: '/images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
		`<link href='/css/blog.css' rel='stylesheet'>`,
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/blog-rss-feed.xml" />`,
		... !capreq.includes('prism') ? [] : [
			`<link href='/css/prism-okaidia.css' rel='stylesheet'>`,
			`<script async defer src='/scripts/unindent-code-blocks.js'></script>`,
		],
	],
	...global,
})}
${indent(4, `<h2><a href="/${file.slice(0, file.endsWith(".js")?-13:-10)}">${metadata.get('title')}</a></h2>`)}

${indent(4, content)}

${indent(4, metadata.get('tags')
	? `<span class="tags">tags: ${
		metadata.get('tags').split(' ').map(tag =>
			`<a href="/blog-posts/tags#${tag}">${tag.replace(/-/g, ' ')}</a>`
		).join(', ')
	}</span>`
	: `<!-- this post is untagged -->`
)}

${paste('site shell outro.html.frag')}
`