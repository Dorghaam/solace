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
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(date: Date())
  }

  // Provides the view for a transient state (e.g., when the user is choosing a widget).
  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
    let entry = SimpleEntry(date: Date())
    completion(entry)
  }

  // Provides the timeline for future widget updates.
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    var entries: [SimpleEntry] = []

    // Generate a timeline consisting of five entries an hour apart, starting from the current date.
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = SimpleEntry(date: entryDate)
      entries.append(entry)
    }

    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
}

// This is the SwiftUI View that defines what your widget looks like.
struct SolaceWidgetEntryView: View {
  var entry: Provider.Entry

  var body: some View {
    VStack(spacing: 8) {
      Image(systemName: "heart.fill")
        .font(.title2)
        .foregroundColor(.pink)
      
      Text("Solace")
        .font(.headline)
        .fontWeight(.semibold)
      
      Text(entry.date, style: .time)
        .font(.caption)
        .foregroundColor(.secondary)
    }
    .padding()
    .background(Color(.systemBackground))
    .containerBackground(.fill.tertiary, for: .widget)
  }
}

// This is the main widget configuration.
struct SolaceWidget: Widget {
  let kind: String = "SolaceWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      if #available(iOS 17.0, *) {
        SolaceWidgetEntryView(entry: entry)
          .containerBackground(.fill.tertiary, for: .widget)
      } else {
        SolaceWidgetEntryView(entry: entry)
      }
    }
    .configurationDisplayName("Solace Widget")
    .description("Keep Solace close to your heart.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct SolaceWidget_Previews: PreviewProvider {
  static var previews: some View {
    SolaceWidgetEntryView(entry: SimpleEntry(date: Date()))
      .previewContext(WidgetPreviewContext(family: .systemSmall))
  }
}

// This bundles all your widgets together (we only have one).
@main
struct SolaceWidgets: WidgetBundle {
  var body: some Widget {
    SolaceWidget()
  }
} 