# WARNING: This repository is no longer maintained :warning:

> The generated content is now available in our [Swift static application](https://github.com/IBM/swift-kitura-app).

> This repository will not be updated. The repository will be kept available in read-only mode.


# generator-swiftserver

[![Build Status](https://travis-ci.org/IBM-Swift/generator-swiftserver.svg?branch=master)](https://travis-ci.org/IBM-Swift/generator-swiftserver)
[![codecov](https://codecov.io/gh/IBM-Swift/generator-swiftserver/branch/master/graph/badge.svg)](https://codecov.io/gh/IBM-Swift/generator-swiftserver)
[![Version](https://img.shields.io/npm/v/generator-swiftserver.svg)][url-npm]
[![DownloadsMonthly](https://img.shields.io/npm/dm/generator-swiftserver.svg)][url-npm]
[![DownloadsTotal](https://img.shields.io/npm/dt/generator-swiftserver.svg)][url-npm]
[![License](https://img.shields.io/npm/l/generator-swiftserver.svg)][url-npm]
[![Greenkeeper badge](https://badges.greenkeeper.io/IBM-Swift/generator-swiftserver.svg)](https://greenkeeper.io/)

[url-npm]: https://www.npmjs.com/package/generator-swiftserver

This module is a [Yeoman](http://yeoman.io) generator for creating REST webservices based on the [Kitura web framework](http://kitura.io) with the [Swift](https://swift.org/) language.

This generator and the Yeoman library runs on Node.js and generates a Swift 5.0 application.

## Contents
1. [Prerequisites](#prerequisites)
1. [Installation](#installation)
1. [Usage](#usage)
    - [Options](#options)
    - [Run](#run)
1. [Generated Artifacts](#generated-artifacts)
1. [Development](#development)
1. [Testing](#testing)
1. [Contributing](#contributing)

## Prerequisites
To use this module, you will need Node.js and Swift 5.0 installed on your Linux or macOS system. You can get Node.js from https://nodejs.org and Swift 5.0 from https://swift.org/download.

You will also need the Yeoman command line utility [yo](https://github.com/yeoman/yo) installed in your global Node.js module directory.

To install `yo`, run:

```bash
npm install -g yo
```

## Installation
To install generator-swiftserver, run:

```bash
npm install -g generator-swiftserver
```

## Usage
To create a Swift Server Generator project with no models defined, run:

```bash
yo swiftserver
```

To add a data model to your generated project, `cd` to the new project directory and run:

```bash
yo swiftserver:<model>
```

For more information on data models, check out [this guide on Kitura.io](https://www.kitura.io/guides/kituracli/model_definition.html).

### Options
You can also change how generator-swiftserver is invoked by choosing options:

```bash
yo swiftserver [options]
```

Option | Type |Description
--- | --- | ---
`--init` | n/a | Generate basic default scaffold without prompting user for input.
`--skip-build` | n/a | Skip building the generated application
`--single-shot` | n/a | Creates application without including generator metadata files
`--bluemix` | Json | Invoke generator-swiftserver using a bluemix json object
`--name` | String | Project name
`--type` | String | Give a specific type of application to generate. (`web`, `bff`, `scaffold`, `crud`)
`--metrics` | Boolean | Generate embedded metrics dashboard for project
`--docker` | Boolean | Generate Dockerfile for project
`--healthcheck` | Boolean | Add health checking to project
`--openapi` | Boolean | Add Kitura-OpenAPI to project
`--spec` | Json | Invoke generator-swiftserver using a spec json object

### Run
To run the generated server, use: `<project-dir>/.build/debug/<app-name>`

## Generated Artifacts

File | Purpose
--- | ---
Dockerfile | Configuration file for the run container
Dockerfile-tools | Configuration file for the tools container
LICENSE | License for generated project
Package.resolved | Results of dependency resolution from Swift Package Manager
Package.swift | Swift file containing dependencies and targets for project
README.md | Instructions for building, running, and deploying the project
Sources/* | Folder containing project source files
Tests/* | Folder containing project test files
chart/* | Folder containing Kubernetes Helm Chart files for project
cli-config.yml | Yaml file containing mappings for various commands, files, and settings, utilized by the cli commands
manifest.yml | Yaml file containing various information for deployment to IBM Cloud
spec.json | JSON file containing information about the project, used to generate the project
myProjectName.xcodeproj | Generated xcodeproj for project

## Development
To get started with development, simply clone this repository and link it via npm:

```
git clone https://github.com/IBM-Swift/generator-swiftserver
cd generator-swiftserver
npm link
```

## Testing
To run the unit tests, run:

```bash
npm test
```

## Contributing
To contribute, you will need to fork the repository or branch off the `develop` branch.

Make sure to follow the [conventional commit specification](https://conventionalcommits.org/) when contributing.

Once you are finished with your changes, run `npm test` to make sure all tests pass. Then, create a pull request against `develop`, and a team member will review and merge your pull request.

Once the pull request is merged, an auto generated pull request will be created against `master` to update the changelog and increase the versioning. After the auto-generated pull request has been merged to `master`, the version will be bumped and published to npm.
