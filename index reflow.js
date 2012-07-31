"use strict";

//BEGIN SCROLLTO
/**
 * jQuery.ScrollTo - Easy element scrolling using jQuery.
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 * @author Ariel Flesler
 * @version 1.4.2
 *
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 */
;(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);
//END SCROLLTO

var reflow_count = 0;

function reflow_titles() {
	if(document.getElementsByClassName) {
		//old_window_size = $(window).outerWidth();
		var headers = document.getElementsByClassName('header');
		var entries = document.getElementsByClassName('entry');
		
		//Check to see if our headers are in the space beside our content. If they're not, we can't move them around because they'd overlap with the content.
		var enable_flow = true;
		for (var currentIndex = 0; currentIndex < headers.length; currentIndex+=1) {
			if($(headers[currentIndex]).offset().top !== $(entries[currentIndex]).offset().top
					&& headers[currentIndex].style.position !== 'relative'
					|| $(headers[currentIndex]).offset().left + $(headers[currentIndex]).width() > $(entries[currentIndex]).offset().left) {
				enable_flow = false; //Above, test to see if the right side is farther than the left side of the text.
			};
		};
		
		if (enable_flow){
			reflow_count += 1;
			var window_top = $(window).scrollTop();
			var window_bottom = $(window).scrollTop() + $(window).height();
			var calculateOffsets = function (start, end) {
				var height = 0;
				if(start > end) {
					start -= end = (start += end) - end;
				};
				for (var currentIndex = start; currentIndex < end; currentIndex+=1) {
					height += $(headers[currentIndex]).height();
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
						header.offset({'top': window_top + header_offset});
					})();
				} else if(entry.offset().top + header.height() > window_bottom - (header_total - header_offset)) {
					(function () {
						header.offset({'top': window_bottom - (header_total - header_offset) - header.height()});
					})();
				} else {
					(function () {
						header.offset({'top': $(entries[currentIndex]).offset().top});
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
	for (var currentIndex = 0; currentIndex < headers.length; currentIndex+=1) {
		var header = $(headers[currentIndex]);
		header.click(
			{'entry': $(entries[currentIndex])}, 
			function (args) {
				//$(window).scrollTop(args.data.entry.offset().top)
				$.scrollTo(args.data.entry, {duration:200});
			}
		);
		header.html('<a>' + header.html() + '</a>');
	};
};