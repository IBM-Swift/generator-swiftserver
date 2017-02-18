import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ])
    ],
    dependencies: [

<% if(bluemix) { -%>
        .Package(url: "https://github.com/IBM-Swift/CloudConfiguration.git",     majorVersion: 0, minor: 0),
<% } else { -%>
        .Package(url: "https://github.com/IBM-Swift/Configuration.git",          majorVersion: 0),
<% } -%>
<% Object.keys(services).forEach(function(serviceType) { -%>
<% if(serviceType === 'cloudant') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-CouchDB.git",         majorVersion: 1),
<% } -%>
<% if(serviceType === 'mongodb') { -%>
        .Package(url: "https://github.com/tfrank64/MongoKitten.git",             majorVersion: 3),
<% } -%>
<% if(serviceType === 'redis') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura-redis.git",           majorVersion: 1),
<% } -%>
<% if(serviceType === 'postgresql') { -%>
        .Package(url: "https://github.com/IBM-Swift/Swift-Kuery-PostgreSQL.git", majorVersion: 0),
<% } -%>
<% if(serviceType === 'mysql') { -%>
        .Package(url: "https://github.com/vapor/mysql",                          majorVersion: 1),
<% } -%>
<% if(serviceType === 'objectstorage') { -%>
        .Package(url: "https://github.com/ibm-bluemix-mobile-services/bluemix    -objectstorage-serversdk-swift.git", majorVersion: 0),
<% } -%>
<% }); -%>
<% if (metrics)  { %>
        .Package(url: "https://github.com/RuntimeTools/SwiftMetrics.git",        majorVersion: 0),
<% } -%>

        .Package(url: "https://github.com/IBM-Swift/Kitura.git",                 majorVersion: 1),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",           majorVersion: 1)
    ],
    exclude: []
)
