/*
 © Copyright IBM Corp. 2017, 2018
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// module for Handlebars helpers

'use strict'

const Handlebars = require('handlebars')

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this)
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})

Handlebars.registerHelper('optionalProperties', function (propertyInfos, helpers, model) {
  var properties = ''
  // Optional properties
  propertyInfos.filter((info) => info.optional).forEach(function (info) {
    var defaultValueClause = ''
    if (typeof (model.properties[info.name].default) !== 'undefined') {
      var swiftDefaultLiteral = helpers.convertJSDefaultValueToSwift(model.properties[info.name].default)
      defaultValueClause = ' ?? ' + swiftDefaultLiteral
    }
    properties = properties + `if json["${info.name}"].exists() && \njson["${info.name}"].type != .${info.swiftyJSONType} {\n     throw ModelError.propertyTypeMismatch(name: "${info.name}", type: "${info.jsType}", value: json["${info.name}"].description, valueType: String(describing: json["${info.name}"].type))\n}`
    if (info.jsType === 'number') {
      properties = properties + `self.${info.name} = json["${info.name}"].number.map { Double($0) }${defaultValueClause}\n`
    } else {
      properties = properties + `self.${info.name} = json["${info.name}"].${info.swiftyJSONProperty}${defaultValueClause}\n`
    }
    return properties
  })
})

Handlebars.registerHelper('settingID', function (propertyInfos, model) {
  var args = (['id: newId'].concat(propertyInfos.filter((info) => info.name !== 'id').map((info) => `${info.name}: ${info.name}`))).join(', ')
  return `      return ${model.classname}(${args})`
})

Handlebars.registerHelper('propertyMapping', function (propertyInfos) {
  return propertyInfos.map((info) => `"${info.name}"`).join(', ')
})

Handlebars.registerHelper('eachInMap', function (object, map, block) {
  object.map(function (prop) {
    return block(object[ prop ]).join(', ')
  })
})

module.exports = Handlebars
