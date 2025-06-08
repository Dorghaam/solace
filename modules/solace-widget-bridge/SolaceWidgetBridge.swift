// modules/solace-widget-bridge/SolaceWidgetBridge.swift
import ExpoModulesCore
import WidgetKit

public class SolaceWidgetBridge: Module {
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use.
    Name("SolaceWidgetBridge")

    // Defines a function that can be called from JavaScript.
    // It takes one argument, a dictionary of [String: String].
    Function("update") { (data: [String: String]) in
      // Use the App Group identifier we configured in app.config.js
      if let userDefaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget") {
        
        // Get the text and theme from the dictionary.
        let text = data["quoteText"] ?? "Default text"
        let theme = data["theme"] ?? "light"

        // Save the data to the shared container.
        userDefaults.set(text, forKey: "widgetQuoteText")
        userDefaults.set(theme, forKey: "widgetTheme")
        
        print("✅ Widget data saved: \(text)")
        
        // Tell iOS to reload the widget's timeline to show the new data.
        WidgetCenter.shared.reloadAllTimelines()

      } else {
        print("❌ Failed to access App Group UserDefaults.")
      }
    }
  }
} 