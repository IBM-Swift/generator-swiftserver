// Generator utils

function getRefName(ref) {
  return ref.split("/").pop();
}

function getTypeFromSwaggerProperty(property){
  // return a Swift type based on a swagger type and format.
  // TODO rework all this as I thinks it's incorrect.
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

module.exports = {getRefName, getTypeFromSwaggerProperty};
