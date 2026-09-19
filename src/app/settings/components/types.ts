export interface Settings {
  // General
  siteName: string; siteUrl: string; siteDescription: string;
  adminEmail: string; tagline: string; language: string; timezone: string;
  // Notifications
  notifyNewUser: boolean; notifyNewComment: boolean; notifyNewSubscription: boolean;
  notifyWeeklyReport: boolean; notifySecurityAlerts: boolean;
  notifyProductUpdates: boolean; notifyMarketingEmails: boolean;
  // Moderation
  autoApproveComments: boolean; requireEmailVerification: boolean;
  enableSpamFilter: boolean; maxLoginAttempts: string;
  // Appearance
  theme: string; accentColor: string; postsPerPage: string;
  showAuthorBio: boolean; enableTableOfContents: boolean; enableSocialShare: boolean;
  // SMTP
  smtpHost: string; smtpPort: string; smtpUser: string;
  smtpPass: string; smtpFromEmail: string; smtpFromName: string;
}

export interface AppAnalytics {
  gtmId: string;
  gscVerification: string;
  label: string;
}

export interface AnalyticsConfig {
  apps: Record<string, AppAnalytics>;
  ga4IdWeb: string;
  metaPixelId: string;
  hotjarId: string;
  clarityId: string;
}

export const defaults: Settings = {
  siteName: "CodeSwayam", siteUrl: "https://codeswayam.com",
  siteDescription: "Empowering developers with SaaS insights and coding tutorials.",
  adminEmail: "admin@codeswayam.com", tagline: "Build. Learn. Grow.",
  language: "en", timezone: "Asia/Kolkata",
  notifyNewUser: true, notifyNewComment: true, notifyNewSubscription: true,
  notifyWeeklyReport: true, notifySecurityAlerts: true,
  notifyProductUpdates: false, notifyMarketingEmails: false,
  autoApproveComments: false, requireEmailVerification: true,
  enableSpamFilter: true, maxLoginAttempts: "5",
  theme: "light", accentColor: "#8b5cf6", postsPerPage: "10",
  showAuthorBio: true, enableTableOfContents: true, enableSocialShare: true,
  smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", smtpFromEmail: "", smtpFromName: "CodeSwayam",
};

export const defaultAnalytics: AnalyticsConfig = {
  apps: {},
  ga4IdWeb: "",
  metaPixelId: "",
  hotjarId: "",
  clarityId: "",
};
