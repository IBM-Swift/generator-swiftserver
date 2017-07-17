public enum AdapterError: Error {
    case invalidId(String?)
    case notFound(String)
    case idConflict(String)
    case unavailable(String)
    case internalError(String)
}
