# Thunderbird-Address-Collector

## Description

Thunderbird-Address-Collector is a simple Thunderbird extension that automatically collects email addresses from folders you choose and adds them to a selected address book. 

## Build Instructions

1. Clone the repository to your local machine.
2. Build the extension:
```
    npm install
    npm run release
```
or build in watch mode:
```
    npm run watch:background
    npm run watch:sites
```
3. Load the extension in Thunderbird as a temporary add-on for testing from the `manifest.json` file.

