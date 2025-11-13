#!/bin/bash
echo "Installing Chromium..."
apt-get update
apt-get install -y chromium-browser

echo "Starting Node app..."
npm start
