import WidgetKit
import SwiftUI

// This is the data your widget needs to render a single state.
struct AffirmationEntry: TimelineEntry {
  let date: Date
  let text: String
  // You can add more properties here later, like theme, color, etc.
}

// This object provides the data (Timeline) for the widget.
struct Provider: TimelineProvider {
  // Provides a placeholder view for the widget gallery.
  func placeholder(in context: Context) -> AffirmationEntry {
    return AffirmationEntry(date: Date(), text: "You are enough.")
  }

  // Provides the view for a transient state (e.g., when the user is choosing a widget).
  func getSnapshot(in context: Context, completion: @escaping (AffirmationEntry) -> Void) {
    let entry = AffirmationEntry(date: Date(), text: "You are enough.")
    completion(entry)
  }

  // Provides the timeline for future widget updates.
  func getTimeline(in context:Context, completion: @escaping (Timeline<AffirmationEntry>) -> Void) {
    // Access the shared data container (App Group).
    let userDefaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget")
    
    // Read the quote text from the shared container.
    // If it's not there, use a default message.
    let text = userDefaults?.string(forKey: "widgetQuoteText") ?? "Open Solace to set a quote."
    
    // Create a single timeline entry for now.
    let entry = AffirmationEntry(date: Date(), text: text)

    // Tell WidgetKit to show this entry and not ask for another one until we tell it to.
    // We will manually trigger updates from the main app.
    let timeline = Timeline(entries: [entry], policy: .never)
    completion(timeline)
  }
}

// This is the SwiftUI View that defines what your widget looks like.
struct SolaceWidgetView: View {
  var entry: Provider.Entry

  var body: some View {
    // We'll use a ZStack to layer a background color behind the text.
    ZStack {
      // Use our light pink background color.
      Color(red: 255/255, green: 247/255, blue: 245/255) // #FFF7F5
      
      Text(entry.text)
        .font(.system(size: 16, weight: .semibold, design: .rounded))
        .foregroundColor(Color(white: 0.2)) // Dark Gray
        .multilineTextAlignment(.center)
        .padding()
    }
  }
}

// This is the main widget configuration.
struct SolaceWidget: Widget {
  let kind: String = "SolaceWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      SolaceWidgetView(entry: entry)
    }
    .configurationDisplayName("Daily Affirmation")
    .description("Shows an affirmation from your Solace app.")
    .supportedFamilies([.systemSmall]) // We will only support the small square widget.
  }
}

// This bundles all your widgets together (we only have one).
@main
struct SolaceWidgets: WidgetBundle {
  var body: some Widget {
    SolaceWidget()
  }
} 