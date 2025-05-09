const Prism = require('prismjs')
require('prismjs/components/')(['bash', 'systemd'])

;`<!--
	published: 2025-04-24,
	tags: linux led cosmetic rgb,
	desc: Setting Up OpenRGB for KDE Neon.,
-->

<p>I recently got a computer which came with some case LEDs. By default, they do a rainbow crawl which I find a bit tacky. (Ignore that <a href="https://ravelights.ca">my own product</a> defaults to this. Truly; none of us are free of sin.) Since I'm running KDE Neon (an Ubuntu-based distribution), I can't use the software the manufacturers provide as it won't run. So, to change the colour to a more reasonable deep orange glow, I used <a href="https://openrgb.org/">OpenRGB</a>. However, on my computer, this configuration is not persistent across reboots or suspends. My lights revert to the default rainbow crawl when I boot or sleep.</p>

<p>To fix this, I've set up <a href="https://systemd.io/">Systemd</a> with some assistance from <a href="https://www.perplexity.ai/">Perplexity</a>. This is how I've done it:</p>

<ol>
	<li>
		<p>Install OpenRGB from <a href="https://launchpad.net/~thopiekar/+archive/ubuntu/openrgb">Thomas Pietrowski's PPA</a>.</p>
		<code class="prism-block language-bash">${
			indent(-1, Prism.highlight(`
				sudo add-apt-repository ppa:thopiekar/openrgb
				sudo apt install openrgb
			`, Prism.languages.bash, 'bash'))
		}</code>
		<p>When I was installing, I found Discover has a package for OpenRGB, but it was broken - it could only read the LEDs, not write to them. The .appimage I found wouldn't run, and the .deb files on the OpenRGB website were no longer compatible with my installation.</p>
	</li>
	
	<li>
		<p>Run the OpenRGB UI, adjust your RGB to your liking, and save a profile. I saved mine as <code>~/.config/OpenRGB/deep orange.orp</code>. Test you can load this profile from the UI. You may need to run as root to be able to set all LEDs.</p>
	</li>
	
	<li>
		<p>When running OpenRGB as root, it will need access to our <code>.orp</code> file. We need to put it in <code>/root/.config/OpenRGB</code> so it can be loaded. (Thank you, <a href="https://strace.io/"><code>strace</code></a>!)</p>
		<code class="prism-block language-bash">${
			indent(-1, Prism.highlight(`
				sudo mkdir -p /root/.config/OpenRGB
				sudo ln -s /home/ddr/.config/OpenRGB/deep\ orange.orp /root/.config/OpenRGB/deep\ orange.orp
			`, Prism.languages.bash, 'bash'))
		}</code>
		<p>I've used a soft link here so we always load the last version we saved, we don't have to copy it over every time we tweak it.</p>
	</li>
	
	<li>
		<p>To start OpenRGB on system start, we'll make a Systemd service file.</p>
		<strong>/etc/systemd/system/OpenRGB.service</strong>
		<code class="prism-block language-systemd">${
			indent(-1, Prism.highlight(`
				[Unit]
				Description=Set LED colour using OpenRGB.
				After=basic.target

				[Service]
				Type=simple
				User=root
				ExecStart=/bin/openrgb --server --profile "deep orange.orp"

				[Install]
				WantedBy=multi-user.target
			`, Prism.languages.systemd, 'systemd'))
		}</code>
		<p>Then enable it.</p>
		<code class="prism-block language-bash">${
			indent(-1, Prism.highlight(`
				sudo systemctl daemon-reload
				sudo systemctl enable OpenRGB.service
				sudo systemctl start OpenRGB.service
			`, Prism.languages.bash, 'bash'))
		}</code>
	</li>
	
	<li>
		<p>Finally, to restore our RGB colours after sleep, we'll add script to the Systemd's <code>system-sleep</code> folder. It will be run on sleep and wake, but we'll only do stuff on wake. It should be owned by root and be executable.</p>
		<strong>/usr/lib/systemd/system-sleep/RunOpenRGBOnWake.sh</strong>
		<code class="prism-block language-bash">${
			indent(-1, Prism.highlight(`
				#!/bin/sh

				case $1 in
				  post)
				    /bin/openrgb --profile "deep orange.orp"
				    ;;
				esac
			`, Prism.languages.bash, 'bash'))
		}</code>
	</li>
</ol>

<p>Did this work for you? What changes did you have to make, if any?</p>
`