
    let pushNotificationsService = try manager.getPushNotificationsService(name: "<%- service.name %>")
    pushNotifications = PushNotifications(service: pushNotificationsService)
