
import PackageDescription

let applicationName = "<%- applicationName %>"

let applicationServerName =  "<%- applicationName %>Server"

let package = Package(
    name: applicationName,
    targets: [
      Target(name: applicationName, dependencies: []),
      Target(name: applicationServerName, dependencies: [ .Target(name: applicationName) ])
    ],
    dependencies: [

<% if(bluemix) { -%>
        .Package(url: "https://github.ibm.com/IBM-Swift/bluemix-config.git",      majorVersion: 0),
<% } else { -%>
        .Package(url: "https://github.ibm.com/IBM-Swift/swift-configuration.git", majorVersion: 0),
<% } -%>
<% datastores.forEach(function(store) { -%>
<% if(store === 'cloudant') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-CouchDB.git",          majorVersion: 1),
<% } -%>
<% if(store === 'mongo') { -%>
        .Package(url: "https://github.com/tfrank64/MongoKitten.git",              majorVersion: 3),
<% } -%>
<% if(store === 'redis') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-redis.git",            majorVersion: 1),
<% } -%>
<% if(store === 'postgres') { -%>
        .Package(url: "https://github.com/IBM-Swift/Swift-Kuery-PostgreSQL.git",  majorVersion: 0),
<% } -%>
<% if(store === 'mysql') { -%>
        .Package(url: "https://github.com/vapor/mysql",                           majorVersion: 1),
<% } -%>
<% if(store === 'db2') { -%>
        .Package(url: "https://github.com/IBM-DTeam/swift-for-db2",               majorVersion: 1),
<% } -%>
<% }); -%>

        .Package(url: "https://github.com/IBM-Swift/Kitura.git",                  majorVersion: 1),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",            majorVersion: 1)
    ],
    exclude: []
)
