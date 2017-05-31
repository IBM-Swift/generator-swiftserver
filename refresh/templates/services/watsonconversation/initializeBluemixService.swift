    let service = try manager.getWatsonConversationService(name: "<%- service.name %>")

    let version = "<%- service.version %>"

    conversation = Conversation(service: service, version: version)