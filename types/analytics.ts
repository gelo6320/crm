// types/analytics.ts
export interface AnalyticsDashboard {
    currentPeriod: {
      periodKey: string;
      period: 'daily' | 'weekly' | 'monthly' | 'yearly';
      analytics: AdvancedAnalytics;
    };
    insights: AnalyticsInsight[];
    comparison?: {
      engagementChange: number;
      confidenceChange: number;
      sampleSizeChange: number;
    };
    summary: {
      overallScore: number;
      confidence: number;
      sampleSize: number;
      topInteraction: string;
      peakHour: number;
      topSource: string;
    };
    lastUpdated: string;
  }
  
  export interface AdvancedAnalytics {
    _id?: string;
    date: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    periodKey: string;
    
    temporalPatterns: TemporalPatterns;
    engagement: EngagementMetrics;
    behavioralHeatmap: BehavioralHeatmap;
    funnelAnalysis: FunnelAnalysis;
    userSegmentation: UserSegmentation;
    contentPerformance: ContentPerformance;
    sessionQuality: SessionQuality;
    predictions: Predictions;
    
    calculatedAt: string;
    dataSourcesUsed: string[];
    confidence: number;
    sampleSize: number;
  }
  
  export interface TemporalPatterns {
    hourlyDistribution: HourlyDistribution[];
    weeklyDistribution: WeeklyDistribution[];
    weeklyTrends: {
      growth: number;
      momentum: 'accelerating' | 'stable' | 'declining';
      seasonality: number;
    };
  }
  
  export interface HourlyDistribution {
    hour: number;
    visits: number;
    pageViews: number;
    engagement: number;
    conversions: number;
  }
  
  export interface WeeklyDistribution {
    dayOfWeek: number;
    dayName: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    visits: number;
    avgEngagement: number;
    peakHour: number;
  }
  
  export interface EngagementMetrics {
    overallScore: number;
    components: {
      timeEngagement: number;
      interactionEngagement: number;
      depthEngagement: number;
      conversionEngagement: number;
    };
    bySource: EngagementBySource[];
    byDevice: {
      mobile: { score: number; userCount: number };
      desktop: { score: number; userCount: number };
    };
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
  }
  
  export interface EngagementBySource {
    source: string;
    score: number;
    userCount: number;
  }
  
  export interface BehavioralHeatmap {
    interactionHotspots: InteractionHotspot[];
    scrollBehavior: ScrollBehavior;
    navigationPatterns: NavigationPattern[];
  }
  
  export interface InteractionHotspot {
    elementType: 'button' | 'form' | 'link' | 'image' | 'video' | 'text' | 'page' | 'unknown';
    elementId: string;
    interactions: number;
    uniqueUsers: number;
    heatScore: number;
  }
  
  export interface ScrollBehavior {
    avgDepth: number;
    completionRate: number;
    dropOffPoints: { depth: number; dropOffRate: number }[];
    fastScrollers: number;
    slowReaders: number;
  }
  
  export interface NavigationPattern {
    pattern: string;
    frequency: number;
    conversionRate: number;
    avgSessionValue: number;
  }
  
  export interface FunnelAnalysis {
    steps: FunnelStep[];
    overall: {
      totalEntries: number;
      totalCompletions: number;
      completionRate: number;
      avgTimeToComplete: number;
      bottleneckStep: string;
    };
    bySource: { source: string; completionRate: number; avgTimeToComplete: number }[];
  }
  
  export interface FunnelStep {
    stepName: string;
    stepOrder: number;
    entries: number;
    exits: number;
    conversions: number;
    dropOffRate: number;
    avgTimeInStep: number;
  }
  
  export interface UserSegmentation {
    behavioralClusters: BehavioralCluster[];
    geographic: GeographicSegment[];
    valueSegments: {
      highValue: { count: number; avgValue: number };
      mediumValue: { count: number; avgValue: number };
      lowValue: { count: number; avgValue: number };
    };
  }
  
  export interface BehavioralCluster {
    clusterName: string;
    userCount: number;
    characteristics: {
      avgSessionDuration: number;
      avgPageViews: number;
      conversionRate: number;
      preferredDevice: string;
      topSources: string[];
    };
  }
  
  export interface GeographicSegment {
    region: string;
    userCount: number;
    engagement: number;
    conversionRate: number;
    topContent: string[];
  }
  
  export interface ContentPerformance {
    topPages: TopPage[];
    categories: ContentCategory[];
    exitAnalysis: ExitAnalysis[];
  }
  
  export interface TopPage {
    url: string;
    visits: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    bounceRate: number;
    conversionRate: number;
    engagementScore: number;
    rank: number;
  }
  
  export interface ContentCategory {
    category: string;
    pageCount: number;
    totalViews: number;
    avgEngagement: number;
    conversionContribution: number;
  }
  
  export interface ExitAnalysis {
    url: string;
    exitRate: number;
    beforeExitActions: string[];
    improvementOpportunity: number;
  }
  
  export interface SessionQuality {
    qualityDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    indicators: {
      avgPagesPerSession: number;
      avgSessionDuration: number;
      interactionRate: number;
      goalCompletionRate: number;
    };
    byTrafficSource: QualityBySource[];
  }
  
  export interface QualityBySource {
    source: string;
    avgQualityScore: number;
    sessionCount: number;
  }
  
  export interface Predictions {
    conversionPropensity: {
      nextWeekPrediction: number;
      confidence: number;
      factors: PredictionFactor[];
    };
    churnRisk: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
    growthForecast: {
      nextPeriodGrowth: number;
      seasonalityFactor: number;
      trendMomentum: 'accelerating' | 'stable' | 'declining';
    };
  }
  
  export interface PredictionFactor {
    factor: string;
    weight: number;
    trend: 'positive' | 'negative' | 'neutral';
  }
  
  export interface AnalyticsInsight {
    id?: string;
    type: string;
    category: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    recommendation?: string;
    value?: number;
    change?: number;
  }
  
  export interface EngagementTrendData {
    period: string;
    days: number;
    dateRange: {
      from: string;
      to: string;
    };
    chartData: EngagementChartData[];
    stats: {
      avgOverallScore: number;
      bestDay: { overallScore: number; date: string };
      worstDay: { overallScore: number; date: string };
      trend: 'stable' | 'improving' | 'declining';
    };
    trend: {
      trend: 'stable' | 'improving' | 'declining';
    };
    totalRecords: number;
  }
  
  export interface EngagementChartData {
    date: string;
    overallScore: number;
    timeEngagement: number;
    interactionEngagement: number;
    depthEngagement: number;
    conversionEngagement: number;
  }
  
  export interface HeatmapData {
    periodKey: string;
    period: string;
    date: string;
    hotspots: ProcessedHotspot[];
    scrollBehavior: ScrollAnalysis;
    navigationPatterns: NavigationInsight[];
    summary: {
      totalHotspots: number;
      topElementType: string;
      avgScrollDepth: number;
      topPattern: string;
    };
    lastUpdated: string;
  }
  
  export interface ProcessedHotspot extends InteractionHotspot {
    intensity: number;
    category: string;
    efficiency: number;
  }
  
  export interface ScrollAnalysis extends ScrollBehavior {
    recommendations: ScrollRecommendation[];
  }
  
  export interface ScrollRecommendation {
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }
  
  export interface NavigationInsight extends NavigationPattern {
    insight: string;
    efficiency: number;
  }
  
  // Temporal Analysis - Unified interface
  export interface TemporalAnalysis {
    period: string;
    weeks: number;
    dateRange: {
      from: string;
      to: string;
    };
    hourlyDistribution: HourlyPattern[];
    weeklyDistribution: WeeklyDistribution[];
    insights: {
      peakHour: { hour: number; time: string; visits: number };
      peakDay: { day: string; visits: number };
      patterns: TemporalInsight[];
    };
    recordsAnalyzed: number;
    weeklyTrends?: {
      growth: number;
      momentum: string;
      seasonality: number;
    };
  }
  
  export interface HourlyPattern extends HourlyDistribution {
    time: string;
    avgVisits: number;
    avgPageViews: number;
    avgEngagement: number;
    avgConversions: number;
    count: number;
  }
  
  export interface TemporalInsight {
    type: string;
    message: string;
    recommendation: string;
  }
  
  export interface GenerateAnalyticsRequest {
    startDate: string;
    endDate: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    force?: boolean;
  }
  
  export interface GenerateAnalyticsResponse {
    message: string;
    periodKey: string;
    analytics: AdvancedAnalytics;
    generated: boolean;
  }
  
  export interface InsightsResponse {
    periodKey: string;
    period: string;
    insights: AnalyticsInsight[];
    comparativeInsights: AnalyticsInsight[];
    summary: {
      totalInsights: number;
      highPriority: number;
      categories: string[];
    };
    analytics: {
      overallScore: number;
      confidence: number;
      sampleSize: number;
    };
  }