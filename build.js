#!/usr/bin/env node
"use strict"

/* Remakable - the compile script for ddr0.ca!
	
	Largely reimplements grunt/gulp/whatever, but
	poorly. Learning! \o/
*/

const fs = require('fs').promises
const {watch} = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const {exit, stdout} = require('process')

const MAX_SUBPROCESS_RUN_TIME_MS = 2000
const REPEAT_BUILD_DEBOUNCE_MS = 10

const HELP_MESSAGE = `build.js: Compile ddr0.ca.

Options:
	--dot: Don't build, but output a graph of what would be built on stdout.
	       Useful with imagemagick as ./build.js -dot | dot -Tsvg | display
	--full-rebuild: Force recompile everything.
	--help: Show this message and exit.
	--print-events: Debug file events detected by --watch.
	--show-task[s][=task-name]: Print information and status of build steps.
	--watch: Watch for task changes. (Will [1mnot[0m reload the build script.)
`

const dump = (...args) => (console.info(...args), args.at(-1))



const scanTree = async path => {
	const names = await fs.readdir(path)
	const directoryContents = (await Promise.all(
		names.map(name => fs.lstat(`${path}/${name}`, {bigint:true})))
	).map((entry, i) => (entry.name=names[i], entry))
	
	//Filter out hidden and non-normal files, we don't want to watch .git or a fifo or anything.
	const filesAndFolders = directoryContents.filter(entry =>
		(!entry.name.startsWith('.')) 
		&& (entry.isDirectory() || entry.isFile())
	)
	
	const subfolders = (
		await Promise.all(filesAndFolders
			.filter(entry => entry.isDirectory())
			.map(entry => scanTree(`${path}/${entry.name}`))
		)
	).flat()
	
	const files = filesAndFolders
		.filter(entry => entry.isFile())
		.map(entry => ({
			name: `${path}/${entry.name}`,
			date: entry.mtimeMs,
			//toString: ()=>`${entry.name}@${entry.mtimeMs}`,
		}))
	
	return [...subfolders, ...files]
}



const findTasks = allFiles => {
	const filter = pattern =>
		allFiles.filter(
			pattern instanceof RegExp
				? (file => pattern.test(file.name))
				: (file => pattern === file.name)
		)
	
	const replace = (files, target, replacement) =>
		files.map(file =>
			file.name.replace(target, replacement)
		).map(path =>
			allFiles.find(file => file.name === path) || {
				name: path,
				date: 0,
			}
		)

	const tasks = []
	const addTask = task => {
		if(task.input.length < 1) throw new Error('Task missing input file.')
		if(task.output.length < 1) throw new Error('Task missing output file.')
		if(!task.command instanceof Function) throw new Error('Task missing run command.')
		if(!task.name) throw new Error('Task missing name.')
		for (let file of task.input) {
			if(task.output.includes(file)) throw new Error(`Task input in output. ("${file.name}" found in both.)`)
		}
		
		tasks.push(task)
	}
	
	
	let input, output, deps
	
	//Main HTML Files
	deps = [
		...filter(/^\.\/[^/]*?\.html\.frag$/),
		...filter(/^\.\/[^/]*?\.html\.frag\.js$/),
		...filter(/^\.\/compile-template.node.js$/),
		...filter(/^\.\/render-file.node.js$/),
	]
	
	for(input of filter(/^\.\/[^/]*?\.html\.js$/)) {
		output = replace([input], 'html.js', 'html')
		
		//Blog is assembled from more parts.
		const blogPosts = input.name === './blog.html.js'
			? filter(/^\.\/blog-posts\/[^/]*?\.html\.frag(?:\.js)?$/)
			: []
		
		addTask({
			name: 'main html',
			input: [input, deps, blogPosts].flat(),
			output,
			command: `./compile-template.node.js "${input.name}" > "${output[0].name}"`,
		})
	}
	
	//Blog HTML Files
	deps = [
		...filter(/^\.\/compile-blog\.node\.js$/),
		...filter(/^\.\/blog-posts\/single-post\.html\.template\.js$/),
		...filter(/^\.\/blog-posts\/tags\.html\.template\.js$/),
		...filter(/^\.\/site shell intro\.html\.frag\.js$/),
		...filter(/^\.\/site shell outro\.html\.frag$/),
	]
	input = [
		...filter(/^\.\/blog-posts\/[^/]*?\.html\.frag(?:\.js)?$/),
		...filter(/^\.\/blog-rss-feed\.xml\.js$/),
	]
	output = replace(input, /\.html\.frag(?:\.js)?$/, '.html')
	output = replace(output, /\.xml\.js$/, '.xml')
	input && addTask({
		name: 'blog html',
		input: [...input, ...deps],
		output,
		command: `./compile-blog.node.js`,
	})
	
	//Gallery RSS XML File (Blog RSS is compiled separately.)
	deps = [
		...filter(/^\.\/compile-template\.node\.js$/),
		...filter(/^\.\/render-file\.node\.js$/),
	]
	for(input of filter(/^\.\/gallery-rss-feed\.xml\.js$/)) {
		output = replace([input], '.xml.js', '.xml')
		addTask({
			name: 'rss xml',
			input: [input].concat(deps),
			output,
			command: `./compile-template.node.js "${input.name}" > "${output[0].name}"`,
		})
	}
	
	//Background Town's Coffeescript is no longer being maintained. It was an experiment. The outcome was that CoffeeScript has a rather error-prone syntax, and therefore isn't worth the added complexity.
	
	//LESS CSS
	for(input of filter(/^\.\/css\/.*?\.less$/)) {
		output = replace([input], '.less', '.css')
		addTask({
			name: 'css',
			input: [input].concat(deps),
			output,
			command: `node_modules/less/bin/lessc --source-map --math=strict "${input.name}" "${output[0].name}"`,
		})
	}
	
	return tasks
}



const calculateRequirements = tasks => {
	//link all tasks with pre/post-requisite tasks.
	//TODO: TEST THIS!
	for (const task of tasks) {
		task.prereqs = [];
		task.postreqs = [];
	}
		
	for (const task of tasks) {
		task.prereqs = task.prereqs.concat(...
			task.input.map(input => 
				tasks.filter(prereq => 
					prereq.output.find(output => 
						input.name == output.name ) ) ) )
		
		for (const prereq of task.prereqs) {
			prereq.postreqs.push(task)
		}
	}
}



const markOutOfDate = tasks => {
	//mark all out-of-date rules and anything which requires them as dirty
	for (const task of tasks) {
		task.dirty = false;
	}
	
	const markOutOfDate = task => {
		if (task.dirty) { return }
		task.dirty = true
		task.postreqs.forEach(markOutOfDate)
	}
	
	for (const task of tasks) {
		if (
			task.output.find(output =>
				task.input.find(input =>
					output.date < input.date ) )
		) {
			markOutOfDate(task)
		}
	}
}



const markTasksDirty = tasks => {
	for (const task of tasks) {
		task.dirty = true
		task.postreqs.forEach(markOutOfDate)
	}
}



const refreshTimestamps = async tasks => 
	Promise.all(...
		tasks.map(task =>
			task.input.map(async file => 
				file.date = (await fs.lstat(file.name, {bigint:true})).mtimeMs 
			)
		)
	)

const markFileDirty = (tasks, updatedName) => {
	for (const task of tasks) {
		if (task.input.find(file => file.name == updatedName)) {
			task.dirty = true
		}
	}
}



//Run tasks with up-to-date prerequisites.
const prereqIsDirty = task => //Returns true if prereq — or any of it's prereqs — are dirty.
	task.dirty || task.prereqs.find(prereqIsDirty)

const isRunnable = task => //Returns true if task is dirty and prerequisite tasks are clean.
	task.dirty && !task.prereqs.find(prereqIsDirty)

const runTask = async task => {
	try {
		const { stdout, stderr } = await exec(task.command, {timeout: MAX_SUBPROCESS_RUN_TIME_MS})
		
		console.log(`\x1b[32m> ${task.command}\x1b[39m`)
		stdout && console.log(stdout);
		stderr && console.error(stderr);
		
		task.dirty = false
		return await task.postreqs.filter(isRunnable).map(runTask)
	} catch (err) {
		const { stdout, stderr } = err
		
		console.log(`\x1b[31m> ${task.command}\x1b[39m`)
		stdout && console.log(stdout);
		stderr && console.error(stderr);
		throw err
	}
}



const runAllTasks = async tasks => {
	let failed = 0
	let ran = 0
	for (const run of tasks.filter(isRunnable).map(runTask)) {
		try {
			ran++
			await run
		} catch (err) {
			failed++
		}
	}
	
	if (failed) {
		console.log(`\x1b[31m${failed}/${ran} ${ran>1?'tasks':'task'} failed. Build incomplete.\x1b[39m`)
	} else if (!ran) {
		console.log(`\x1b[32mNothing to do. Build complete.\x1b[39m`)
	} else {
		console.log(`\x1b[32m${ran} ${ran>1?'tasks':'task'} ran. Build complete.\x1b[39m`)
	}
	
	return !failed
}



(async ()=>{
	if (process.argv.find(a => a.match(/^-?-?help$/))) {
		console.log(HELP_MESSAGE)
		exit(0)
	}
	
	let allFiles = await scanTree('.') //Can't do anything until we have our tree.
	let tasks = findTasks(allFiles) //Generates the list of files we work on. These are the nodes of our dependancy tree.
	calculateRequirements(tasks) //Calculate the relations between the nodes of the dependancy tree.
	process.argv.includes('--full-rebuild')
		? markTasksDirty(tasks) //Marks all tasks as needed to be run, useful when developing.
		: markOutOfDate(tasks) //Re-marks tasks as clean or dirty, useful when re-runnning.
	
	let taskToShow = ''
	let shownTasks = 0
	if (process.argv.find(a => taskToShow=a.match(/^--show-tasks?(?:=(?<name>.+))?$/))) {
		for (const task of tasks) {
			if(!taskToShow.groups.name || task.name === taskToShow.groups.name) {
				console.log(task)
				shownTasks++
			}
		}
	}
	if (taskToShow && !shownTasks) {
		console.log(`No task named ${
			taskToShow.groups.name
		} found. Available tasks:\n\t${
			Array.from(tasks.reduce((a,b)=>a.add(b.name), new Set()).keys()).sort().join('\n\t')
		}`)
		exit(-2)
	}
	
	if(process.argv.includes('--dot')) {
		stdout.write(dotify(tasks))
		stdout.once('drain', () => process.exit(0)) //Needed or else graph gets corrupted.
		return
	}
	
	if (!process.argv.includes('--watch')) {
		exit((await runAllTasks(tasks))-1)
	} else {
		console.log('Watching for changes…')
		watchForChanges(allFiles, tasks)
	}
})()


const watchForChanges = async (allFiles, tasks)=>{
	await runAllTasks(tasks)
	
	let folderFragment = /(?<folder>.+?)[^\/]+$/
	let folders = new Set()
	for (const task of tasks) {
		for (const {name} of task.input) {
			folders.add(folderFragment.exec(name).groups.folder)
		}
	}
	
	let dirChanged = false
	let fileChanged = false
	let timeout = null
	
	const watchers = Array.from(folders).map(folder =>
		watch(folder, (event, file) => {
			process.argv.includes('--print-events') && console.log({event, folder, file})
			
			if (event==='change' && file) {
				fileChanged |= true
				markFileDirty(tasks, folder+file)
			} else if (event==='change' || event==='rename') {
				dirChanged |= true
			}
			
			clearTimeout(timeout)
			setTimeout(onTimeout, REPEAT_BUILD_DEBOUNCE_MS)
		})
	)
	
	let building = false
	const onTimeout = async ()=>{
		if (building) {
			timeout = setTimeout(onTimeout, REPEAT_BUILD_DEBOUNCE_MS)
			return
		}
		
		building = true
		
		if (dirChanged) {
			watchers.forEach(watcher => watcher.close())
			
			const allFiles = await scanTree('.')
			const tasks = findTasks(allFiles)
			calculateRequirements(tasks)
			markOutOfDate(tasks)
			
			watchForChanges(allFiles, tasks)
		} else if (fileChanged) {
			dirChanged = false
			fileChanged = false
			building = true
			//refreshTimestamps(tasks)
			//markOutOfDate(tasks)
			await runAllTasks(tasks)
		}
		
		dirChanged = false
		fileChanged = false
		building = false
	}
}


const dotify = tasks => {
	const commonBuildFiles = ['./render-file.node.js', './compile-template.node.js']
	let out = ''
	
	out += `digraph G {
		label="Dependencies"
		labelloc = t
		labelfontsize = 24
		graph [rankdir=“LR”]
		#layout="sfdp"
		layout="neato"
		concentrate=true
		splines=true
		labelfloat=true
		ratio="compress"
		overlap=prism
		overlap_scaling=5
		ratio=0.7
  	`
	//style=filled, color=red
	for (let [taskNum, task] of tasks.entries()) {
		
		for (let input of task.input) {
			if (commonBuildFiles.includes(input.name)) { continue; }
			for (let output of task.output) {
				if (prereqIsDirty(task)) {
					if (isRunnable(task)) {
						out += `\tedge [color=goldenrod]\n`
					} else {
						out += `\tedge [color=red]\n`
					}
				} else {
					out += `\tedge [color=black]\n`
				}
				out += `\t"${input.name}" -> "${task.command.replace(/\"/g, '\\"')}" -> "${output.name}";\n`
			}
		}
		
		for (let file of [...task.input, ...task.output]) {
			if (commonBuildFiles.includes(file.name)) { continue; }
			out += `	subgraph cluster${taskNum} {
				label = "${task.name}";
				"${file.name}" [
					label="${file.name.split('/').slice(-1)}",
					tooltip="${file.name}",
					style=filled, fillcolor=white,
				];
				"${task.command.replace(/\"/g, '\\"')}" [
					shape=box,
					style=filled, fillcolor=lightgrey,
					label="${task.command.split(' ')[0].split('/').slice(-1)}",
					tooltip="${task.command.replace(/\"/g, '\\"')}",
				];
			}\n`
		}
	}
	
	out += `}`
	
	return out
}