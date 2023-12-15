console.info('service worker script start')

addEventListener("install", event => {
	console.info('sw: installed')
	skipWaiting()
});

addEventListener("activate", event => {
	console.info('sw: activated')
	event.waitUntil(clients.claim())
});


//Store intervals the source ID has created.
const tabs = new Map();

const stop = async (pageID)=>{
	const tab = tabs.get(pageID); //more than one tab, more than one timer, get the right one
	tabs.delete(pageID); //don't need that any more
	
	//Stop any countdowns.
	clearInterval(tab?.notificationInterval || -1);
	clearTimeout(tab?.notificationTimeout || -1);
	clearInterval(tab?.clockInterval || -1);
	
	//And clear any existing notifications.
	for (const notification of await registration.getNotifications({tag: pageID})) {
		notification.close();
	}
};

addEventListener("message", event => {
	const logUnknownEvent = ()=>console.error(`sw: Unknown event "${event.data.action}".`, event);
	
	({
		stop: ()=>stop(event.source.id),
		start: async ({prompt, minutes, round})=>{
			console.log(`sw: tab ${event.source.id} started "${prompt}" every ${minutes}m.`);
			
			await stop(event.source.id); //clean up any erroneously open notifications and timers
			
			let startTime = Date.now();
			let startMsOffset = 0;
			
			const showAlert = ()=>{
				startTime = Date.now(); //New notification. Reset the countdown.
				
				registration.showNotification(prompt, {
					renotify: true,
					tag: event.source.id,
					vibrate: [200, 100, 200, 100, 200, 100, 200],
					requireInteraction: true,
					actions: [{
						action: "okay",
						title: "✅ Okay",
					}, {
						action: "stop",
						title: "❌ Stop",
					}],
				}).catch(()=>{
					event.source.postMessage({
						action: "error", 
						payload: {
							message: "Error: Showing notification didn't work. Try reloading?",
						},
					});
					stop(event.source.id);
				});
			};
			showAlert();
			
			const scheduleRoundedShowing = () => {
				showAlert();
				
				startMsOffset = 0;
				tabs.get(event.source.id).notificationInterval = 
					setInterval(showAlert, minutes * 60000);
			}
			
			let notificationInterval = -1;
			let notificationTimeout = -1;
			if (!round) {
				notificationInterval = setInterval(showAlert, minutes * 60000);
			} else {
				const now = new Date();
				startMsOffset = now.getMinutes() % minutes * 60000 + now.getSeconds() * 1000 + now.getMilliseconds();
				notificationTimeout = setTimeout(scheduleRoundedShowing, minutes * 60000 - startMsOffset);
			}
			
			const updateRemainingTime = ()=>{
				const elapsedSec = ((Date.now() - startTime) + startMsOffset)/1000;
				const delta = Math.round(minutes * 60 - elapsedSec);
				
				event.source.postMessage({
					action: "updateRemainingTime", 
					payload: {
						time: `${Math.floor(delta/60)}:${`${delta%60}`.padStart(2, '0')}`,
					},
				});
			};
			
			const clockInterval = setInterval(updateRemainingTime, 1000);
			updateRemainingTime();
			
			tabs.set(event.source.id, {
				notificationInterval, 
				notificationTimeout, 
				clockInterval, 
				source: event.source,
			});
			console.log(event);
		},
	}[event.data.action] || logUnknownEvent)(event.data.payload)
});

addEventListener('notificationclick', event => {
	event.notification.close();
	if (event.action === "stop") {
		tabs.get(event.notification.tag)?.source.postMessage({ action: 'stop' });
	} else {
		event.preventDefault();
	}
});