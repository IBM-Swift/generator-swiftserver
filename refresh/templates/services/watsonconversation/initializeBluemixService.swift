    let service = try manager.getWatsonConversationService(name: "<%- service.name %>")

    conversation = Conversation(service: service)