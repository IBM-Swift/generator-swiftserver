public enum ModelError: Error {
    case requiredPropertyMissing(name: String)
    case extraneousProperty(name: String)
    case propertyTypeMismatch(name: String, type: String, value: String, valueType: String)
    func defaultMessage() -> String {
        switch self {
        case let .requiredPropertyMissing(name): return "Required property \(name) not provided"
        case let .extraneousProperty(name):      return "Property \(name) not found"
        case let .propertyTypeMismatch(name, type, value, valueType):
            return "Provided value (\(value)) for property '\(name)' has type (\(valueType))" +
                   " which is not compatible with the property type (\(type))"
        }
    }
}
