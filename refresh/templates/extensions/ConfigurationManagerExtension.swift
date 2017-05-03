import Configuration

let defaultPort = 8080

extension ConfigurationManager {

  public var port: Int { return (manager["PORT"] as? String).flatMap({ Int($0) }) ??
                                manager["port"] as? Int ??
                                defaultPort }

}
