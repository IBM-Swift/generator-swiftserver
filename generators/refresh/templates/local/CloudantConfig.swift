import SwiftyJSON
import Configuration

public struct CloudantConfig {

    public let host: String
    public let port: Int16
    public let secured: Bool
    public let username: String?
    public let password: String?

    public init(manager: ConfigurationManager) {

        host = manager["services:cloudant:0:host"] as? String ?? "localhost"
        port = manager["services:cloudant:0:port"] as? Int16 ?? 5984
        secured = manager["services:cloudant:0:secured"] as? Bool ?? false
        username = manager["services:cloudant:0:username"] as? String
        password = manager["services:cloudant:0:password"] as? String
    }

}
