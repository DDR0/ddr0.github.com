`
${include('site shell intro.html.frag.js', {
	title: 'Tags',
	header: {
		badge: 'images/icons/page.svg',
		titleImg: 'images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
	],
	...global,
})}
${indent(4, `
	<h2>Tags</h2>
	<code>
		${indent(2, 
			JSON.stringify(tags, undefined, '\t')
		)}
	</code>
`)}
${paste('site shell outro.html.frag')}
`