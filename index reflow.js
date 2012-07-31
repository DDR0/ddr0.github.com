"use strict";

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
	document.location.reload(false);
};