import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    // This is the view shown in the widget gallery
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "I am worthy of peace and happiness.")
    }

    // This is the view shown for a moment when the widget is first added
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), quote: "I am healing and growing stronger.")
        completion(entry)
    }

    // This function builds the update schedule for the widget
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Load the quotes from our shared data manager
        let dataManager = SharedDataManager()
        var affirmations = dataManager?.loadQuotes() ?? []

        // If no quotes were loaded from the app yet, show a placeholder
        if affirmations.isEmpty {
            affirmations.append("Open Solace to update your widget with new affirmations.")
        }

        // Create a timeline of entries from the loaded quotes
        // Each quote will be displayed for 2 hours
        for index in 0..<affirmations.count {
            let entryDate = Calendar.current.date(byAdding: .hour, value: index * 2, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, quote: affirmations[index])
            entries.append(entry)
        }

        // After the last quote, the timeline ends and iOS will request a new one later.
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

// This is the data for a single widget view
struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

// This is the SwiftUI view that displays the widget
struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            Text(entry.quote)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundColor(Color(white: 0.2))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding()
        }
        .containerBackground(for: .widget) {
            Color(red: 255/255, green: 247/255, blue: 245/255)
        }
    }
}

// This is the main widget configuration struct
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

// This is the entry point that registers the widget
@main
struct SolaceWidgets: WidgetBundle {
    var body: some Widget {
        SolaceWidget()
    }
}
