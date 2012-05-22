# Copyright 1999-2012 Gentoo Foundation
# Distributed under the terms of the GNU General Public License v2
# $Header:

EAPI=2

inherit games

DESCRIPTION="Solve routing puzzles in the inner city with Cube Trains"
HOMEPAGE="http://ddr0.github.com/"
SRC_URI="https://github.com/DDR0/Cube_Trains/zipball/${PV} -> ${P}.zip"
S="${WORKDIR}/DDR0-Cube_Trains-261a54c"

LICENSE="GPL-3"
SLOT="0"
KEYWORDS="~amd64 ~x86"
IUSE=""

DEPEND=">=dev-libs/boost-1.35
>=media-libs/libsdl-1.2.7
>=media-libs/sdl-image-1.2[png]
>=media-libs/sdl-mixer-1.2[vorbis]
>=media-libs/sdl-ttf-2.0.8
media-libs/glew
dev-util/ccache
virtual/opengl
virtual/glu"
RDEPEND="${DEPEND}"

src_compile() {
    emake || die
}

src_install() {

	#Prepare shell launcher
	echo "#!/bin/sh" > ${PN}.sh
    echo "cd ${GAMES_DATADIR}/${PN}" >> ${PN}.sh
	echo "exec ./game $@" >> ${PN}.sh
	newgamesbin ${PN}.sh ${PN}

	exeinto ${GAMES_DATADIR}/${PN}
	doexe game

	insinto ${GAMES_DATADIR}/${PN}
	doins master-config.cfg
	doins *.ttf

    dodir ${GAMES_DATADIR}/${PN}/modules/cube_trains
    insinto ${GAMES_DATADIR}/${PN}/modules/cube_trains
    doins -r modules/cube_trains/* || die "doins failed"

	newicon modules/cube_trains/images/window-icon.png ${PN}.png
	make_desktop_entry ${PN}
	prepgamesdirs
}
