import Foundation

@objc(WidgetUpdateModule)
class WidgetUpdateModule: NSObject {
    @objc
    func updateQuotes(_ quotes: [String]) {
        if let dataManager = SharedDataManager() {
            dataManager.saveQuotes(quotes)
        } else {
            print("❌ WIDGET BRIDGE: Failed to initialize SharedDataManager.")
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
