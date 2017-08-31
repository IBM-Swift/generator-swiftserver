/*
 * Copyright IBM Corporation 2017
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
var path = require('path')

function baseName (thepath) {
  // get the base file name without extension from a full path.
  return path.basename(thepath).split('.')[0]
}

function resourceNameFromPath (thepath) {
  // grab the first valid element of a path (or partial path) and return it capitalized.
  var resource = thepath.match(/^\/*([^/]+)/)[1]
  return resource.charAt(0).toUpperCase() + resource.slice(1)
}

function getRefName (ref) {
  return ref.split('/').pop()
}

module.exports = {baseName,
  resourceNameFromPath,
  getRefName}
