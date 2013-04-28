"use strict";

// * jQuery.ScrollTo - Easy element scrolling using jQuery. * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com * Dual licensed under MIT and GPL. * Date: 5/25/2009 * @author Ariel Flesler * @version 1.4.2 * * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);

// Taken from http://www.quirksmode.org/js/detect.html. Thanks, quirksmode!
var BrowserDetect={init:function(){this.browser=this.searchString(this.dataBrowser)||"An unknown browser";this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||"an unknown version";this.OS=this.searchString(this.dataOS)||"an unknown OS"},searchString:function(a){for(var b=0;b<a.length;b++){var c=a[b].string;var d=a[b].prop;this.versionSearchString=a[b].versionSearch||a[b].identity;if(c){if(c.indexOf(a[b].subString)!=-1)return a[b].identity}else if(d)return a[b].identity}},searchVersion:function(a){var b=a.indexOf(this.versionSearchString);if(b==-1)return;return parseFloat(a.substring(b+this.versionSearchString.length+1))},dataBrowser:[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.userAgent,subString:"OmniWeb",versionSearch:"OmniWeb/",identity:"OmniWeb"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera",versionSearch:"Version"},{string:navigator.vendor,subString:"iCab",identity:"iCab"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.vendor,subString:"Camino",identity:"Camino"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],dataOS:[{string:navigator.platform,subString:"Win",identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone/iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}]};BrowserDetect.init();

// Taken from http://www.abeautifulsite.net/blog/2011/11/detecting-mobile-devices-with-javascript/. Thanks, abeautifulsite! Note: Doesn't detech Opera Mini.
var isMobile={Android:function(){return navigator.userAgent.match(/Android/i)?true:false},BlackBerry:function(){return navigator.userAgent.match(/BlackBerry/i)?true:false},iOS:function(){return navigator.userAgent.match(/iPhone|iPad|iPod/i)?true:false},Windows:function(){return navigator.userAgent.match(/IEMobile/i)?true:false},any:function(){return isMobile.Android()||isMobile.BlackBerry()||isMobile.iOS()||isMobile.Windows()}};
isMobile = isMobile.any();

var reflow_count = 0;
var headers_set_up = false;

function can_reflow_titles (headers, entries) {
	for (var currentIndex = 0; currentIndex < headers.length; currentIndex+=1) {
		if($(headers[currentIndex]).offset().top - parseInt($(headers[currentIndex]).css('margin-top')) !== $(entries[currentIndex]).offset().top
			&& headers[currentIndex].style.position !== 'relative'
			|| $(headers[currentIndex]).offset().left + $(headers[currentIndex]).width() > $(entries[currentIndex]).offset().left
			&& !isMobile //Most mobile browsers (ie, the two I tried) skimp on the on_scroll event, and only fire it when we're done scrolling.
		){return false};
	};
	return true;
};

function reflow_titles() {
	if(document.getElementsByClassName) {
		//old_window_size = $(window).outerWidth();
		var headers = document.getElementsByClassName('header');
		var entries = document.getElementsByClassName('entry');
		var enable_flow = can_reflow_titles(headers, entries);
		
		if (enable_flow){
			reflow_count += 1;
			if(reflow_count === 1) {
				assign_scrolling_links();
			};
			var window_top = $(window).scrollTop();
			var window_bottom = $(window).scrollTop() + $(window).height();
			var calculateOffsets = function (start, end) {
				var height = 0;
				if(start > end) {
					start -= end = (start += end) - end; //Switch the values of start and end. Thank you, internet!
				};
				for (var currentIndex = start; currentIndex < end; currentIndex+=1) {
					height += $(headers[currentIndex]).outerHeight();
				};
				return height;
			};
			var header_total = calculateOffsets(0, headers.length-1);
			for (var currentIndex = 0; currentIndex < headers.length; currentIndex+=1) {
				var header = $(headers[currentIndex]);
				var entry  = $(entries[currentIndex]);
				var header_offset = 0;
				header_offset = calculateOffsets(0, currentIndex);
				if(entry.offset().top < window_top + header_offset) {
					(function () {
						header.offset({'top': window_top + header_offset + parseInt(header.css('margin-top'))});
					})();
				} else if(entry.offset().top + header.outerHeight() + parseInt(header.css('margin-top')) + parseInt(header.css('margin-bottom')) > window_bottom - (header_total - header_offset)) {
					(function () {
						header.offset({'top': window_bottom - (header_total - header_offset) - header.outerHeight() - parseInt(header.css('margin-bottom'))});
					})();
				} else {
					(function () {
						header.offset({'top': $(entries[currentIndex]).offset().top + parseInt(header.css('margin-top'))});
					})();
				};
			};
		} else if (reflow_count) {
			reflow_count = 0;
			deflow_titles();
		};
	};
};

function deflow_titles() {
	document.location.reload(false); //This should, perhaps, be changed. It flashes now, and seems broken in Firefox.
};

function assign_scrolling_links() {
	var headers = document.getElementsByClassName('header');
	var entries = document.getElementsByClassName('entry');
	var enable_flow = can_reflow_titles(headers, entries);
	
	for (var currentIndex = 0; currentIndex < headers.length; currentIndex+=1) {
		var header = $(headers[currentIndex]);
		header.unbind("click").click(
			{'entry': $(entries[currentIndex]), 'header':header, 'enable_flow': enable_flow}, 
			function (args) {
				if(args.data.enable_flow) {
					$.scrollTo(args.data.entry, {duration:200});
				} else {
					$.scrollTo(args.data.header, {duration:200});
				};
			}
		);
		
		if(!headers_set_up) {
			header.html('<a>' + header.html() + '</a>');
		};
	};
	headers_set_up = true;
};