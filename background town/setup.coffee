#compile: coffee -c -w -m \background\ town/setup.coffee 

#config
tileWidth = 36
tileHeight = 18

#globals
c = console
tileSheet=tileSheetRects=groundLayer=stage=windowMidpoint=

handleComplete = ->
	jQuery.globalEval queue.getResult('_').innerHTML
	jQuery.globalEval queue.getResult('easel').innerHTML
	tileSheet = new createjs.Bitmap queue.getResult 'tiles'
	configureCanvas()
	cacheEaselValues()
	setCallbacks()

queue = new createjs.LoadQueue()
queue.addEventListener("complete", handleComplete)
queue.loadManifest do (path='background town/') -> [
	{id: "_",     src: path + "underscore-min.js"}
	{id: "easel", src: path + "easeljs-0.6.0.min.js"}
	{id: "tiles", src: path + "tiles.png"}
]

configureCanvas = ->
	$('#background-city').css({
		position: 'absolute'
		top: 0, left: 0
		width: $(window).width()
		height: $(window).height()
		'z-index': -1
	}).attr({
		width: $(window).width()
		height: $(window).height()
	})
	
cacheEaselValues = ->
	tileSheetRects = do (w=tileWidth, h=tileHeight) ->
		road19    : new createjs.Rectangle 0*w, 0*h, w, h
		road37    : new createjs.Rectangle 1*w, 0*h, w, h
		road79    : new createjs.Rectangle 2*w, 0*h, w, h
		road39    : new createjs.Rectangle 3*w, 0*h, w, h
		road13    : new createjs.Rectangle 4*w, 0*h, w, h
		road17    : new createjs.Rectangle 5*w, 0*h, w, h
		outline   : new createjs.Rectangle 6*w, 0*h, w+2, h+1 #The outline is one bigger than a tile. Special case.
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

setCallbacks = ->
	stage = new createjs.Stage "background-city"
	stage.snapToPixel = true
	groundLayer = new createjs.Container(); stage.addChild groundLayer
	groundLayer.tiles = []
	pane = $('#content-holder')
	windowMidpoint = closestTile pane.width()/2+pane.position().left, pane.height()/2+pane.position().top
	cityGen windowMidpoint
	stage.update()
	c.log(windowMidpoint)
	
newTile = (x, y, type) ->
	throw new Error "Tile is off grid. x:#{x} and y:#{y} should sum to an even number." if (x/2+y/2)%1
	tile = tileSheet.clone()
	tile.sourceRect = tileSheetRects[type]
	tile.x = x/2*tileWidth; tile.y = y/2*tileHeight
	if type == 'outline'
		tile.x -= 1; tile.y -= 0.5 #Because FF doesn't listen to stage.snapToPixel = true
	tile.regX = tile.sourceRect.width/2; tile.regY = tile.sourceRect.height/2
	tile
	
addTile = (x, y, type) ->
	tile = newTile(x, y, type)
	groundLayer.addChild(tile)
	((groundLayer.tiles[x]?=[])[y]?=[]).push(tile)
	null
	
closestTile = (x, y) -> #takes pixels, returns a *valid* grid point
	x *= 2; y *= 2
	newX = Math.round x/tileWidth
	newY = Math.round y/tileHeight
	#TODO: Test this better. Does it round on x or mid_x? Does it correct rounding right?
	if (newX/2+newY/2)%1 #Then we're in an "off" tile. See also newTile. To rectify it, we'll flip the rounding operation of the least-rounded number.
		if Math.abs x-newX < Math.abs y-newY
			--newX if x-newX < 0 
			++newX if x-newX >= 0 
		else
			--newY if y-newY < 0 
			++newY if y-newY >= 0
	new createjs.Point newX, newY
	
advanceRoadTileAgent = null
roadTileAgents = null

addNewRoadTiles = (walked) ->
	for tile in walked
		addTile(tile.x, tile.y, 'outline')
		addTile(tile.x, tile.y, 'grass')
		addTile(tile.x, tile.y, 'road' + (tile.connects[1]*1 or '') + (tile.connects[3]*3 or '') + (tile.connects[7]*7 or '') + (tile.connects[9]*9 or ''))

cityGen = (startTile) -> 
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
	
	reverse = (dir) -> {1:9,3:7,7:3,9:1}[dir]
	
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
			oldAgents.push(agent) #Retire the agent.
			agent.tileOn.connects[agent.directive] = true
			crossedPath.connects[reverse(agent.directive)] = true
		else
			agent.tileOn.connects[agent.directive] = true
			agent.tileOn = agent.position.clone()
			agent.tileOn.connects = {}
			agent.tileOn.connects[reverse(agent.directive)] = true
			walked.push agent.tileOn
			
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
	
	for step in [1..Math.min(startTile.x, startTile.y)/2] #Compensate for diagonal-only walking.		
		for agent in agents
			advanceAgent agent
		agents = agents
			.filter((agent) -> !(agent in oldAgents))
			.concat(newAgents)
		newAgents = []
		oldAgents = []
	
	advanceRoadTileAgent = advanceAgent #Export the function and data so we can grow the city later.
	roadTileAgents = agents
	
	addNewRoadTiles walked
		
	null