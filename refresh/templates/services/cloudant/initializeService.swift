let couchDBConnProps = ConnectionProperties(host: "<%- serviceDef.host || 'localhost' %>", port: <%- serviceDef.port || 5984 %>, secured: <%- serviceDef.secured || false %>)
let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
