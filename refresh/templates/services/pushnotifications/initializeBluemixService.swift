    let pushNotificationsService = try manager.getPushSDKService(name: "<%- service.name %>")

    pushNotifications = PushNotifications(service: pushNotificationsService, region: "<%- service.region %>")
