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
				getSDK();
			} else if (body['status'] === 'VALIDATION_FAILED' || body['status'] === 'FAILED') {
				clearInterval(timerId);
				self.env.error(chalk.red('SDK generator creation failed with status: ', body['status']));
			}
	    })
    }

    function getSDK() {
      // request.get({
      //   headers: {'Accept' : 'application/zip'},
      //   url: config.sdkGenURL + genID
      // })
      // .on('data', function(data) { //TODO: not writing data properly
      // 	self.fs.write(self.destinationPath(sdkName + '.zip'), data);
      // })
      // .on('end', callback);

    	var data = [], dataLen = 0; 
        request.get({
        	headers: {'Accept' : 'application/zip'},
        	url: config.sdkGenURL + genID
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

            self.fs.write(self.destinationPath(sdkName + '.zip'), buf);
            callback();
        });

	}
	});
}

exports.extractNewContent = function(sdkName, callback) {
	console.log("newcontent "  + this.destinationPath('./'));
	var self = this;

	// var content = this.fs.read(this.destinationPath(sdkName + '.zip'));
	// console.log("con: " + content);
	this.extract(this.destinationPath(sdkName + '.zip'), this.destinationPath('./'), function() {
		console.log("Extracted!");
		self.fs.commit(function() {
			console.log("commited");
			console.log(self.fs.exists('./' + sdkName + '/Package.swift'));
		})
		
		// var originFile = fs.readFileSync('./' + sdkName + '/Package.swift', 'utf8');
		// var originFile = self.fs.read('./' + sdkName + '/Package.swift');
		// console.log(originFile);
		// var originMatches = originFile.match(/\.\bPackage\b.*/g);
		// var packages = '';

		// if(originMatches != null && originMatches.length > 0) {

		// 	var index; 
		// 	for (index = 0; index < originMatches.length; index++) {
		// 		packages += originMatches[index];
		// 		if(index + 1 == originMatches.length) packages += ',';
		// 		packages += '\n\t\t\t\t'
		// 	}
		// } else {
			// self.log(chalk.yellow('Failed to find matches for Package dependencies.'));
		// }

		// callback(sdkName, packages);
		callback(sdkName, 'apackage');
	});

	// fs.createReadStream(sdkName + '.zip')
	//   .pipe(unzip.Extract({ path: '.' })
	//   .on('close', function () {

	// 	var originFile = fs.readFileSync('./' + sdkName + '/Package.swift', 'utf8');
	// 	var originMatches = originFile.match(/\.\bPackage\b.*/g);
	// 	var packages = '';

	// 	if(originMatches != null && originMatches.length > 0) {

	// 		var index; 
	// 		for (index = 0; index < originMatches.length; index++) {
	// 			packages += originMatches[index];
	// 			if(index + 1 == originMatches.length) packages += ',';
	// 			packages += '\n\t\t\t\t'
	// 		}
	// 	} else {
	// 		console.warn('Failed to find matches for Package dependencies.');
	// 	}

	// 	callback(sdkName, packages);

	// 	// The following is an alternate way to get the sdk module name using Regex
	// 	/*var nameMatch = originFile.match(/"(.*?)"/i);
	// 	if(nameMatch != null && nameMatch.length >= 2) {
	// 		// Get group 1 result, parsing out quotes just in case
	// 		var desiredMatch = nameMatch[1].replace(/['"]+/g, '');
	// 		callback(desiredMatch, packages);

	// 	} else {
	// 		console.log("Failed to find match for Package name.")
	// 		callback('', packages);
	// 	}*/
	// }));

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
