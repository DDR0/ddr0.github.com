`
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta charset=utf-8>
		<title>${title}</title>
		<link href="/css/grey-and-blue.css" rel=stylesheet>
		<meta name="theme-color" content="#3377FF">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, minimum-scale=1">
		<link rel="canonical" href="https://ddr0.ca/${page.replace(/^\.\//, "").replace(/"/gu, "%22").replace(/\.html.*/u, "")}">
		${(global.additionalHeadFields||[]).join('\n\t\t')}
	</head>
	<body>
		<a href='#content' id='skip-nav'>skip nav</a>
		<div id='content-holder'>
			<div id="content-header">
				<div id='badge'>${page === 'single-post.html.template.js' || page === 'tags.html.template.js'
					? `<a href="/blog"><img alt='' src='${header.badge}'></a>`
					: `<img alt='' src='${header.badge}'>`
				}</div>
				<h1><img alt='${header.titleAlt}' src='${header.titleImg}'></h1>
				<div id='icon-bar'>
					<a href='/blog'    ${page === './blog.html.js'    ? 'class=\'selected\'' : ''}><img src='/images/icons/page.svg' ><span>blog</span></a>
					<a href='/gallery' ${page === './gallery.html.js' ? 'class=\'selected\'' : ''}><img src='/images/icons/work.svg' ><span>gallery</span></a>
					<a href='/contact' ${page === './contact.html.js' ? 'class=\'selected\'' : ''}><img src='/images/icons/chat2.svg'><span>contact</span></a>
					<a href='/rss.xml' ${''                                                      }><img src='/images/icons/rss.svg'  ><span>rss</span></a>
				</div>
			</div>
			<a name='content'></a>
			<div id='content-pane'>
`