<!--
	published: 2026-09-13,
	tags: essay software-development,
	desc: Software development parallels expeditionary logistics.,
-->

<p>While reading one of my favourite blogs the other day, <a href=acoup.blog?s=supply>A Collection of Unmitigated Pedantry</a>, I realised an interesting parallel between software development and military logistics which I thought was worthy of a short write-up here.</p>

<p><strong>In both cases, the farther along a project gets, the higher the cost of progressing is.</strong><p>

<p>In the case of an expeditionary force, an army needs food, fuel, and supplies to progress. The farther the army has progressed, the farther away from all three they become, and the more of all three are needed to get any of the three to the army. This is exponential, since you need food, fuel and supplies to move food, fuel, and supplies. It's basically <a href=https://en.wikipedia.org/wiki/Tsiolkovsky_rocket_equation>the tyranny of the rocket equation</a> writ horizontal.</p>

<p>In the case of a codebase, the further an idea is developed, the more difficult it is to develop the idea. The first concept is developed in isolation. The second must be integrated with the first. The third must integrate with all three. As an example, in my work on the firmware for the <a href=https://ravelights.ca>Ravelights</a>, the first thing I did was make the light show some colours you could switch between. Then, we added inter-light synchronisation of the colours, and had to have a way to propagate that in a way that didn't muck up the on-device switching. Then, we added global shortcuts for checking the brightness or triggering pairing, and those had to play well with the existing colours and the synchronisation. Each step involved more edge-cases - eg, if you switch the light to the "pair to another ravelight" mode, that shouldn't sync to the other lights already paired.</p>

<p>Good software development includes the art of keeping the cost of these exponential interactions as low as possible. You can reduce the the exponent by reducing the complexity of the individual things which interact. Or, you can wrap a number of <em>things</em> together into one to reduce the base of the exponent.</p>

<p>And, just as there is no limit to how slowly an army can move, <a href=https://zachkehs.com/blog/theres_no_limit_to_how_bad_code_can_get>there is no limit to how bad code can get</a>. This is why a corporation can put out a triple-A game that took millions of dollars to produce, and an indie developer can put out a game <em>which sees similar sale numbers</em> for a few tens of thousands of dollars. The triple-A studios do a lot more, technically, but get caught by the exponential growth of complexity. An indie developer can have an overview of the whole project, and do only the work needed to deliver only the experience needed to sell the game.</p>
