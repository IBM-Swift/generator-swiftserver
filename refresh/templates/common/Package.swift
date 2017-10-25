// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    dependencies: [
      .package(url: "https://github.com/IBM-Swift/Kitura.git", .upToNextMinor(from: "1.7.9")),
      .package(url: "https://github.com/IBM-Swift/HeliumLogger.git", .upToNextMinor(from: "1.7.1")),
      .package(url: "https://github.com/IBM-Swift/CloudEnvironment.git", .upToNextMinor(from: "4.0.5")),
      .package(url: "https://github.com/IBM-Swift/Configuration.git", .upToNextMinor(from: "1.0.0")),
<%  dependencies.forEach(function(dependency) { -%>
      <%- dependency %>
<%  }) -%>
    ],
    targets: [
      .target(name: "<%- executableModule %>", dependencies: [ .target(name: "<%- applicationModule %>"), "Kitura" , "HeliumLogger"]),
      .target(name: "<%- applicationModule %>", dependencies: [ "Kitura", "Configuration", "CloudEnvironment",<% modules.forEach(function(module) { -%><%-module + "," %><%  })-%>
<%  if (appType === 'crud') { -%>
.target(name: "<%- generatedModule %>"),
<%  } _%>
<%  if (sdkTargets.length > 0) { -%>
<%    Object.keys(sdkTargets).forEach(function(target) { -%>
.target(name: "<%- sdkTargets[target] %>"),
<%    }); -%>
      ]),
<%    Object.keys(sdkTargets).forEach(function(target) { -%>
      .target(name: "<%- sdkTargets[target] %>", dependencies: ["ObjectMapper","SimpleHttpClient"], path: "Sources/<%- sdkTargets[target] %>" )
<%    }); -%>
<%  }else { _%>
      ]),
<%  } -%>
<%  if (appType === 'crud') { -%>
      .target(name: "<%- generatedModule %>", dependencies: ["Kitura","Configuration", "CloudEnvironment"], path: "Sources/<%- generatedModule %>"),
<%  } _%>
    ]
)
