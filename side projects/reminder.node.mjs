#!/usr/bin/env node
"use strict"

import { generateKeyPairSync } from 'crypto'
import express from 'express'
import base64url from 'base64url'

const app = express()

const setResponseHeader = (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin)
	res.header('Vary', 'Origin')
}

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const publicKeyBytes = publicKey.export({type: 'spki', format: 'der'}).slice(-65); //Slice the actual key off the end, we don't need the rest of the cert.
//TODO: Persist at least the private key so we can resume subscriptions when the server comes back up.

console.log('generated', new Array(...publicKeyBytes))

app.get('/v1/key', (req, res) => {
	setResponseHeader(req, res)
	res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': publicKeyBytes.length,
    })
    res.end(publicKeyBytes, 'binary')
})

app.listen(8304)
console.info("Starting Reminder push server on port 8304.")