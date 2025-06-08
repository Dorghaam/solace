import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "I cannot control how others act; only how I choose to react.")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let userDefaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget")
        let quoteText = userDefaults?.string(forKey: "widgetQuoteText") ?? "Your daily affirmation will appear here."
        let entry = SimpleEntry(date: Date(), quote: quoteText)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let userDefaults = UserDefaults(suiteName: "group.com.dorghaamhaidar.solace.iphone.widget")
        let quoteText = userDefaults?.string(forKey: "widgetQuoteText") ?? "Open Solace to set up your widget."
        let entry = SimpleEntry(date: Date(), quote: quoteText)
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            // ... your Color and Text views
        }
        // ADD THIS MODIFIER:
        .containerBackground(for: .widget) {
            // Put the background color you want here
            Color(red: 255/255, green: 247/255, blue: 245/255)
        }
    }
}
struct SolaceWidget: Widget {
    let kind: String = "SolaceWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SolaceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Affirmation")
        .description("Display a daily affirmation from your Solace app.")
        .supportedFamilies([.systemSmall])
    }
}
