import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ])
    ],
    dependencies: [

<% if(bluemix) { -%>
        .Package(url: "https://github.com/IBM-Swift/CloudConfiguration.git",  majorVersion: 0),
<% } else { -%>
        .Package(url: "https://github.com/IBM-Swift/Configuration.git",       majorVersion: 0),
<% } -%>
<% datastores.forEach(function(store) { -%>
<% if(store.name === 'cloudant') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-CouchDB.git",          majorVersion: 1),
<% } -%>
<% if(store.name === 'mongo') { -%>
        .Package(url: "https://github.com/tfrank64/MongoKitten.git",              majorVersion: 3),
<% } -%>
<% if(store.name === 'redis') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-redis.git",            majorVersion: 1),
<% } -%>
<% if(store.name === 'postgres') { -%>
        .Package(url: "https://github.com/IBM-Swift/Swift-Kuery-PostgreSQL.git",  majorVersion: 0),
<% } -%>
<% if(store.name === 'mysql') { -%>
        .Package(url: "https://github.com/vapor/mysql",                           majorVersion: 1),
<% } -%>
<% if(store.name === 'db2') { -%>
        .Package(url: "https://github.com/IBM-DTeam/swift-for-db2",               majorVersion: 1),
<% } -%>
<% }); -%>
<% if (metrics)  { %>
        .Package(url: "https://github.com/RuntimeTools/SwiftMetrics.git",         majorVersion: 0),
<% } -%>

        .Package(url: "https://github.com/IBM-Swift/Kitura.git",                  majorVersion: 1),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",            majorVersion: 1)
    ],
    exclude: []
)
