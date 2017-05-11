var username: String?
var password: String?

let version = "<%- service.version %>"
let workspaceID: String = "<%- service.workspaceID %>"

var conversation: Conversation?

let failure = { (error: Swift.Error) in print(error) }

var context: Context? // save context to continue conversation

