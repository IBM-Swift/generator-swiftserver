import Foundation
import LoggerAPI
import SwiftyJSON
import CouchDB

public enum AdapterConfiguration: CustomStringConvertible {
    case memory
    case cloudant(ConnectionProperties)

    // NOTE: By default the associated values are included in the
    // description which could reveal passwords. This cumbersome
    // switch is the only reliable way I have found to return the
    // adapter name. This broad approach is compatible with translating
    // the adapter names into other languages.
    public var description: String {
        switch self {
        case .memory: return "memory"
        case .cloudant: return "cloudant"
        }
    }
}

public struct ApplicationConfiguration {
    public static let defaultPort: Int = 8090;
    public var port: Int
    public var adapterConfig: AdapterConfiguration

    public init(configURL: URL) throws {
        try self.init(json: JSON(data: try Data(contentsOf: configURL)))
    }

    public init(json: JSON?) throws {
        guard let json = json else {
            port = ApplicationConfiguration.defaultPort
            adapterConfig = .memory
            return
        }
        port = json["port"].int ?? ApplicationConfiguration.defaultPort

        let storeName = json["store"].string ??
                        json["store"].dictionary?["type"]?.string ??
                        "memory"
        switch storeName {
        case "memory":
            adapterConfig = .memory
        case "cloudant":
            adapterConfig = .cloudant(ConnectionProperties(
                host:     try extract(["store","host"],     from: json, defaultingTo: "localhost"),
                port:     try extract(["store","port"],     from: json, defaultingTo: 5984),
                secured:  try extract(["store","secured"],  from: json, defaultingTo: false),
                username: try extract(["store","username"], from: json, defaultingTo: nil),
                password: try extract(["store","password"], from: json, defaultingTo: nil)
            ))
        default:
            // TODO Throw ConfigurationError?
            adapterConfig = .memory
        }
    }

}

fileprivate func extract<T>(_ path: [String], from json: JSON?, defaultingTo defaultValue: T) throws -> T {
    guard let json = json, json[path].type != .null else {
        Log.debug("Using default value '\(defaultValue)' for '\(path.joined(separator: "."))'")
        return defaultValue
    }

    guard let value = T.self is Int16.Type  ? json[path].int16  as? T :
                      T.self is Int.Type    ? json[path].int    as? T :
                      T.self is Float.Type  ? json[path].float  as? T :
                      T.self is Double.Type ? json[path].double as? T :
                      json[path].rawValue as? T
                      else {
        throw ConfigurationError.typeMismatch(
            name: path.joined(separator: "."),
            expectedType: "\(T.self)",
            actualType: "\(json[path].type)"
        )
    }
    
    return value
}

public enum ConfigurationError: Error {
    case typeMismatch(name: String, expectedType: String, actualType: String)

    public func defaultMessage() -> String {
        switch self {
        case let .typeMismatch(name, expectedType, actualType):
            return "Type mismatch for JSON property '\(name)'. Wanted \(expectedType), got \(actualType)."
        }
    }
}
