import WidgetKit
import SwiftUI

// 1. PROVIDER: Feeds data and updates to the widget
struct Provider: TimelineProvider {
    // A generic placeholder for the widget gallery
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "You are worthy of peace and happiness.")
    }

    // The snapshot for a single moment in time
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let dataManager = SharedDataManager()
        let quoteText = dataManager?.loadQuote() ?? "Your affirmation will appear here."
        let entry = SimpleEntry(date: Date(), quote: quoteText)
        completion(entry)
    }

    // The timeline of future updates
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let dataManager = SharedDataManager()
        let quoteText = dataManager?.loadQuote() ?? "Open Solace to set up your widget."
        let entry = SimpleEntry(date: Date(), quote: quoteText)
        
        // We only need one entry, and we'll update it manually from the app
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

// 2. ENTRY: The data model for one instance of the widget
struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

// 3. VIEW: The SwiftUI code for what the widget looks like
struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        // ZStack is a container that lets us layer views.
        ZStack {
            // The Text view goes INSIDE the ZStack
            VStack {
                Text(entry.quote)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(Color(white: 0.2)) // Dark gray text
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .minimumScaleFactor(0.5) // Let text shrink if it's too long
            }
            .padding()
        }
        // The .containerBackground modifier is applied to the ZStack
        .containerBackground(for: .widget) {
            // The background color goes here
            Color(red: 255/255, green: 247/255, blue: 245/255) // Your app's pinkish color
        }
    }
}

// 4. WIDGET: The main configuration that ties it all together
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

// 5. BUNDLE: Registers all your widgets (we only have one)
// This @main attribute makes it the entry point for the widget extension
@main
struct SolaceWidgetBundle: WidgetBundle {
    var body: some Widget {
        SolaceWidget()
    }
}
