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

'use strict'

var debug = require('debug')('generator-swiftserver:lib:sdkGenHelper')
var fs = require('fs')
var path = require('path')
var chalk = require('chalk')
var unzip = require('unzip2')
var config = require('../config')
var Promise = require('bluebird')
var request = require('request')
var requestAsync = Promise.promisify(request)
Promise.promisifyAll(request)

function getStatusAsync (generatedID) {
  var getStatusURL = `${config.sdkGenURL}${generatedID}/status`
  return requestAsync({
    headers: { 'Accept': 'application/json' },
    url: getStatusURL
  })
    .then(response => {
      var status
      try {
        status = JSON.parse(response.body).status
      } catch (err) {
        // modify the error and re-throw it. This preserves the original stack
        debug('failed to parse response.body:', response.body)
        err.message = chalk.red(err.message + ': failed to parse async status response body ' + response.body)
        throw err
      }
      switch (status) {
        case 'FINISHED':
          return true

        case 'VALIDATION_FAILED':
        case 'FAILED':
          throw new Error(chalk.red('SDK generator creation failed with status: ', status))

        default:
          return false
      }
    })
}

exports.performSDKGenerationAsync = function (sdkName, sdkType, fileContent) {
  var startGenURL = `${config.sdkGenURL}${sdkName}/${sdkType}`
  debug(`starting SDK generation job for ${sdkName} using ${startGenURL}`)
  return request.postAsync({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    url: startGenURL,
    body: fileContent
  })
    .then(function (response) {
      var body
      try {
        body = JSON.parse(response.body)
      } catch (err) {
        // modify the error and re-throw it. This preserves the original stack
        err.message = chalk.red(err.message + ': failed to parse response body')
        throw err
      }
      if (body.job && body.job.id) {
        return body.job.id
      }
      throw new Error(chalk.red('SDK generation error:', response.statusCode, response.statusMessage, body.message))
    })
    .tap(generatedID => debug(`SDK generation job for ${sdkName} started with id ${generatedID}`))
    .then(generatedID => checkUntilFinished(generatedID))

  function checkUntilFinished (generatedID, count) {
    count = count || 1
    debug(`#${count} checking status of SDK generation job with id ${generatedID} (for ${sdkName})`)
    return getStatusAsync(generatedID)
        .then(finished => {
          if (finished) {
            debug(`SDK generation job with id ${generatedID} (for ${sdkName}) is complete`)
            return generatedID
          } else {
            if (count <= 10) {
              return Promise.delay(config.sdkGenCheckDelay).then(() => checkUntilFinished(generatedID, count + 1))
            } else {
              throw new Error(chalk.red('Timeout error, couldn\'t generate SDK within timeout.'))
            }
          }
        })
  }
}

exports.getClientSDKAsync = function (sdkName, generatedID) {
  var clientDownloadURL = config.sdkGenURL + generatedID
  // Use the non-async version of request.get() here because
  // we are going to use .pipe() to stream the data to disk
  return new Promise((resolve, reject) => {
    debug(`starting client SDK download for ${sdkName} from ${clientDownloadURL}`)
    request.get({
      headers: { 'Accept': 'application/zip' },
      url: clientDownloadURL
    })
    .on('error', err => {
      reject(new Error(chalk.red('Getting client SDK failed with error: ', err.message)))
    })
    .pipe(fs.createWriteStream(sdkName + '.zip'))
    .on('close', resolve)
  }).tap(() => debug(`finished client SDK download for ${sdkName} from ${clientDownloadURL}`))
}

exports.getServerSDKAsync = function (sdkName, generatedID) {
  var serverDownloadURL = config.sdkGenURL + generatedID
  // Use the non-async version of request.get() here because
  // we are going to use .pipe() to stream the data to disk
  return new Promise((resolve, reject) => {
    var tempDir = fs.mkdtempSync('/tmp/')
    debug(`starting server SDK download and unzip for ${sdkName} from ${serverDownloadURL} to ${tempDir}`)
    request.get({
      headers: { 'Accept': 'application/zip' },
      url: serverDownloadURL
    })
    .on('error', err => {
      reject(new Error(chalk.red('Getting server SDK failed with error: ', err.message)))
    })
    .pipe(unzip.Extract({ path: tempDir }))
    .on('close', () => {
      debug(`finished server SDK download and unzip for ${sdkName} from ${serverDownloadURL} to ${tempDir}`)

      var sdkDir = path.join(tempDir, sdkName)
      debug(`reading package dependencies from server SDK ${sdkName} in ${sdkDir}`)
      try {
        var packages = readPackageDependencies(sdkName, sdkDir)
      } catch (e) {
        reject(e)
      }

      resolve({ tempDir: tempDir, dirname: sdkName, packages: packages })
    })
  })
}

function ensureTrailingComma (string) {
  return string.endsWith(',') ? string : string + ','
}

function readPackageDependencies (sdkName, sdkDir) {
  var originFile = fs.readFileSync(sdkDir + '/Package.swift', 'utf8')
  var originMatches = originFile.match(/\.\bPackage\b.*/g)
  var parsedDependencies = null
  if (originMatches) {
    parsedDependencies = []
    // input  : .Package(url: "https://github.com/IBM-Swift/Kitura.git", majorVersion: 1, minor: 7)
    // output : .package(url: "https://github.com/IBM-Swift/Kitura.git", .upToNextMinor(from : "1.7.0")
    originMatches.forEach(function (dependency) {
      if (dependency.indexOf('minor') < 0) {
        throw Error(chalk.red('SDKGEN Package dependency format is incompatible'))
      }
      dependency = dependency.replace('Package', 'package')
      var commaSplit = dependency.split(',')
      var majorVersion = commaSplit[1].replace(/[^0-9.]/g, '')
      var minor = commaSplit[2].replace(/[^0-9.]/g, '')
      dependency = commaSplit[0] + ', .upToNextMinor( from:"' + majorVersion + '.' + minor + '.0"))'
      parsedDependencies.push(dependency)
    })
  }
  if (parsedDependencies) {
    debug(`found ${parsedDependencies.length} package dependencies in server SDK ${sdkName}`)
    return parsedDependencies.map(m => ensureTrailingComma(m.trim()))
  } else {
    debug(`found no package dependencies in server SDK ${sdkName}`)
    return []
  }
}
