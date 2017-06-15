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
var request = require('request');
var unzip = require('unzip');
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
  		callback();
  		return;
  	}
    body = JSON.parse(body);

    var job = body['job']
    var genID = job['id'];

	var sdkReady = false
	var intervalsRun = 0
    var timerId = setInterval(function () {   
    	intervalsRun += 1
    	if (intervalsRun >= 10) clearInterval(timerId);
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
// TODO: add error handling
exports.getiOSSDK = function(sdkName, generatedID, callback) {
	console.log("getting ios");
	request.get({
        headers: {'Accept' : 'application/zip'},
        url: config.sdkGenURL + generatedID
    })
    .pipe(fs.createWriteStream(sdkName + '.zip'))
	.on('finish', callback);
}

exports.getServerSDK = function(sdkName, generatedID, callback) {
	var self = this;
	console.log("getting server sdk");
	var data = [], dataLen = 0; 
	request.get({
		headers: {'Accept' : 'application/zip'},
		url: config.sdkGenURL + generatedID
	})
	.on('data', function(chunk) {
		data.push(chunk);
		dataLen += chunk.length;
	}).on('end', function() {
		var buf = new Buffer(dataLen);
		for (var i=0, len = data.length, pos = 0; i < len; i++) { 
			data[i].copy(buf, pos); 
			pos += data[i].length; 
		} 

		var tempDir = fs.mkdtempSync('/tmp/')
		// Convert buffer to stream and extract data
		var bufferStream = new stream.PassThrough();
		bufferStream.end(buf);
		bufferStream.pipe(unzip.Extract({ path: tempDir }))
		.on('close', function() {
			var sdkRootPath = tempDir + '/' + sdkName;
			extractNewContent.call(self, sdkRootPath, function(packages) {

				if(self.sdkRootPaths === undefined) {
					self.sdkRootPaths = [];
				}
				if(self.sdkTargets === undefined) {
					self.sdkTargets = [];
				}
				self.sdkRootPaths.push(sdkRootPath);
				self.sdkTargets.push(sdkName);

				if(packages.length > 0) {
					self.sdkPackages = packages;
				}
				console.log(self.sdkRootPaths);
				console.log(self.sdkTargets);
				console.log(self.sdkPackages);
				callback();
			})
		});
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

exports.integrateServerSDK = function(sdkName, callback) {
	// since files haven't been created yet, must use yeoman in memory file system
	var origin = this.destinationPath(sdkName + '/Sources/');
	console.log(origin);
	var destination = this.destinationPath('Sources/' + sdkName);
	console.log("path: " + destination)
	// if (!this.fs.exists(destination)){
	//   fs.mkdirSync(destination);
	// }

	this.fs.copy(origin, destination);
	console.log(this.fs.exists(sdkName + '.zip'));
	this.fs.delete(this.destinationPath(sdkName + '.zip'));
	// this.fs.delete(sdkName);

	callback();

	// Write source files to app's Source folder
	// var rsync = new Rsync()
	// .flags('av')
	// .source('./' + sdkName + '/Sources/')
	// .destination(destination);
	// // Execute the resync command
	// rsync.execute(function(error, code, cmd) {
	// 	if(error) {
	// 	  console.error('Finished Rsync with error ' + error);
	// 	}
	// 	// Remove unecessary files/folders
	// 	fs.unlinkSync('./' + sdkName + '.zip');
	// 	rimraf('./' + sdkName, function () { 
	// 		callback();
	// 	});
	// });
};
