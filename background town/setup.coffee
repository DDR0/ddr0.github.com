#compile: coffee -c -w -m \background\ town/setup.coffee 

#config
tileWidth = 36
tileHeight = 18

#globals
c = console
tileSheet=tileSheetRects=jCanvas=stage=windowMidpoint=commercialAxisIsVertical=pane=null
groundLayer=buildingLayer=null

handleComplete = ->
	jQuery.globalEval queue.getResult('_').innerHTML
	jQuery.globalEval queue.getResult('easel').innerHTML
	tileSheet = new createjs.Bitmap queue.getResult 'tiles'
	configureCanvas()
	cacheEaselValues()
	initializeCity()
	registerEvents()

queue = new createjs.LoadQueue()
queue.addEventListener("complete", handleComplete)
queue.loadManifest do (path='background town/') -> [
	{id: "_",     src: path + "underscore-min.js"}
	{id: "easel", src: path + "easeljs-0.6.0.min.js"}
	{id: "tiles", src: path + "tiles.png"}
]

configureCanvas = ->
	jCanvas = $('#background-city')
	jCanvas.css({
		position: 'absolute'
		top: 0, left: 0
		width: '100%'
		height: document.body.clientHeight + 'px'
		'z-index': -1
	}).attr({
		width: $(window).width()
		height: document.body.clientHeight
	})
	
cacheEaselValues = ->
	tileSheetRects = do (w=tileWidth, h=tileHeight) ->
		road19    : new createjs.Rectangle 0*w, 0*h, w, h
		road37    : new createjs.Rectangle 1*w, 0*h, w, h
		road79    : new createjs.Rectangle 2*w, 0*h, w, h
		road39    : new createjs.Rectangle 3*w, 0*h, w, h
		road13    : new createjs.Rectangle 4*w, 0*h, w, h
		road17    : new createjs.Rectangle 5*w, 0*h, w, h
		background: new createjs.Rectangle 0*w, 1*h, w, h
		road1379  : new createjs.Rectangle 1*w, 1*h, w, h
		road137   : new createjs.Rectangle 2*w, 1*h, w, h
		road139   : new createjs.Rectangle 3*w, 1*h, w, h
		road379   : new createjs.Rectangle 4*w, 1*h, w, h
		road179   : new createjs.Rectangle 5*w, 1*h, w, h
		dashed19  : new createjs.Rectangle 0*w, 2*h, w, h
		dashed37  : new createjs.Rectangle 1*w, 2*h, w, h
		road7     : new createjs.Rectangle 2*w, 2*h, w, h
		road9     : new createjs.Rectangle 3*w, 2*h, w, h
		road3     : new createjs.Rectangle 4*w, 2*h, w, h
		road1     : new createjs.Rectangle 5*w, 2*h, w, h
		shop      : new createjs.Rectangle 0*w, 3*h, w, h
		house     : new createjs.Rectangle 1*w, 3*h, w, h
		parkinglot: new createjs.Rectangle 2*w, 3*h, w, h
		grass     : new createjs.Rectangle 3*w, 3*h, w, h
		vacant    : new createjs.Rectangle 4*w, 3*h, w, h
		dirt      : new createjs.Rectangle 5*w, 3*h, w, h
		
		outline   : new createjs.Rectangle 6*w, 0*h, w+2, h+1 #The outline is one bigger than a tile. Special case.




# === CREATE THE CITY ===


initializeCity = ->
	stage = new createjs.Stage "background-city"
	stage.snapToPixel = true
	groundLayer = new createjs.Container();
	stage.addChild groundLayer
	groundLayer.tiles = []
	buildingLayer = new createjs.Container();
	stage.addChild buildingLayer
	buildingLayer.tiles = []
	
	pane = $ '#content-holder'
	windowMidpoint = closestTile pane.width()/2+pane.position().left, pane.height()/2+pane.position().top
	commercialAxisIsVertical = Math.random() < 0.5
	
	roadGen windowMidpoint #Defines advanceRoadTileAgent and roadTileAgents, which we can use to grow the city later.
	propertyGen knownRoadTiles, true
	setTimeout(expandRoadNetwork, 15000)
	stage.update()
	
newTile = (x, y, type) ->
	throw new Error "Tile is off grid. x:#{x} and y:#{y} should sum to an even number." if (x/2+y/2)%1
	tile = tileSheet.clone()
	tile.sourceRect = tileSheetRects[type]
	tile.tx = x; tile.ty = y; #TileX and TileY.
	tile.x = x/2*tileWidth; tile.y = y/2*tileHeight
	if type == 'outline'
		tile.x -= 1; tile.y -= 0.5 #Because FF doesn't listen to stage.snapToPixel = true
	tile.regX = tile.sourceRect.width/2; tile.regY = tile.sourceRect.height/2
	tile
	
addTile = (x, y, type) ->
	tile = newTile(x, y, type)
	tile.type = type
	groundLayer.addChild(tile)
	((groundLayer.tiles[x]?=[])[y]?=[]).push(tile)
	tile	
removeTile = (x, y, qualifier, noRemoveDependants) -> #qualifier may be a fragment of a type too. For example, to remove a road such as 'road7' or 'road179', you'd give just 'road'. If qualifier is a function, any tile that matches true will be removed.
	qualifier ?= ''
	throw new Error('TODO: Add function-based tile removal.') if typeof qualifier == "function"
	tileList = ((groundLayer.tiles[x]?=[])[y]?=[])
	tilesToRemove = tileList.filter((tile) -> -1 < tile.type.indexOf(qualifier))
	tileList      = tileList.filter((tile) -> -1 == tilesToRemove.indexOf(tile))
	tilesWithDependants = tilesToRemove.filter((tile) -> tile.dependants)
	if !noRemoveDependants and tilesWithDependants.length #This seems to be broken. Is triggering, isn't removing stuff. Removing stuff seems to be broken.
		tilesWithDependants.forEach((parentTile) -> parentTile.dependants.forEach((tile) -> removeTile(tile.tx, tile.ty, '', true)))
	tilesToRemove.map((tile) -> groundLayer.removeChild(tile))
	undefined
	
addBldg = (x, y, type) ->
	tile = newTile(x, y, type)
	tile.type = type
	buildingLayer.addChild(tile)
	((buildingLayer.tiles[x]?=[])[y]?=[]).push(tile)
	tile
removeBldg = (x, y, qualifier) -> #qualifier may be a fragment of a type too. For example, to remove a road such as 'road7' or 'road179', you'd give just 'road'. If qualifier is a function, any tile that matches true will be removed.
	qualifier ?= ''
	throw new Error('TODO: Add function-based bldg removal.') if typeof qualifier == "function"
	tileList = ((buildingLayer.tiles[x]?=[])[y]?=[])
	tilesToRemove = tileList.filter((tile) -> -1  < tile.type.indexOf(qualifier))
	tileList      = tileList.filter((tile) -> -1 == tile.type.indexOf(qualifier))
	tilesToRemove.map((tile) -> buildingLayer.removeChild(tile))
	undefined
	
printTile = (x,y,qualifier) ->
	qualifier ?= ''
	throw new Error('TODO: Add function-based print filter.') if typeof qualifier == "function"
	tileList = ((groundLayer.tiles[x]?=[])[y]?=[])
	c.log('tile @',x,y,tileList.filter((tile) -> -1  < tile.type.indexOf(qualifier)))
	undefined
	
closestTile = (x, y) -> #takes pixels, returns a *valid* grid point
	x *= 2; y *= 2
	newX = Math.round x/tileWidth
	newY = Math.round y/tileHeight
	x /= tileWidth
	y /= tileHeight
	#TODO: Test this better. Does it round on x or mid_x? Does it correct rounding right?
	if (newX/2+newY/2)%1 #Then we're in an "off" tile. See also newTile. To rectify it, we'll flip the rounding operation of the least-rounded number.
		#put a *(tileHeight/tileWidth) below?
		if Math.abs((x-newX)) > Math.abs((y-newY)) 
		then `x-newX < 0 ? --newX : ++newX`
		else `y-newY < 0 ? --newY : ++newY`
	new createjs.Point newX, newY
	
advanceRoadTileAgent=resetAgentHR=removeRetiredAgents=roadTileAgents=null
knownRoadTiles = []
addNewRoadTiles = (walked) ->
	for tile in walked
		removeTile(tile.x, tile.y, '')
		removeBldg(tile.x, tile.y, '')
		addTile(tile.x, tile.y, 'outline')
		if !(tile.connects[1] and tile.connects[9] or tile.connects[3] and tile.connects[7]) #Any road connecting opposite sides of the tile will cover all the tile, so we can skip putting a ground type beneath it.
			addTile(tile.x, tile.y, if propertyValues(tile) > 0.15 then 'grass' else 'vacant')
		addTile(tile.x, tile.y, 'road' + (tile.connects[1]*1 or '') + (tile.connects[3]*3 or '') + (tile.connects[7]*7 or '') + (tile.connects[9]*9 or ''))
	undefined
	
#replaceRoadTiles = (walked) ->
#	for tile in walked
#		if !(tile.connects[1] and tile.connects[9] or tile.connects[3] and tile.connects[7]) #Any road connecting opposite sides of the tile will cover all the tile, so we can skip putting a ground type beneath it.
#			addTile(tile.x, tile.y, if propertyValues(tile) > 0.15 then 'grass' else 'vacant')
#		addTile(tile.x, tile.y, 'road' + (tile.connects[1]*1 or '') + (tile.connects[3]*3 or '') + (tile.connects[7]*7 or '') + (tile.connects[9]*9 or ''))
#	undefined

reverse = (dir) -> {1:9,3:7,7:3,9:1}[dir]

agentHistory = [] #Agent walk tiles are recorded here. To see new tiles, clear this variable first.
agentTouched = [] #Road tiles the agent walked _through_ are recorded here.

roadGen = (startTile) -> 
	#First, generate a street grid.
	branchChance = _.random(20, 40)/100  
	branchType = _.random(10, 90)/100 #true => X, false => T
	turnChance = _.random(10, 60)/100    
	turnType = _.random(30, 70)/100 #cw vs ccw
	
	walked = [startTile.clone()]
	walked[0].connects = {}
	agents = for agentNo in [1..4] 
		name: agentNo+'a' 
		position: startTile.clone() 
		directive: [1,3,0o7,9][agentNo-1] 
		impetus: 3 
		step: 0 
		tileOn: walked[0]
	newAgents = []
	oldAgents = []
	
	crossedExistingPath = (agent) ->
		 _.find walked, (position) -> position.x == agent.position.x and position.y == agent.position.y
		 
	turnTo = (facing, turnCCW) -> {
		true: {1:7,7:9,9:3,3:1}
		false: {7:1,9:7,3:9,1:3}
		}[turnCCW][facing]
	
	walk = (agent) ->
		do (delta = `{1:{x:-1, y:+1}, //For some reason, this just confuses Coffeescript.
					  3:{x:+1, y:+1},
					  7:{x:-1, y:-1},
					  9:{x:+1, y:-1},
				}[agent.directive]`) ->
			agent.position.x += delta.x
			agent.position.y += delta.y
	
	advanceAgent = (agent) ->
		walk agent
		--agent.impetus if agent.impetus
		++agent.step
		crossedPath = crossedExistingPath agent
		if crossedPath #We should check we haven't actually started a side-by-side road, too, here. That would look like all three tiles to our left or right being occupied.
			oldAgents.push(agent) #Retire the agent. #Wait, better rule: If there is a road ahead of us, we must join up with it without turning or branching.
			agent.tileOn.connects[agent.directive] = true
			agent.tileOn = crossedPath #Update in case we don't actually remove the agent, like when we're moving it with the mouse.
			crossedPath.connects[reverse(agent.directive)] = true
			agentTouched.push(crossedPath)
		else
			agent.tileOn.connects[agent.directive] = true
			agent.tileOn = agent.position.clone()
			agent.tileOn.connects = {}
			agent.tileOn.connects[reverse(agent.directive)] = true
			walked.push agent.tileOn
			agentHistory.push agent.tileOn
			
			branch = Math.random() < branchChance and !agent.impetus
			branchDir = Math.random() < branchType
			turn = Math.random() < turnChance and !agent.impetus
			turnDir = Math.random() < turnType
			if branch and turn and !branchDir
				#Now two agents, facing away from each other.
				newAgents.push
					name: agent.name+'-'+agent.step
					position: agent.position.clone()
					directive: turnTo(agent.directive, true)
					impetus: 3
					step: agent.step
					tileOn: agent.tileOn
				agent.directive = turnTo agent.directive, false
			else if branch
				if branchDir
					newAgents.push 
						name: agent.name+'-'+agent.step+'a'
						position: agent.position.clone()
						directive: turnTo(agent.directive, true)
						impetus: 3
						step: agent.step
						tileOn: agent.tileOn
					newAgents.push 
						name: agent.name+'-'+agent.step+'b'
						position: agent.position.clone()
						directive: turnTo(agent.directive, false)
						impetus: 3
						step: agent.step
						tileOn: agent.tileOn
				else
					newAgents.push 
						name: agent.name+'-'+agent.step
						position: agent.position.clone()
						directive: turnTo(agent.directive, turnDir)
						impetus: 3
						step: agent.step
						tileOn: agent.tileOn
			else if turn
				agent.directive = turnTo agent.directive, turnDir
			agent.impetus = 3 if branch or turn
	
	resetAgentHR = -> #global fun
		oldAgents = []
		newAgents = []
	
	removeRetiredAgents = -> #global fun
		oldAgents.forEach((agent) -> agent.retired = true)
		agents = agents
			.filter((agent) -> !(agent in oldAgents))
			.concat(newAgents)
		roadTileAgents = roadTileAgents
			.filter((agent) -> !(agent in oldAgents))
			.concat(newAgents) if roadTileAgents
		
	
	for step in [1..Math.min(startTile.x, startTile.y)/2-1] #Compensate for diagonal-only walking.		
		for agent in agents
			advanceAgent(agent)
		removeRetiredAgents()
		newAgents = []
		oldAgents = []
	
	advanceRoadTileAgent = advanceAgent #Export the function and data so we can grow the city later.
	roadTileAgents = agents
	addNewRoadTiles walked
	knownRoadTiles = knownRoadTiles.concat(walked)

propertyValues = (point, y) -> #Takes a point or an x and a y value. Both are in units of 'tiles'.
	if isFinite(y)
		x = point
	else
		x = point.x
		y = point.y
	Math.abs(Math.sin(x)/2+Math.sin(y)/2)+0.1 #The implications of this are that neighbourhoods are about 7x7 tiles. Or maybe 3x3.

pointsAreEqual = (p1, p2) ->
	p1.x == p2.x and p1.y == p2.y
	
distance = (p1, p2) ->
	Math.sqrt(Math.pow(Math.abs(p1.x - p2.x), 2) + Math.pow(Math.abs(p1.y - p2.y), 2))
	
bestDirectionTo = (p1, p2) ->
	return 1 if p1.x > p2.x and p1.y < p2.y
	return 3 if p1.x < p2.x and p1.y < p2.y
	return 7 if p1.x > p2.x and p1.y > p2.y
	return 9 if p1.x < p2.x and p1.y > p2.y
	undefined
	

knownProperties = []
populateProperty = (tiles) ->
	tiles.forEach (tile) -> 
		prop = addTile(tile.x, tile.y, 'outline')
		prop = addTile(tile.x, tile.y, if propertyValues(tiles[0]) > 0.15 then 'grass' else 'vacant')
		if tile.priority == 1
			prop.dependants = tiles
	addBldg(tiles[0].x, tiles[0].y, if commercialUndesirability(tiles[0], windowMidpoint) < Math.min(windowMidpoint.x, windowMidpoint.y)*0.15 then 'shop' else 'house')
	knownProperties.push(tiles)

propertyGen = (roadTiles, exNihilo) ->
	#First, find the roadfront properties.
	relativeTile = (tile, delta) ->
		rTile = tile.clone()
		dir = {
			1: [-1, +1]
			3: [+1, +1]
			7: [-1, -1]
			9: [+1, -1] }
		rTile.x += dir[delta][0]; rTile.y += dir[delta][1]
		rTile.facing = reverse(delta)
		rTile
		
	tilesToTheSide = (tile) -> {
		1: [3,7] 
		3: [1,9] 
		7: [1,9] 
		9: [3,7]}[tile.facing].map (dir) -> relativeTile(tile, dir)
		
	validPropertyLocation = (tile, index, tileList) -> #Make sure we aren't trying to build on another property or a municipal road. It is unremittingly O(n²), but whatever. Small n, fast O.
		!(index > _.find(_.range(tileList.length),        (tIndex) -> pointsAreEqual(tile, tileList[tIndex]))) and
		(exNihilo or !(index > _.find(_.range(knownProperties.length), (tIndex) -> pointsAreEqual(tile, knownProperties[tIndex])))) and
		(exNihilo or !((groundLayer.tiles[tile.x]?=[])[tile.y]?=[]).length) and
		!(_.find(roadTiles, (road) -> pointsAreEqual(tile, road)))
		
	existingProperties = _.chain(roadTiles)
		.map( (roadTile) -> #First, figure out property fronts on the roads.
			propertyLocations = []
			propertyLocations.push(relativeTile(roadTile, 1)) if !roadTile.connects[1] and Math.random() < 0.75 #Might want to check we're not at the end of a cul-de-sac, here.
			propertyLocations.push(relativeTile(roadTile, 3)) if !roadTile.connects[3] and Math.random() < 0.75 #And perhaps a random chance element?
			propertyLocations.push(relativeTile(roadTile, 7)) if !roadTile.connects[7] and Math.random() < 0.75
			propertyLocations.push(relativeTile(roadTile, 9)) if !roadTile.connects[9] and Math.random() < 0.75
			propertyLocations
		).flatten(
		).shuffle( #Shuffle now to avoid patterns related to road building order when we filter.
		).filter( #Might be able to remove this?
			validPropertyLocation
		).map( (prop, index) -> 
			prop.front = true
			prop.address = index
			prop.priority = 1
			prop
		).map( (prop) -> #Second, try to expand property back one tile. Everyone likes a yard.
			newProp = relativeTile(prop, reverse(prop.facing))
			newProp.address = prop.address
			newProp.priority = 2
			[prop, newProp]
		).flatten(
		).map( (plot) -> #Third, expand the yards out to fill the corners.
			tilesToTheSide(plot).map( (newPlot) ->
				newPlot.address = plot.address
				newPlot.priority = 3
				newPlot
			).concat(plot)
		).flatten(
		).sortBy( 'priority'
		).filter(
			validPropertyLocation
		).groupBy( 'address'
		).values(
		).value()
		
	#c.log existingProperties
	if exNihilo
		existingProperties.forEach (prop) -> populateProperty(prop)
	else
		existingProperties.forEach((prop) -> 
			setTimeout((-> 
				validPropsNow = prop.filter(validPropertyLocation)
				if prop[0] = validPropsNow[0]
					populateProperty(validPropsNow)
					stage.tick()
			), _.random(2000,15000)))
	
commercialUndesirability = (pointA, pointB) ->
	Math.abs(pointA.x - pointB.x)/((!commercialAxisIsVertical)+1) + Math.abs(pointA.y - pointB.y)/((commercialAxisIsVertical)+1)


expandRoadNetwork = ->
	if !mouseIsActive and roadTileAgents.length
		agent = roadTileAgents[_.random(0,roadTileAgents.length-1)]
		agentHistory = []
		agentTouched = [agent.tileOn]
		#c.log('ret', agent.retired)
		_.range(_.random(1,5)).forEach( ->
			if !agent.retired
				resetAgentHR()
				advanceRoadTileAgent(agent)
				addNewRoadTiles([].concat(agentTouched, agentHistory))
				knownRoadTiles = knownRoadTiles.concat(agentHistory)
				addNewRoadTiles(agentHistory)
				propertyGen(agentHistory)
				removeRetiredAgents()
				stage.tick()
		)
		
	setTimeout(expandRoadNetwork, _.random(10000,30000))
	
	
	

# === SET UP EVENTS ===
	
	
# -- UI Events --
slideContentOut = -> #Called alternately, by way of storing one or the other in toggleVisibility.
	window.city.toggleVisibility = slideContentIn
	$('body').css({
		'pointer-events': 'none'
	}).animate({
		'margin-top': "-=#{pane.height()}"
	}, pane.height()*1.5)
	setTimeout(-> #We must wait a little bit, because something is setting the scroll to 0,0. This is bad, because it could produce a flicker.
		window.scrollTo(0, document.body.clientHeight/2-$(window).height()/2)
	10)
slideContentIn = ->
	window.city.toggleVisibility = slideContentOut
	$('body').css({
		'pointer-events': 'auto'
	}).animate({
		'margin-top': "+=#{pane.height()}"
	}, pane.height()*1.5)	
	
	
# -- User Interactions --
setMousePointer = (id) ->
	jCanvas.css({
		cursor: id
	})
	

`var swallowMouseEvent = function(evt) { //Stolen directly from Candy Crunch.
	// mouseX = evt.stageX; mouseY = evt.stageY;
	evt.nativeEvent.preventDefault();
	evt.nativeEvent.stopPropagation();
	//evt.nativeEvent.stopImmediatePropagation();
	return false;
};`

mouseIsActive = false
mouseHandlers = (->
	lastMousePos = {x:0, y:0}
	onRoadTile = onAgent = nearbyAgents = null;
	newRoadTiles = []
	changedRoadTiles = []
	spawnedAgentCount = 5;
	retireAgentMaxDistance = 4
	moved = undefined
	onMouseDown = (event) ->
		setMousePointer('pointer')
		mousePos = closestTile(event.stageX, event.stageY)
		lastMousePos = mousePos
		onRoadTile = _.find(knownRoadTiles, (tile) -> pointsAreEqual(tile, mousePos))
		moved = false
		mouseIsActive = true
		if onRoadTile
			onAgent = _.find(roadTileAgents, (agent) -> pointsAreEqual(onRoadTile, agent.tileOn))
			newRoadTiles = [] #long-term accumulators, for use in onMouseUp.
			changedRoadTiles = []
			agentHistory = [] #short-term accumulators, for use in onMouseMove. (warning: global scope, modified by advanceRoadTileAgent)
			agentTouched = [onRoadTile] #Start off with the current tile, if we're on it, because it'll need updating but the agents only record the tiles they _enter_.
		stage.tick()
		
	onMouseMove = (event) ->
		mousePos = closestTile(event.stageX, event.stageY)
		if !pointsAreEqual(lastMousePos, mousePos)
			lastMousePos = mousePos
			newOnRoadTile = _.find(knownRoadTiles, (tile) -> pointsAreEqual(tile, mousePos))
			moved = true
			if onRoadTile
				if !onAgent #Then just make a new one and add it to the queue. Otherwise, use an existing agent. This matters because we'll want to grow agents out independantly, in a while, so their state actually matters. We will, however, eliminate any near-by agents so that our roads aren't smooshed.
					#c.log('made agent')
					onAgent = {
						name: spawnedAgentCount+++'M' 
						position: new createjs.Point(onRoadTile.x, onRoadTile.y)
						directive: null #define these
						impetus: 3
						step: 0 
						tileOn: onRoadTile }
					roadTileAgents.push(onAgent)
				
				newAgentDirection = undefined
				while newAgentDirection = bestDirectionTo(onAgent.position, mousePos)
					onAgent.impetus = 1
					onAgent.impetus = Math.max(1, onAgent.impetus)
					onAgent.directive = newAgentDirection
					advanceRoadTileAgent(onAgent)
				
				addNewRoadTiles([].concat(_.last(newRoadTiles)||[], _.last(changedRoadTiles)||[], agentTouched));
				addNewRoadTiles(agentHistory);
				
				newRoadTiles = newRoadTiles.concat(agentHistory)
				changedRoadTiles = changedRoadTiles.concat(agentTouched)
				knownRoadTiles = knownRoadTiles.concat(agentHistory)
				
				if newOnRoadTile
					nearbyAgents = _.filter(roadTileAgents, (agent) -> distance(onRoadTile, agent.tileOn) <= retireAgentMaxDistance && agent != onAgent)
					onRoadTile = newOnRoadTile
					#c.log('todo: remove the current onAgent?')
				
				agentHistory = []
				agentTouched = []
			stage.tick()
			
	onMouseUp = (event) ->
		mousePos = closestTile(event.stageX, event.stageY)
		#mouseIsActive = false #OK, after the user takes control, we won't grow the roads out any more. We don't currently clean up road agents after the user, and the road agent model tends to build stupid stuff as it is anyway.
		if !moved #Disabled because we need to rejigger the road tiles when a neighbour is removed.
		#	removeTile(mousePos.x, mousePos.y)
		#	stage.tick()
		#	printTile(mousePos.x, mousePos.y)
		else
			propertyGen(newRoadTiles)
		setMousePointer('auto')
	
	{down: onMouseDown, move: onMouseMove, up: onMouseUp})()
	
		
	
# -- Do Register --
registerEvents = ->
	(window.city?={}).toggleVisibility = slideContentOut #toggleVisibility is called from an onclick event inlined in the shade handle HTML.
	#slideContentOut() #Debug automation.
	
	createjs.Touch.enable(stage);
	stage.addEventListener('mousedown', (event) -> 
		event.addEventListener('mouseup', mouseHandlers.up)     #3
		event.addEventListener('mousemove', mouseHandlers.move) #2
		mouseHandlers.down(event)                               #1
		swallowMouseEvent(event) #Stops mouse from changing to 'text' on chrome, also prevents highlighting text.
	)