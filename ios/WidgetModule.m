//
//  WidgetModule.m
//  Solace
//
//  Created by Admin on 2025-06-08.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

// This exposes the Swift module to React Native
@interface RCT_EXTERN_MODULE(WidgetModule, NSObject)

// This exposes the updateWidget function to React Native
// It now takes a single dictionary argument.
RCT_EXTERN_METHOD(updateWidget:(NSDictionary *)data)

@end
