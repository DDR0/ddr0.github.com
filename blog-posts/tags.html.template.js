`
${include('site shell intro.html.frag.js', {
	title: 'Tags',
	header: {
		badge: '/images/icons/page.svg',
		titleImg: '/images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
		`<link href='/css/blog.css' rel='stylesheet'>`,
		`<link href='/css/tags.css' rel='stylesheet'>`,
	],
	...global,
})}
\t${indent(3, `
	<h2><a href="${page.split('.template.js')[0]}">Tags</a></h2>
	${Array.from(tags.entries()).sort().map(([name,posts])=>`
	<section>
		<h3 id="${name}"><a href="#${name}">${name.replace(/-/g, ' ')}</a></h3>
		${
			posts.map(post=>`<a href=${post}>${
				post.split('.')[1].replace(/_/g, ' ')
			}</a>`).join(',\n\t\t')
		}
	</section>
	`).join('')}
`)}
${paste('site shell outro.html.frag')}
`