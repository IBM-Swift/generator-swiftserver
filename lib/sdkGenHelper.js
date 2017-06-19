/*
 * Copyright IBM Corporation 2016-2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs');
var chalk = require('chalk');
var request = require('request');
var unzip = require('unzip2');
var stream = require('stream');
var Rsync = require('rsync');
var rimraf = require('rimraf');
var config = require('../config');

exports.performSDKGeneration = function(sdkName, sdkType, fileContent, callback) {
  var self = this
  var startGenURL = config.sdkGenURL + sdkName + "/" + sdkType; // ex. ios_swift or server_swift
  request.post({
    headers: {'Accept' : 'application/json',
              'Content-Type' : 'application/json'},
    url:     startGenURL,
    body: fileContent
  }, function(error, response, body){
  	if (error) {
  		self.env.error(chalk.red('Error creating SDK: ', error));
  	}
    body = JSON.parse(body);

    var job = body['job']
    var genID = job['id'];

	var sdkReady = false
	var intervalsRun = 0
    var timerId = setInterval(function () {   
    	intervalsRun += 1
    	if (intervalsRun >= 10) {
			clearInterval(timerId);
			self.env.error(chalk.red('Timeout error, couldn\'t generate SDK within timeout.'));
		}
        getStatus();
    }, 3000) // Check status every 3 seconds

    function getStatus() {
	    request.get({
	    	headers: {'Accept' : 'application/json'},
	      	url: config.sdkGenURL + genID + '/status'
	    }, function(error, response, body){
	    	if (error) {
	    		self.env.error(chalk.red('Error getting SDK status: ', error));
	    	}
	      	body = JSON.parse(body);

			if (body['status'] === 'FINISHED' && !sdkReady) {
				clearInterval(timerId);
				sdkReady = true
				callback(genID);
			} else if (body['status'] === 'VALIDATION_FAILED' || body['status'] === 'FAILED') {
				clearInterval(timerId);
				self.env.error(chalk.red('SDK generator creation failed with status: ', body['status']));
			}
	    })
    }
  });
}

exports.getiOSSDK = function(sdkName, generatedID, callback) {
	request.get({
        headers: {'Accept' : 'application/zip'},
        url: config.sdkGenURL + generatedID
    })
	.on('error', function(err) {
		self.env.error(chalk.red('Getting iOS SDK zip failed with error: ', error));
	})
    .pipe(fs.createWriteStream(sdkName + '.zip'))
	.on('close', callback);
}

exports.getServerSDK = function(sdkName, generatedID, callback) {
	var self = this;
	var tempDir = fs.mkdtempSync('/tmp/')
	request.get({
		headers: {'Accept' : 'application/zip'},
		url: config.sdkGenURL + generatedID
	})
	.on('error', function(err) {
		self.env.error(chalk.red('Unzipping Server SDK failed with error: ', error));
	})
	.pipe(unzip.Extract({ path: tempDir }))
	.on('close', function() {
		var sdkRootPath = tempDir + '/' + sdkName;
		extractNewContent.call(self, sdkRootPath, function(packages) {

			self.sdkRootPaths.push(sdkRootPath);
			self.sdkTargets.push(sdkName);

			if(packages.length > 0) {
				self.sdkPackages = packages;
			}
			callback();
		})
	});
}

function extractNewContent(sdkRootPath, callback) {
	var self = this;
	var originFile = fs.readFileSync(sdkRootPath + '/Package.swift', 'utf8');
	var originMatches = originFile.match(/\.\bPackage\b.*/g);
	var packages = '';

	if(originMatches != null && originMatches.length > 0) {

		var index; 
		for (index = 0; index < originMatches.length; index++) {
			packages += originMatches[index];
			if(index + 1 == originMatches.length) packages += ',';
			packages += '\n\t\t\t\t'
		}
	} else {
		this.log(chalk.yellow('Failed to find matches for Package dependencies.'));
	}
	callback(packages);
}

exports.integrateServerSDK = function(rootPath, callback) {
	var origin = this.destinationPath(rootPath + '/Sources/');
	var sdkName = rootPath.substr(rootPath.lastIndexOf('/') + 1);
	var destination = this.destinationPath('Sources/' + sdkName);

	// Copy SDK's Sources directory into server's Sources directory
	this.fs.copy(origin, destination);

	// Clean up temp directory
	var tempDir = rootPath.substr(0, rootPath.lastIndexOf('/'));
	if(fs.existsSync(tempDir)) {
		rimraf.sync(tempDir);
	} else {
		this.log(chalk.yellow('Failed to remove tmp directory with Server SDK'));
	}
	callback();
};
