/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import <objc/message.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

  #if DEBUG
    RCTBundleURLProvider *provider = [RCTBundleURLProvider sharedSettings];

    // RN versions differ on whether `jsBundleURLForBundleRoot:fallbackResource:` exists.
    SEL sel = @selector(jsBundleURLForBundleRoot:fallbackResource:);
    if ([provider respondsToSelector:sel]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      jsCodeLocation = (NSURL *)[provider performSelector:sel withObject:@"ios/index" withObject:nil];
#pragma clang diagnostic pop
    } else {
      jsCodeLocation = [provider jsBundleURLForBundleRoot:@"ios/index"];
    }

    // Extra safety: ensure we always pass a non-nil bundle URL to RCTRootView in Debug.
    if (jsCodeLocation == nil) {
      jsCodeLocation = [provider jsBundleURLForBundleRoot:@"index"];
    }
    if (jsCodeLocation == nil) {
      jsCodeLocation = [NSURL URLWithString:@"http://127.0.0.1:8081/ios/index.bundle?platform=ios&dev=true&minify=false"];
    }
  #else
    jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"KindeSDKRN"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if (self.authorizationFlowManagerDelegate != nil &&
      [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
    return YES;
  }
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    if (self.authorizationFlowManagerDelegate != nil &&
        [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL]) {
      return YES;
    }
  }
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end
