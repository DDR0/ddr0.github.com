#!/usr/bin/env node
"use strict"

/* Compile script for ddr0.ca's blog.
	
	It looks at the html files in ~/blog-posts/* and creates individual blog
	post pages. This is not a template script because it renders out multiple
	pages, not just one. We *could* abuse a template script (probably
	blog.html.js) to do this, but I think it's better to have a proper, stand-
	alone script to deal with the problem.
	
	This script can be run manually, but it is primarily intended to be used
	by the makefile.
*/

const fs = require('fs')
const render = require('./render-file.node.js')

const parseFileName = RegExp.prototype.exec.bind(/(?<number>\d*)\.(?<title>[\w-]*)\.(?<ext>html\.frag(?:.js)?)/)
const parsePostContent = RegExp.prototype.exec.bind(/^`?\s*?<!--(?<metadata>(?:.|\n)*?)-->\n?(?<content>(?:.|\n)*)/) //Look for leading comment. This is where metadata lives. xattrs was another plausible home for it, but sych issues were brutal there.
const extractHeaderText = RegExp.prototype.exec.bind(/<h2.*?><a.*?>(?<text>.*?)<\/a><\/h2>/)
const dump = (...args) => (console.error.apply(console, args), args.slice(-1)[0])

const tags = new Proxy(new Map(), {
	get: (target, name) => {
		if(name in target) {
			if(target[name].bind) {
				return target[name].bind(target)
			}
		} else if (target.has(name)) {
			return target.get(name)
		} else {
			return target.set(name, []).get(name)
		}
	}
})


const metadataEntries = []

fs.readdirSync('blog-posts')
	.sort()
	.map(parseFileName)
	.filter(m=>m) //Remove nulls, which didn't match the regex.
	.reduce(
		(out, match) => //Remove duplicate entries.
			!out.length
			? [match]
			: out[out.length-1].groups.number === match.groups.number
				? out
				: out.concat([match]),
		[]
	)
	.forEach(match => {
		const postContent = parsePostContent(
			match.groups.ext.endsWith('.js')
				? render(`blog-posts/${match.input}`, {
					page: match.input.slice(0,-8), 
					postFolder: `/blog-posts/${match.input.slice(0,-13)}`, //-13: Get rid of ".html.frag.js".
				})
				: fs.readFileSync(`blog-posts/${match.input}`, {encoding:'utf8'})
					.replace(/~&/g, `${match.input.slice(0,-5)}`) //~& is "this file", used to reference the blog post from the blog main page.
					.replace(/~\//g, `${match.input.slice(0,-10)}/`) //Get rid of ".html.frag".
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
		metadata.set('number', match.groups.number)
		metadata.set('title', match.groups.title.replace(/_/g, ' '))
		
		const outfile = `${match.groups.number}.${match.groups.title}.html`
		metadata.set('file', outfile)
		
		const header = extractHeaderText(postContent.input)
		if (!header) { throw new Error(`Could not find header in ${match.input}.`) }
		metadata.set('header', header.groups.text)
		
		fs.writeFileSync(
			`blog-posts/${outfile}`,
			render('blog-posts/single-post.html.template.js', {
				'file': `blog-posts/${match.input}`, 
				metadata,
				content: postContent.groups.content,
				page: 'single-post.html.template.js',
			})
		)
		
		metadataEntries.push(metadata)
		metadata.get('tags') && metadata.get('tags').split(' ')
			.map(s=>s.trim())
			.filter(tag=>tag)
			.forEach(tag=>tags[tag].push(outfile))
	})

fs.writeFileSync(
	'blog-posts/tags.html',
	render('blog-posts/tags.html.template.js', {tags, page:'tags.html.template.js'})
)

fs.writeFileSync(
	'blog-rss-feed.xml',
	render('blog-rss-feed.xml.js', {entries: metadataEntries})
)