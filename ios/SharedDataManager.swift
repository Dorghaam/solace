// In Solace/SharedDataManager.swift
import Foundation
import WidgetKit

class SharedDataManager {

    private let userDefaults: UserDefaults

    init?() {
        // This is the App Group ID we configured.
        guard let defaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") else {
            print("❌ FATAL ERROR: Could not initialize UserDefaults with the App Group suite name.")
            return nil
        }
        self.userDefaults = defaults
    }

    // Saves the quote string to the shared container.
    func saveQuote(_ quoteText: String) {
        userDefaults.set(quoteText, forKey: "widgetQuoteText")
        
        // This command tells iOS that the widget's data has changed and it should reload.
        // "SolaceWidget" must match the `kind` string in your widget's code.
        WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
        print("✅ SharedDataManager: Quote saved and widget timeline reloaded.")
    }

    // Loads the quote string from the shared container.
    func loadQuote() -> String? {
        return userDefaults.string(forKey: "widgetQuoteText")
    }
}
