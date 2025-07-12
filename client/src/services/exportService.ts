import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { AnalyticsData, AttendanceRecord, ExecutiveSummary, OperationalIntelligence } from '../types';

// Enhanced data processing utilities
class DataProcessor {
  static generateExecutiveSummary(analytics: AnalyticsData, dateRange: { start: string; end: string }): ExecutiveSummary {
    const totalEmployees = analytics.departmentStats.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    const overallAttendanceRate = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
    const punctualityRate = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgPunctualityRate, 0) / analytics.departmentStats.length;
    const totalLateIncidents = analytics.departmentStats.reduce((sum, dept) => sum + dept.lateArrivals, 0);
    const totalCostImpact = analytics.departmentStats.reduce((sum, dept) => sum + (dept.costImpact || 0), 0);
    
    return {
      reportPeriod: {
        startDate: dateRange.start,
        endDate: dateRange.end,
        workingDays: this.calculateWorkingDays(dateRange.start, dateRange.end)
      },
      keyMetrics: {
        totalEmployees,
        overallAttendanceRate: Math.round(overallAttendanceRate),
        punctualityRate: Math.round(punctualityRate),
        avgDailyAttendance: Math.round(totalEmployees * (overallAttendanceRate / 100)),
        totalLateIncidents,
        costImpact: totalCostImpact,
        productivityIndex: this.calculateProductivityIndex(analytics),
        complianceScore: this.calculateComplianceScore(analytics)
      },
      trends: {
        attendanceTrend: this.determineTrend(analytics.weeklyTrends.map(w => w.attendance)),
        punctualityTrend: this.determineTrend(analytics.weeklyTrends.map(w => w.punctuality)),
        weekOverWeekChange: this.calculateWeekOverWeekChange(analytics.weeklyTrends),
        monthOverMonthChange: this.calculateMonthOverMonthChange(analytics.weeklyTrends),
        seasonalFactors: this.identifySeasonalFactors(analytics)
      },
      criticalInsights: {
        topConcerns: this.identifyTopConcerns(analytics),
        quickWins: this.identifyQuickWins(analytics),
        longTermActions: this.identifyLongTermActions(analytics),
        budgetImpact: totalCostImpact
      },
      departmentHighlights: this.generateDepartmentHighlights(analytics.departmentStats),
      employeeInsights: this.generateEmployeeInsights(analytics.topPerformers)
    };
  }

  static generateOperationalIntelligence(analytics: AnalyticsData, records: AttendanceRecord[]): OperationalIntelligence {
    return {
      dailyAlerts: this.generateDailyAlerts(analytics),
      patternDetection: {
        unusualPatterns: this.detectUnusualPatterns(analytics),
        emergingTrends: this.identifyEmergingTrends(analytics),
        seasonalFactors: this.identifySeasonalFactors(analytics),
        externalFactors: this.identifyExternalFactors(records)
      },
      resourceOptimization: {
        overstaffedHours: this.identifyOverstaffedHours(analytics.timePatterns),
        understaffedHours: this.identifyUnderstaffedHours(analytics.timePatterns),
        optimalShiftTimes: this.calculateOptimalShiftTimes(analytics.timePatterns),
        capacityUtilization: this.calculateCapacityUtilization(analytics)
      },
      complianceTracking: {
        regulatoryCompliance: this.calculateRegulatoryCompliance(analytics),
        policyViolations: this.countPolicyViolations(records),
        auditReadiness: this.calculateAuditReadiness(analytics),
        documentationGaps: this.identifyDocumentationGaps(records)
      }
    };
  }

  private static calculateWorkingDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let workingDays = 0;
    
    while (startDate <= endDate) {
      const day = startDate.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return workingDays;
  }

  private static calculateProductivityIndex(analytics: AnalyticsData): number {
    const avgProductivity = analytics.departmentStats.reduce((sum, dept) => sum + (dept.productivityScore || 70), 0) / analytics.departmentStats.length;
    return Math.round(avgProductivity);
  }

  private static calculateComplianceScore(analytics: AnalyticsData): number {
    const attendanceWeight = 0.4;
    const punctualityWeight = 0.3;
    const policyWeight = 0.3;
    
    const avgAttendance = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
    const avgPunctuality = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgPunctualityRate, 0) / analytics.departmentStats.length;
    const policyScore = 85; // Base policy compliance score
    
    return Math.round((avgAttendance * attendanceWeight) + (avgPunctuality * punctualityWeight) + (policyScore * policyWeight));
  }

  private static determineTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
  }

  private static calculateWeekOverWeekChange(weeklyTrends: { attendance: number; punctuality: number; avgHours: number; week: string; overtime: number; productivity: number; anomalies: string[]; }[]): number {
    if (weeklyTrends.length < 2) return 0;
    
    const current = weeklyTrends[weeklyTrends.length - 1];
    const previous = weeklyTrends[weeklyTrends.length - 2];
    
    return Math.round(((current.attendance - previous.attendance) / previous.attendance) * 100);
  }

  private static calculateMonthOverMonthChange(weeklyTrends: { attendance: number; punctuality: number; avgHours: number; week: string; overtime: number; productivity: number; anomalies: string[]; }[]): number {
    if (weeklyTrends.length < 4) return 0;
    
    const recentMonth = weeklyTrends.slice(-4).reduce((sum, week) => sum + week.attendance, 0) / 4;
    const previousMonth = weeklyTrends.slice(-8, -4).reduce((sum, week) => sum + week.attendance, 0) / 4;
    
    return Math.round(((recentMonth - previousMonth) / previousMonth) * 100);
  }

  private static identifySeasonalFactors(analytics: AnalyticsData): string[] {
    const factors: string[] = [];
    
    // Analyze late arrival trends for weather patterns
    const weatherImpactedDays = analytics.lateArrivalTrends.filter(trend => trend.weatherImpact).length;
    if (weatherImpactedDays > 0) {
      factors.push('Weather-related attendance impacts detected');
    }
    
    // Analyze common reasons for seasonal patterns
    const seasonalReasons = analytics.lateArrivalTrends
      .flatMap(trend => trend.commonReasons)
      .filter(reason => reason.toLowerCase().includes('weather') || reason.toLowerCase().includes('transport'));
    
    if (seasonalReasons.length > 0) {
      factors.push('Transportation and weather challenges identified');
    }
    
    return factors;
  }

  private static identifyTopConcerns(analytics: AnalyticsData): string[] {
    const concerns: string[] = [];
    
    // High-risk departments
    const highRiskDepts = analytics.departmentStats.filter(dept => dept.riskLevel === 'high');
    if (highRiskDepts.length > 0) {
      concerns.push(`${highRiskDepts.length} department(s) at high risk: ${highRiskDepts.map(d => d.department).join(', ')}`);
    }
    
    // Low attendance rates
    const lowAttendanceDepts = analytics.departmentStats.filter(dept => dept.avgAttendanceRate < 80);
    if (lowAttendanceDepts.length > 0) {
      concerns.push(`Low attendance in ${lowAttendanceDepts.length} department(s)`);
    }
    
    // High late arrival rates
    const totalLateArrivals = analytics.departmentStats.reduce((sum, dept) => sum + dept.lateArrivals, 0);
    const totalEmployees = analytics.departmentStats.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    const lateArrivalRate = (totalLateArrivals / totalEmployees) * 100;
    
    if (lateArrivalRate > 15) {
      concerns.push(`High late arrival rate: ${Math.round(lateArrivalRate)}%`);
    }
    
    return concerns;
  }

  private static identifyQuickWins(analytics: AnalyticsData): string[] {
    const wins: string[] = [];
    
    // Time pattern optimizations
    const peakHours = analytics.timePatterns
      .filter(pattern => pattern.checkIns > pattern.avgEmployees * 1.2)
      .map(pattern => `${pattern.hour}:00`);
    
    if (peakHours.length > 0) {
      wins.push(`Optimize check-in process during peak hours: ${peakHours.join(', ')}`);
    }
    
    // Note analysis insights
    if (analytics.noteAnalysis) {
      const topCategory = analytics.noteAnalysis.categories
        .sort((a, b) => b.count - a.count)[0];
      
      if (topCategory && topCategory.category === 'transport') {
        wins.push('Implement flexible start times for transport-related delays');
      }
    }
    
    return wins;
  }

  private static identifyLongTermActions(analytics: AnalyticsData): string[] {
    const actions: string[] = [];
    
    // Declining performance trends
    const decliningPerformers = analytics.topPerformers.filter(performer => performer.improvementTrend === 'declining');
    if (decliningPerformers.length > 0) {
      actions.push(`Develop support programs for ${decliningPerformers.length} declining performers`);
    }
    
    // Department-specific improvements
    const underperformingDepts = analytics.departmentStats.filter(dept => dept.avgAttendanceRate < 85);
    if (underperformingDepts.length > 0) {
      actions.push(`Implement targeted improvement plans for ${underperformingDepts.length} departments`);
    }
    
    return actions;
  }

  private static generateDepartmentHighlights(departmentStats: AnalyticsData['departmentStats']): {
    bestPerforming: string;
    needsAttention: string;
    mostImproved: string;
    riskiest: string;
  } {
    const sortedByAttendance = [...departmentStats].sort((a, b) => b.avgAttendanceRate - a.avgAttendanceRate);
    const sortedByImprovement = [...departmentStats].sort((a, b) => (b.productivityScore || 0) - (a.productivityScore || 0));
    
    return {
      bestPerforming: sortedByAttendance[0]?.department || 'N/A',
      needsAttention: sortedByAttendance[sortedByAttendance.length - 1]?.department || 'N/A',
      mostImproved: sortedByImprovement[0]?.department || 'N/A',
      riskiest: departmentStats.find(dept => dept.riskLevel === 'high')?.department || 'N/A'
    };
  }

  private static generateEmployeeInsights(topPerformers: AnalyticsData['topPerformers']): {
    topPerformers: string[];
    riskEmployees: string[];
    newHires: string[];
    improvingEmployees: string[];
  } {
    const improving = topPerformers.filter(p => p.improvementTrend === 'improving');
    const atRisk = topPerformers.filter(p => p.improvementTrend === 'declining');
    
    return {
      topPerformers: topPerformers.slice(0, 3).map(p => p.employee.name),
      riskEmployees: atRisk.map(p => p.employee.name),
      newHires: [], // Would need additional data
      improvingEmployees: improving.map(p => p.employee.name)
    };
  }

  private static generateDailyAlerts(analytics: AnalyticsData): OperationalIntelligence['dailyAlerts'] {
    const alerts: OperationalIntelligence['dailyAlerts'] = [];
    
    // High late arrival rate alert
    const totalLateArrivals = analytics.departmentStats.reduce((sum, dept) => sum + dept.lateArrivals, 0);
    const totalEmployees = analytics.departmentStats.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    const lateArrivalRate = (totalLateArrivals / totalEmployees) * 100;
    
    if (lateArrivalRate > 20) {
      alerts.push({
        type: 'punctuality',
        severity: 'high',
        message: `Late arrival rate is ${Math.round(lateArrivalRate)}% - exceeds threshold`,
        affectedEmployees: [],
        recommendedAction: 'Review flexible work arrangements and transport solutions'
      });
    }
    
    // Low attendance departments
    const lowAttendanceDepts = analytics.departmentStats.filter(dept => dept.avgAttendanceRate < 75);
    if (lowAttendanceDepts.length > 0) {
      alerts.push({
        type: 'attendance',
        severity: 'medium',
        message: `${lowAttendanceDepts.length} department(s) have attendance below 75%`,
        affectedEmployees: [],
        recommendedAction: 'Investigate department-specific attendance issues'
      });
    }
    
    return alerts;
  }

  private static detectUnusualPatterns(analytics: AnalyticsData): string[] {
    const patterns: string[] = [];
    
    // Check for unusual time patterns
    const timePatterns = analytics.timePatterns;
    const avgCheckIns = timePatterns.reduce((sum, pattern) => sum + pattern.checkIns, 0) / timePatterns.length;
    
    const unusualHours = timePatterns.filter(pattern => pattern.checkIns > avgCheckIns * 2 || pattern.checkIns < avgCheckIns * 0.5);
    
    if (unusualHours.length > 0) {
      patterns.push(`Unusual check-in patterns detected at ${unusualHours.map(h => h.hour + ':00').join(', ')}`);
    }
    
    return patterns;
  }

  private static identifyEmergingTrends(analytics: AnalyticsData): string[] {
    const trends: string[] = [];
    
    // Weekly trend analysis
    const weeklyTrends = analytics.weeklyTrends;
    if (weeklyTrends.length >= 3) {
      const recent = weeklyTrends.slice(-3);
      const attendanceChange = recent[2].attendance - recent[0].attendance;
      
      if (attendanceChange > 5) {
        trends.push('Improving attendance trend over last 3 weeks');
      } else if (attendanceChange < -5) {
        trends.push('Declining attendance trend - requires attention');
      }
    }
    
    return trends;
  }

  private static identifyExternalFactors(records: AttendanceRecord[]): string[] {
    const factors: string[] = [];
    
    // Weather impact analysis
    const weatherImpactedRecords = records.filter(record => record.weather && record.isLate);
    if (weatherImpactedRecords.length > 0) {
      factors.push('Weather conditions affecting attendance patterns');
    }
    
    // Transport issues
    const transportIssues = records.filter(record => 
      record.notes && record.notes.toLowerCase().includes('transport')
    );
    if (transportIssues.length > 0) {
      factors.push('Transportation challenges identified in employee notes');
    }
    
    return factors;
  }

  private static identifyOverstaffedHours(timePatterns: AnalyticsData['timePatterns']): number[] {
    const avgEmployees = timePatterns.reduce((sum, pattern) => sum + pattern.avgEmployees, 0) / timePatterns.length;
    return timePatterns
      .filter(pattern => pattern.avgEmployees > avgEmployees * 1.3)
      .map(pattern => pattern.hour);
  }

  private static identifyUnderstaffedHours(timePatterns: AnalyticsData['timePatterns']): number[] {
    const avgEmployees = timePatterns.reduce((sum, pattern) => sum + pattern.avgEmployees, 0) / timePatterns.length;
    return timePatterns
      .filter(pattern => pattern.avgEmployees < avgEmployees * 0.7)
      .map(pattern => pattern.hour);
  }

  private static calculateOptimalShiftTimes(timePatterns: AnalyticsData['timePatterns']): string[] {
    const optimalTimes: string[] = [];
    
    // Find hours with good balance of check-ins and productivity
    const balancedHours = timePatterns
      .filter(pattern => pattern.productivity > 75 && pattern.checkIns > 0)
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 3);
    
    balancedHours.forEach(hour => {
      optimalTimes.push(`${hour.hour}:00-${hour.hour + 1}:00`);
    });
    
    return optimalTimes;
  }

  private static calculateCapacityUtilization(analytics: AnalyticsData): number {
    const avgAttendance = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
    
    return Math.round(avgAttendance);
  }

  private static calculateRegulatoryCompliance(analytics: AnalyticsData): number {
    // Base compliance calculation
    const attendanceCompliance = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
    const punctualityCompliance = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgPunctualityRate, 0) / analytics.departmentStats.length;
    
    return Math.round((attendanceCompliance + punctualityCompliance) / 2);
  }

  private static countPolicyViolations(records: AttendanceRecord[]): number {
    // Count significant late arrivals as policy violations
    return records.filter(record => record.isLate && record.lateMinutes && record.lateMinutes > 30).length;
  }

  private static calculateAuditReadiness(analytics: AnalyticsData): number {
    const complianceScore = this.calculateRegulatoryCompliance(analytics);
    const documentationScore = 85; // Base documentation score
    
    return Math.round((complianceScore + documentationScore) / 2);
  }

  private static identifyDocumentationGaps(records: AttendanceRecord[]): string[] {
    const gaps: string[] = [];
    
    // Check for records without proper notes
    const missingNotes = records.filter(record => record.isLate && !record.notes).length;
    if (missingNotes > 0) {
      gaps.push(`${missingNotes} late arrival records missing explanatory notes`);
    }
    
    // Check for verification method gaps
    const missingVerification = records.filter(record => !record.verificationMethod).length;
    if (missingVerification > 0) {
      gaps.push(`${missingVerification} records missing verification method`);
    }
    
    return gaps;
  }
}

export interface ExportOptions {
  dateRange: {
    start: string;
    end: string;
  };
  reportType: string;
  selectedDepartment: string;
  analytics: AnalyticsData;
  includeCharts?: boolean;
  includeNotes?: boolean;
}

class ExportService {
  async exportToPDF(options: ExportOptions, chartElement?: HTMLElement): Promise<void> {
    const { dateRange, analytics, reportType } = options;
    const pdf = new jsPDF();
    
    // Add title and header
    pdf.setFontSize(20);
    pdf.text('WorkBeat Analytics Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Report Type: ${reportType}`, 20, 50);
    pdf.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 20, 60);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 70);
    
    let yPosition = 90;
    
    // Overview statistics
    if (analytics) {
      pdf.setFontSize(16);
      pdf.text('Overview Statistics', 20, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(12);
      const totalEmployees = analytics.departmentStats.reduce((sum: number, dept) => sum + dept.totalEmployees, 0);
      const avgAttendanceRate = analytics.departmentStats.reduce((sum: number, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
      const totalLateArrivals = analytics.departmentStats.reduce((sum: number, dept) => sum + dept.lateArrivals, 0);
      
      pdf.text(`Total Employees: ${totalEmployees}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Average Attendance Rate: ${Math.round(avgAttendanceRate)}%`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Total Late Arrivals: ${totalLateArrivals}`, 20, yPosition);
      yPosition += 20;
      
      // Department Statistics
      pdf.setFontSize(16);
      pdf.text('Department Statistics', 20, yPosition);
      yPosition += 20;
      
      analytics.departmentStats.forEach((dept) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFontSize(12);
        pdf.text(`${dept.department}:`, 20, yPosition);
        yPosition += 10;
        pdf.text(`  Employees: ${dept.totalEmployees}`, 30, yPosition);
        yPosition += 8;
        pdf.text(`  Attendance Rate: ${dept.avgAttendanceRate}%`, 30, yPosition);
        yPosition += 8;
        pdf.text(`  Punctuality Rate: ${dept.avgPunctualityRate}%`, 30, yPosition);
        yPosition += 8;
        pdf.text(`  Late Arrivals: ${dept.lateArrivals}`, 30, yPosition);
        yPosition += 15;
      });
      
      // Top Performers
      if (analytics.topPerformers.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFontSize(16);
        pdf.text('Top Performers', 20, yPosition);
        yPosition += 20;
        
        analytics.topPerformers.slice(0, 5).forEach((performer, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(12);
          pdf.text(`${index + 1}. ${performer.employee.name}`, 20, yPosition);
          yPosition += 10;
          pdf.text(`   Attendance: ${performer.attendanceRate}%`, 30, yPosition);
          yPosition += 8;
          pdf.text(`   Punctuality: ${performer.punctualityRate}%`, 30, yPosition);
          yPosition += 15;
        });
      }
    }
    
    // Include chart if provided
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement);
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Charts & Visualizations', 20, 30);
        
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }
    
    // Save the PDF
    pdf.save(`workbeat-analytics-${dateRange.start}-to-${dateRange.end}.pdf`);
  }
  
  async exportToCSV(options: ExportOptions): Promise<void> {
    const { dateRange, analytics } = options;
    
    if (!analytics) return;
    
    // Prepare CSV data
    const csvData: string[] = [];
    
    // Header
    csvData.push('WorkBeat Analytics Report');
    csvData.push(`Date Range: ${dateRange.start} to ${dateRange.end}`);
    csvData.push(`Generated: ${new Date().toLocaleString()}`);
    csvData.push('');
    
    // Department Statistics
    csvData.push('Department Statistics');
    csvData.push('Department,Total Employees,Attendance Rate (%),Punctuality Rate (%),Late Arrivals');
    
    analytics.departmentStats.forEach((dept) => {
      csvData.push(`${dept.department},${dept.totalEmployees},${dept.avgAttendanceRate},${dept.avgPunctualityRate},${dept.lateArrivals}`);
    });
    
    csvData.push('');
    
    // Top Performers
    csvData.push('Top Performers');
    csvData.push('Employee Name,Attendance Rate (%),Punctuality Rate (%),Total Hours');
    
    analytics.topPerformers.forEach((performer) => {
      csvData.push(`${performer.employee.name},${performer.attendanceRate},${performer.punctualityRate},${performer.totalHours}`);
    });
    
    csvData.push('');
    
    // Time Patterns
    csvData.push('Hourly Check-in Patterns');
    csvData.push('Hour,Check-ins,Check-outs');
    
    analytics.timePatterns.forEach((pattern) => {
      csvData.push(`${pattern.hour}:00,${pattern.checkIns},${pattern.checkOuts}`);
    });
    
    // Late Arrival Trends with Notes (if it's a late arrival analysis)
    if (options.reportType === 'late-arrival-analysis' && analytics.lateArrivalTrends.length > 0) {
      csvData.push('');
      csvData.push('Late Arrival Analysis');
      csvData.push('Date,Late Count,Total Check-ins,Percentage');
      
      analytics.lateArrivalTrends.forEach((trend) => {
        csvData.push(`${trend.date},${trend.lateCount},${trend.totalCheckIns},${trend.percentage}%`);
      });
      
      csvData.push('');
      csvData.push('📝 IMPORTANT: Late Arrival Notes');
      csvData.push('This report focuses on late arrivals. Employee notes explaining');
      csvData.push('reasons for lateness are captured during sign-in and available');
      csvData.push('in detailed attendance records. Common reasons include:');
      csvData.push('- Traffic delays and transportation issues');
      csvData.push('- Personal emergencies and appointments');
      csvData.push('- Weather-related delays');
      csvData.push('- Work-related overtime or meetings');
      csvData.push('Contact HR for specific employee notes and explanations.');
    }
    
    csvData.push('');
    csvData.push('Report Notes:');
    csvData.push('- Employee notes are captured during sign-in for context');
    csvData.push('- Late arrival reasons help understand attendance patterns');
    csvData.push('- Individual reports include detailed notes for each employee');
    
    // Create and download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `workbeat-analytics-${dateRange.start}-to-${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  async exportToExcel(options: ExportOptions): Promise<void> {
    const { dateRange, analytics } = options;
    
    if (!analytics) return;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Overview sheet
    const overviewData = [
      ['WorkBeat Analytics Report'],
      [`Date Range: ${dateRange.start} to ${dateRange.end}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Employees', analytics.departmentStats.reduce((sum: number, dept) => sum + dept.totalEmployees, 0)],
      ['Average Attendance Rate', `${Math.round(analytics.departmentStats.reduce((sum: number, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length)}%`],
      ['Total Late Arrivals', analytics.departmentStats.reduce((sum: number, dept) => sum + dept.lateArrivals, 0)]
    ];
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
    
    // Department Statistics sheet
    const departmentData = [
      ['Department', 'Total Employees', 'Attendance Rate (%)', 'Punctuality Rate (%)', 'Late Arrivals'],
      ...analytics.departmentStats.map(dept => [
        dept.department,
        dept.totalEmployees,
        dept.avgAttendanceRate,
        dept.avgPunctualityRate,
        dept.lateArrivals
      ])
    ];
    
    const departmentSheet = XLSX.utils.aoa_to_sheet(departmentData);
    XLSX.utils.book_append_sheet(workbook, departmentSheet, 'Departments');
    
    // Top Performers sheet
    const performersData = [
      ['Employee Name', 'Attendance Rate (%)', 'Punctuality Rate (%)', 'Total Hours'],
      ...analytics.topPerformers.map(performer => [
        performer.employee.name,
        performer.attendanceRate,
        performer.punctualityRate,
        performer.totalHours
      ])
    ];
    
    const performersSheet = XLSX.utils.aoa_to_sheet(performersData);
    XLSX.utils.book_append_sheet(workbook, performersSheet, 'Top Performers');
    
    // Time Patterns sheet
    const timeData = [
      ['Hour', 'Check-ins', 'Check-outs'],
      ...analytics.timePatterns.map(pattern => [
        `${pattern.hour}:00`,
        pattern.checkIns,
        pattern.checkOuts
      ])
    ];
    
    const timeSheet = XLSX.utils.aoa_to_sheet(timeData);
    XLSX.utils.book_append_sheet(workbook, timeSheet, 'Time Patterns');
    
    // Late Arrival Trends sheet
    const lateData = [
      ['Date', 'Late Count', 'Total Check-ins', 'Late Percentage (%)'],
      ...analytics.lateArrivalTrends.map(trend => [
        trend.date,
        trend.lateCount,
        trend.totalCheckIns,
        trend.percentage
      ])
    ];
    
    const lateSheet = XLSX.utils.aoa_to_sheet(lateData);
    XLSX.utils.book_append_sheet(workbook, lateSheet, 'Late Arrivals');
    
    // Weekly Trends sheet
    const weeklyData = [
      ['Week', 'Attendance', 'Punctuality (%)', 'Avg Hours'],
      ...analytics.weeklyTrends.map(trend => [
        trend.week,
        trend.attendance,
        trend.punctuality,
        trend.avgHours
      ])
    ];
    
    const weeklySheet = XLSX.utils.aoa_to_sheet(weeklyData);
    XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Weekly Trends');
    
    // Save the file
    XLSX.writeFile(workbook, `workbeat-analytics-${dateRange.start}-to-${dateRange.end}.xlsx`);
  }
  
  async exportCustomReport(
    template: string,
    metrics: string[],
    format: 'pdf' | 'excel' | 'csv',
    options: ExportOptions
  ): Promise<void> {
    const customOptions = {
      ...options,
      template,
      metrics
    };
    
    switch (format) {
      case 'pdf':
        await this.exportToPDF(customOptions);
        break;
      case 'excel':
        await this.exportToExcel(customOptions);
        break;
      case 'csv':
        await this.exportToCSV(customOptions);
        break;
    }
  }

  // Attendance Records Export Functions
  async exportAttendanceToCSV(
    records: AttendanceRecord[],
    dateRange?: { start: string; end: string }
  ): Promise<void> {
    if (!records || records.length === 0) {
      console.warn('No attendance records to export');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Employee ID',
      'Employee Name',
      'Type',
      'Status',
      'Department',
      'Location',
      'Verification Method',
      'Notes'
    ];

    const csvData = records.map(record => [
      new Date(record.timestamp).toLocaleDateString(),
      new Date(record.timestamp).toLocaleTimeString(),
      record.employee?.employeeId || record.employeeId || '',
      record.employee?.name || record.employeeName || '',
      record.type || '',
      record.isLate ? 'Late' : 'On Time',
      record.employee?.department || '',
      record.location || '',
      record.verificationMethod || '',
      record.notes || ''
    ]);

    const allData = [headers, ...csvData];
    const csvContent = allData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = dateRange 
      ? `attendance-records-${dateRange.start}-to-${dateRange.end}.csv`
      : `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportAttendanceToExcel(
    records: AttendanceRecord[],
    dateRange?: { start: string; end: string }
  ): Promise<void> {
    if (!records || records.length === 0) {
      console.warn('No attendance records to export');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Main attendance data
    const attendanceData = [
      ['Date', 'Time', 'Employee ID', 'Employee Name', 'Type', 'Status', 'Department', 'Location', 'Verification Method', 'Notes'],
      ...records.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        new Date(record.timestamp).toLocaleTimeString(),
        record.employee?.employeeId || record.employeeId || '',
        record.employee?.name || record.employeeName || '',
        record.type || '',
        record.isLate ? 'Late' : 'On Time',
        record.employee?.department || '',
        record.location || '',
        record.verificationMethod || '',
        record.notes || ''
      ])
    ];

    const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance Records');

    // Summary statistics
    const totalRecords = records.length;
    const lateRecords = records.filter(r => r.isLate).length;
    const onTimeRecords = totalRecords - lateRecords;
    const checkIns = records.filter(r => r.type === 'sign-in').length;
    const checkOuts = records.filter(r => r.type === 'sign-out').length;

    const summaryData = [
      ['Attendance Summary'],
      [''],
      ['Total Records', totalRecords],
      ['Check-ins', checkIns],
      ['Check-outs', checkOuts],
      ['On Time', onTimeRecords],
      ['Late Arrivals', lateRecords],
      ['Punctuality Rate', `${Math.round((onTimeRecords / totalRecords) * 100)}%`]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const filename = dateRange 
      ? `attendance-records-${dateRange.start}-to-${dateRange.end}.xlsx`
      : `attendance-records-${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  }

  async exportAttendanceToPDF(
    records: AttendanceRecord[],
    dateRange?: { start: string; end: string }
  ): Promise<void> {
    if (!records || records.length === 0) {
      console.warn('No attendance records to export');
      return;
    }

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Attendance Records Report', 20, 30);
    
    pdf.setFontSize(12);
    if (dateRange) {
      pdf.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 20, 50);
    }
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 60);
    pdf.text(`Total Records: ${records.length}`, 20, 70);
    
    let yPosition = 90;
    
    // Summary
    const lateRecords = records.filter(r => r.isLate).length;
    const onTimeRecords = records.length - lateRecords;
    
    pdf.setFontSize(16);
    pdf.text('Summary', 20, yPosition);
    yPosition += 20;
    
    pdf.setFontSize(12);
    pdf.text(`On Time: ${onTimeRecords}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Late Arrivals: ${lateRecords}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Punctuality Rate: ${Math.round((onTimeRecords / records.length) * 100)}%`, 20, yPosition);
    yPosition += 30;
    
    // Records (first 20 records to fit in PDF)
    pdf.setFontSize(16);
    pdf.text('Recent Records', 20, yPosition);
    yPosition += 20;
    
    const displayRecords = records.slice(0, 20);
    
    displayRecords.forEach((record) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(10);
      const date = new Date(record.timestamp).toLocaleDateString();
      const time = new Date(record.timestamp).toLocaleTimeString();
      const name = record.employee?.name || record.employeeName || 'Unknown';
      const status = record.isLate ? 'Late' : 'On Time';
      
      pdf.text(`${date} ${time} - ${name} (${record.type}) - ${status}`, 20, yPosition);
      yPosition += 8;
    });
    
    if (records.length > 20) {
      pdf.text(`... and ${records.length - 20} more records`, 20, yPosition + 10);
    }
    
    const filename = dateRange 
      ? `attendance-records-${dateRange.start}-to-${dateRange.end}.pdf`
      : `attendance-records-${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(filename);
  }
}

// Export additional utility functions
export { DataProcessor };

export const exportService = new ExportService();

// Export enhanced service instance with additional methods
export default exportService;
