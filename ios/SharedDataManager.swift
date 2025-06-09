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
        print("✅ SharedDataManager initialized with suite: group.com.dorghaamhaidar.solace.iphone.widget")
    }

    // Saves an array of quote strings
    func saveQuotes(_ quotes: [String]) {
        print("📝 SharedDataManager: Saving quotes: \(quotes)")
        userDefaults.set(quotes, forKey: "widgetQuotesArray")
        userDefaults.synchronize() // Force synchronization
        
        // Verify the save worked
        let savedQuotes = userDefaults.stringArray(forKey: "widgetQuotesArray") ?? []
        print("✅ SharedDataManager: Verified saved quotes: \(savedQuotes)")
        
        // Reload both home screen and lock screen widgets
        WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "SolaceLockScreenWidget")
        print("🔄 SharedDataManager: Both home and lock screen widget timelines reloaded")
    }

    // Loads the array of quote strings
    func loadQuotes() -> [String] {
        let quotes = userDefaults.stringArray(forKey: "widgetQuotesArray") ?? []
        print("📖 SharedDataManager: Loading quotes: \(quotes)")
        return quotes
    }
}
