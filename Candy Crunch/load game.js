/*global console createjs linkHTMLDisplay $ _ jQuery startNewGame*/

//jQuery ajax shim for ie8.
jQuery.ajaxSetup({
            xhr: function() {
                    //return new window.XMLHttpRequest();
                    try{
                        if(window.ActiveXObject)
                            return new window.ActiveXObject("Microsoft.XMLHTTP");
                    } catch(e) { }

                    return new window.XMLHttpRequest();
                }
        });

var mainWindow = null;
var isFL = null;
var loadGame = function() {
	"use strict";
	
	var options = {
		preferFlash: false,
		EaselJS_url: 'easel.js/lib/easeljs-0.5.0.min.js',
		EaselFL_url: 'EaselFL/build/output/easelfl-cur.min.js',
		SWFObject_url: 'EaselFL/js/swfobject.js',
	};
	createjs.FLSetup.run(onSetupSuccess, onSetupFailure, options);

	function onSetupSuccess(isFL_){
		isFL = isFL_;
		var loadOtherScriptsCount = 0;
		var jsAr = [
			"tween.js/lib/tweenjs-0.3.0.min.js",
			"sound.js/lib/soundjs-0.3.0.min.js"];
		
		var onAllLoaded = function() {
			if(loadOtherScriptsCount === jsAr.length) {
				console.log('All scripts loaded. Starting game.');
				mainWindow = startNewGame();
				linkHTMLDisplay();
			}
		};
		
		jsAr.map(function(js) {
			console.log('getting ' + js);
			$.ajax({
				async: false,
				type: "GET",
				url: js,
				dataType: 'text',

				success: function(data){
					jQuery.globalEval(data);
					loadOtherScriptsCount += 1;
					onAllLoaded();
				},
				error: function() {console.error('An error occured loading a game script.');}
				
			});
		});
	}
	
	function onSetupFailure() {console.error('EaselFL failed to load; aborting.');}
};