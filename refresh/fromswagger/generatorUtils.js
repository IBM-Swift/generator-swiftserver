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
function baseName(path) {
  // get the base file name from a full path.
  var baseNameRegex = new RegExp(/([^/]+)$/);
  var name = path.match(baseNameRegex)[1];
  return name.split('.')[0];
}

function convertToSwiftParameterFormat(path) {
  // take a swagger path and convert the parameters to swift format.
  // i.e. convert "/path/to/{param1/{param2}" to "/path/to/:param1/:param2} 
  var newPath = path.replace(/{/g, ':');
  return newPath.replace(/}/g, '');
}

function resourceNameFromPath(path) {
  // grab the first valid element of a path (or partial path) and return it capitalized.
  var resourceRegex = new RegExp(/^\/*([^/]+)/);
  var resource = path.match(resourceRegex)[1];
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

function getRefName(ref) {
  return ref.split("/").pop();
}

function getTypeFromSwaggerProperty(property){
  // return a Swift type based on a swagger type and format.
  var types = { boolean: 'Bool',
                integer: 'Integer',
                string: 'String'
              };

  var formats = { binary: 'String',
                  byte: 'String',
                  date: 'String',  
                  'date-time': 'String',  
                  double: 'Double',
                  float: 'Float',
                  int32: 'Int32',
                  int64: 'Int64',
                  password: 'String'
                };

  var swaggerType = undefined;

  if (property.type) {
    if (types.hasOwnProperty(property.type)) {
      swaggerType = types[property.type];
    } else if (property.type === 'array') {
      swaggerType = '[' + getRefName(property.items.$ref) + ']';
    }
  } else if (property.format && formats.hasOwnProperty(property.format)) {
    swaggerType = formats[property.format];
  } else if (property.$ref) {
    swaggerType = getRefName(property.$ref);
  }
  return swaggerType;
}

module.exports = {baseName,
                  convertToSwiftParameterFormat,
                  resourceNameFromPath,
                  getRefName,
                  getTypeFromSwaggerProperty};
