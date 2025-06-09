// In Solace/SharedDataManager.swift
import Foundation
import WidgetKit

class SharedDataManager {
    private let userDefaults: UserDefaults

    init?() {
        guard let defaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") else {
            print("❌ Could not initialize UserDefaults.")
            return nil
        }
        self.userDefaults = defaults
    }

    // Saves an array of quote strings
    func saveQuotes(_ quotes: [String]) {
        userDefaults.set(quotes, forKey: "widgetQuotesArray")
        WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
        print("✅ Quotes array saved and widget timeline reloaded.")
    }

    // Loads the array of quote strings
    func loadQuotes() -> [String] {
        return userDefaults.stringArray(forKey: "widgetQuotesArray") ?? []
    }
}
