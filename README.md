# generator-swiftserver

This module is a [Yeoman](http://yeoman.io) generator for creating REST webservices based on the [Kitura web framework](http://kitura.io) with the [Swift](https://swift.org/) language.

This generator and the Yeoman library runs on Node.js and generates a Swift 3 application.

## Installation
To use this module, you will need Node.js and Swift 3 installed on your Linux or macOS system. You can get Node.js from https://nodejs.org and Swift 3 from https://swift.org/download.

You will also need the Yeoman command line utility [yo](https://github.com/yeoman/yo) installed in your global Node.js module directory.  
To install yo, use: `npm install -g yo`  
To install this generator, use: `npm install -g git+https://github.com/IBM-Swift/generator-swiftserver`

## Quick start
To create a Swift Server Generator project with no models defined, use: `yo swiftserver`  
To add a data model to your project, `cd` to the new project directory and use: `yo swiftserver:model`  
To run the generated server, use: `<project-dir>/.build/debug/<app-name>`
