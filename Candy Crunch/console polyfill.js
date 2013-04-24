if(typeof console === "undefined") {
	console = {};
}
if(!console.log) {
	console.log = function() {};
	console.warn = function() {};
	console.error = function() {};
	console.info = function() {};
}