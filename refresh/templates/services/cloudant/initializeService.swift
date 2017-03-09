    let couchDBConnProps = ConnectionProperties(host: "<%- service.credentials.host || 'localhost' %>", port: <%- service.credentials.port || 5984 %>, secured: <%- service.credentials.secured || false %>)
    couchDBClient = CouchDBClient(connectionProperties: couchDBConnProps)
