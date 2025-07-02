import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { AnalyticsData, DetailedAttendanceStats } from '../types';

export interface ExportOptions {
  dateRange: {
    start: string;
    end: string;
  };
  reportType: string;
  selectedDepartment: string;
  analytics: AnalyticsData;
  includeCharts?: boolean;
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
}

export const exportService = new ExportService();
