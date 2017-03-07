let couchDBConnProps = ConnectionProperties(host: "<%- service.credentials.host || 'localhost' %>", port: <%- service.credentials.port || 5984 %>, secured: <%- service.credentials.secured || false %>)
let dbClient = CouchDBClient(connectionProperties: couchDBConnProps)
