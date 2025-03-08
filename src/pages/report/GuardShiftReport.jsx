import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Calendar,
  Filter,
  Download,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Printer,
  Search,
  User, 
  Clock, 
  UserCircle,
  Power,
  Droplets,
  Building2,
  Car,
  X,
  Camera,
  Shield,
  FileText,
  Users,
  AlertTriangle,
  Activity,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import * as XLSX from 'xlsx';

const GuardShiftReportViewer = () => {
  // Helper function to get week dates
  const getWeekDates = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  // Helper function to check if a report has any issues
  const hasIssues = (report) => {
    if (!report) return false;
    
    // Check utility statuses
    const hasUtilityIssues = 
      report.electricity_status === 'issues' ||
      report.water_status === 'issues' ||
      report.office_status === 'issues' ||
      report.parking_status === 'issues';

    // Check CCTV status
    const hasCCTVIssues = 
      report.cctv_status === 'partial-issue' || 
      report.cctv_status === 'not-working';
      
    // We don't consider 'not-supervised' as an issue since it may be a valid operational situation
    // It will be displayed with its own status badge

    return hasUtilityIssues || hasCCTVIssues;
  };

  // State Management
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Filter States with initial week dates
  const weekDates = getWeekDates();
  const [filters, setFilters] = useState({
    startDate: weekDates.startDate,
    endDate: weekDates.endDate,
    shiftType: '',
    hasIncident: '',
    guard: '',
    location: ''
  });

  // Stats State
  const [stats, setStats] = useState({
    totalReports: 0,
    incidentReports: 0,
    normalReports: 0,
    issuesReports: 0
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Reports Function
  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('guard_shift_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        const startDateTime = new Date(`${filters.startDate}T00:00:00`);
        query = query.gte('created_at', startDateTime.toISOString());
      }
      
      if (filters.endDate) {
        const endDateTime = new Date(`${filters.endDate}T23:59:59`);
        query = query.lte('created_at', endDateTime.toISOString());
      }

      if (filters.shiftType) {
        query = query.eq('shift_type', filters.shiftType);
      }

      if (filters.hasIncident !== '') {
        query = query.eq('incident_occurred', filters.hasIncident === 'true');
      }

      if (filters.guard) {
        query = query.ilike('submitted_by', `%${filters.guard}%`);
      }

      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      // Pagination
      const start = (currentPage - 1) * reportsPerPage;
      const end = start + reportsPerPage - 1;
      query = query.range(start, end);

      const { data, count, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setReports(data);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / reportsPerPage));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stats Function
  const fetchStats = async () => {
    try {
      const weekDates = getWeekDates();
      
      // Get total reports for the week
      const { count: totalCount } = await supabase
        .from('guard_shift_reports')
        .select('*', { count: 'exact' })
        .gte('created_at', `${weekDates.startDate}T00:00:00`)
        .lte('created_at', `${weekDates.endDate}T23:59:59`);

      // Get incident reports for the week
      const { count: incidentCount } = await supabase
        .from('guard_shift_reports')
        .select('*', { count: 'exact' })
        .eq('incident_occurred', true)
        .gte('created_at', `${weekDates.startDate}T00:00:00`)
        .lte('created_at', `${weekDates.endDate}T23:59:59`);

      // Get reports with issues
      const { count: issuesCount } = await supabase
        .from('guard_shift_reports')
        .select('*', { count: 'exact' })
        .or('electricity_status.eq.issues,water_status.eq.issues,office_status.eq.issues,parking_status.eq.issues')
        .gte('created_at', `${weekDates.startDate}T00:00:00`)
        .lte('created_at', `${weekDates.endDate}T23:59:59`);

      setStats({
        totalReports: totalCount || 0,
        incidentReports: incidentCount || 0,
        issuesReports: issuesCount || 0,
        normalReports: (totalCount || 0) - (incidentCount || 0) - (issuesCount || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Export All Reports Function
  const exportAllReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('guard_shift_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data.map(report => {
          // Format CCTV supervision reason
          let supervisionReason = '';
          if (report.cctv_status === 'not-supervised') {
            supervisionReason = 
              report.cctv_supervision_reason === 'staff-shortage' ? 'Staff Shortage' :
              report.cctv_supervision_reason === 'emergency-elsewhere' ? 'Handling Emergency Elsewhere' :
              report.cctv_supervision_reason === 'no-access' ? 'No Access to CCTV Room' :
              report.cctv_supervision_reason === 'other' ? `Other: ${report.cctv_supervision_other_reason || ''}` :
              report.cctv_supervision_reason || 'Not specified';
          }
          
          return {
            'Date': new Date(report.created_at).toLocaleDateString(),
            'Time': new Date(report.created_at).toLocaleTimeString(),
            'Guard': report.submitted_by,
            'Shift Type': report.shift_type,
            'Location': report.location,
            'CCTV Status': report.cctv_status || 'N/A',
            'CCTV Supervision Reason': supervisionReason,
            'CCTV Issues': report.cctv_issues || 'None',
            'Team Size': report.team_members?.length || 0,
            'Electricity': report.electricity_status,
            'Water': report.water_status,
            'Office': report.office_status,
            'Parking': report.parking_status,
            'Has Incident': report.incident_occurred ? 'Yes' : 'No',
            'Incident Type': report.incident_type || '',
            'Incident Time': report.incident_time ? new Date(report.incident_time).toLocaleString() : '',
            'Incident Location': report.incident_location || '',
            'Action Taken': report.action_taken || '',
            'Notes': report.notes || ''
          };
        });

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Security Reports');

        // Adjust column widths
        const cols = Object.keys(formattedData[0]).map(() => ({ wch: 25 }));
        ws['!cols'] = cols;

        XLSX.writeFile(wb, `security_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
    } finally {
      setLoading(false);
    }
  };

// Export Detailed Report Function - Perfect Spacing
const exportDetailedReport = async (report) => {
  try {
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '800px';
    tempContainer.style.padding = '0';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Format date for header
    const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // Create report reference number
    const reportRef = `SR-${new Date(report.created_at).toISOString().slice(0,10).replace(/-/g,'')}`;

// Calculate team member rows with no limit
const teamMemberCount = report.team_members && report.team_members.length > 0 ? report.team_members.length : 1;
    
// Calculate row height based on team member count (41px per row)
const teamTableHeight = (teamMemberCount * 41) + 60; // 41px per row + header + padding

// Adjust the max height to prevent overflow if too many team members
const maxTeamTableHeight = 300; // Maximum height for the team table
const actualTeamTableHeight = Math.min(teamTableHeight, maxTeamTableHeight);
    
// Calculate section positions with adjusted spacing for unlimited team members
const securityPersonnelY = 210;
const securityPersonnelHeight = actualTeamTableHeight;
    
// Calculate Y positions for all sections
const cctvMonitoringY = securityPersonnelY + securityPersonnelHeight + 30; // 30px gap
const cctvMonitoringHeight = 120; // Fixed height for CCTV section
    
const utilityStatusY = cctvMonitoringY + cctvMonitoringHeight + 30; // 30px gap
const utilityStatusHeight = 120; // Fixed height for Utility section
    
const incidentReportY = utilityStatusY + utilityStatusHeight + 30; // 30px gap
const incidentReportHeight = report.incident_occurred ? 300 : 80; // Variable height based on incidents
    
const notesY = incidentReportY + incidentReportHeight + 30; // 30px gap

    tempContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; width: 800px; height: 1131px; position: relative; background-color: #ffffff;">
        <!-- Left sidebar -->
        <div style="position: absolute; left: 0; top: 0; width: 35px; height: 1131px; background-color: #2c3e50;"></div>
        
        <!-- Header -->
        <div style="position: absolute; left: 35px; top: 0; width: 765px; height: 100px; border-bottom: 1px solid #e0e0e0; background-color: #f9f9f9; display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 0;">
          <div style="margin-left: 35px;">
            <h1 style="margin: 0; font-size: 28px; color: #2c3e50; font-weight: bold; text-transform: uppercase;">Guard Shift Report</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #555; font-weight: normal;">Detailed documentation of security observations and incidents</p>
          </div>
          <div style="margin-right: 20px; text-align: right;">
            <div style="font-size: 14px; color: #5d6d7e; margin-bottom: 5px;"><strong>DATE:</strong> ${formattedDate}</div>
            <div style="font-size: 14px; color: #5d6d7e;"><strong>REF:</strong> ${reportRef}</div>
          </div>
        </div>

        <!-- Basic Info Grid -->
        <div style="position: absolute; left: 70px; top: 120px; right: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
          <!-- Column 1: Location -->
          <div style="border: 1px solid #e0e0e0;">
            <div style="background-color: #f9f9f9; padding: 8px 10px; font-size: 12px; color: #5d6d7e; font-weight: bold;">LOCATION</div>
            <div style="padding: 10px; font-size: 16px; color: #2c3e50;">${report.location || 'Not specified'}</div>
          </div>
          
          <!-- Column 2: Shift Type -->
          <div style="border: 1px solid #e0e0e0;">
            <div style="background-color: #f9f9f9; padding: 8px 10px; font-size: 12px; color: #5d6d7e; font-weight: bold;">SHIFT</div>
            <div style="padding: 10px; font-size: 16px; color: #2c3e50;">${report.shift_type?.toUpperCase() || 'Not specified'}</div>
          </div>
          
          <!-- Column 3: Submitted By -->
          <div style="border: 1px solid #e0e0e0;">
            <div style="background-color: #f9f9f9; padding: 8px 10px; font-size: 12px; color: #5d6d7e; font-weight: bold;">SUBMITTED BY</div>
            <div style="padding: 10px; font-size: 16px; color: #2c3e50;">${report.submitted_by || 'Unknown'}</div>
          </div>
          
          <!-- Column 4: Shift Time -->
          <div style="border: 1px solid #e0e0e0;">
            <div style="background-color: #f9f9f9; padding: 8px 10px; font-size: 12px; color: #5d6d7e; font-weight: bold;">SHIFT TIME</div>
            <div style="padding: 10px; font-size: 16px; color: #2c3e50;">${
              (report.shift_start_time && report.shift_end_time) 
              ? `${new Date(report.shift_start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(report.shift_end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
              : "Not specified"
            }</div>
          </div>
        </div>
<!-- Security Personnel Section -->
<div style="position: absolute; left: 58px; top: ${securityPersonnelY}px; right: 20px;">
  <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">Security Personnel</h2>
  
  <!-- Team Member Table -->
  <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
    <thead>
      <tr style="background-color: #f3f6f9;">
        <th style="padding: 10px; text-align: left; font-size: 14px; font-weight: bold; color: #5d6d7e; border: 1px solid #e0e0e0;">NAME</th>
        <th style="padding: 10px; text-align: left; font-size: 14px; font-weight: bold; color: #5d6d7e; border: 1px solid #e0e0e0;">ID NUMBER</th>
        <th style="padding: 10px; text-align: left; font-size: 14px; font-weight: bold; color: #5d6d7e; border: 1px solid #e0e0e0;">POSITION</th>
      </tr>
    </thead>
    <tbody>
      ${report.team_members && report.team_members.length > 0 
        ? report.team_members.map((member, index) => `
            <tr>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;">${member.name}</td>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;">${member.id}</td>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;">Security Officer</td>
            </tr>
          `).join('') 
        : `
            <tr>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;">No team members recorded</td>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;"></td>
              <td style="padding: 10px; font-size: 14px; color: #2c3e50; border: 1px solid #e0e0e0;"></td>
            </tr>
          `
      }
    </tbody>
  </table>
</div>

        <!-- CCTV Monitoring Section -->
        <div style="position: absolute; left: 58px; top: ${cctvMonitoringY}px; right: 20px; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; padding: 15px 0;">
          <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 15px 0; text-transform: uppercase; font-weight: bold;">CCTV Monitoring</h2>
          
          <div style="display: flex; margin-bottom: 10px;">
            <!-- CCTV Status -->
            <div style="display: flex; align-items: center;">
              <!-- Status indicator -->
              <div style="width: 20px; height: 20px; border-radius: 50%; margin-right: 10px; background-color: ${
                report.cctv_status === 'fully-functional' ? '#4caf50' : 
                report.cctv_status === 'partial-issue' ? '#ff9800' : 
                report.cctv_status === 'not-working' ? '#f44336' :
                report.cctv_status === 'not-supervised' ? '#2196f3' : '#607d8b'
              };"></div>
              
              <!-- Status text -->
              <div style="font-size: 16px; font-weight: bold; color: #2c3e50;">Status: ${
                report.cctv_status === 'fully-functional' ? 'Fully Functional' : 
                report.cctv_status === 'partial-issue' ? 'Partial Issue' : 
                report.cctv_status === 'not-working' ? 'Not Working' :
                report.cctv_status === 'not-supervised' ? 'Not Supervised' : 'Unknown'
              }</div>
            </div>
          </div>

          ${report.cctv_status === 'not-supervised' 
            ? `<div style="margin-top: 10px; margin-left: 30px;">
                <div style="font-size: 14px; font-weight: bold; color: #5d6d7e;">Issues:</div>
                <div style="font-size: 14px; color: #2c3e50; margin-top: 5px;">
                  ${report.cctv_supervision_reason === 'staff-shortage' ? 'Staff Shortage' :
                    report.cctv_supervision_reason === 'emergency-elsewhere' ? 'Handling Emergency Elsewhere' :
                    report.cctv_supervision_reason === 'no-access' ? 'No Access to CCTV Room' :
                    report.cctv_supervision_reason === 'other' 
                      ? `Other: ${report.cctv_supervision_other_reason || ''}` 
                    : report.cctv_supervision_reason || 'Not specified'}
                </div>
              </div>`
            : report.cctv_issues
            ? `<div style="margin-top: 10px; margin-left: 30px;">
                <div style="font-size: 14px; font-weight: bold; color: #5d6d7e;">Issues:</div>
                <div style="font-size: 14px; color: #2c3e50; margin-top: 5px;">${report.cctv_issues}</div>
              </div>`
            : ''
          }
        </div>

        <!-- Utility Status Section -->
        <div style="position: absolute; left: 58px; top: ${utilityStatusY}px; right: 20px; border-bottom: 1px solid #e0e0e0; padding: 15px 0;">
          <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 15px 0; text-transform: uppercase; font-weight: bold;">Utility Status</h2>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <!-- Electricity -->
            <div style="display: flex; flex-direction: column; align-items: flex-start; width: 22%;">
              <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 5px;">ELECTRICITY</div>
              <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${
                  report.electricity_status === 'normal' ? '#4caf50' : 
                  report.electricity_status === 'issues' ? '#ff9800' : '#f44336'
                }; margin-right: 10px;"></div>
                <div style="font-size: 14px; color: ${
                  report.electricity_status === 'normal' ? '#4caf50' : 
                  report.electricity_status === 'issues' ? '#ff9800' : '#f44336'
                };">${report.electricity_status || 'Unknown'}</div>
              </div>
            </div>
            
            <!-- Water -->
            <div style="display: flex; flex-direction: column; align-items: flex-start; width: 22%;">
              <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 5px;">WATER</div>
              <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${
                  report.water_status === 'normal' ? '#4caf50' : 
                  report.water_status === 'issues' ? '#ff9800' : '#f44336'
                }; margin-right: 10px;"></div>
                <div style="font-size: 14px; color: ${
                  report.water_status === 'normal' ? '#4caf50' : 
                  report.water_status === 'issues' ? '#ff9800' : '#f44336'
                };">${report.water_status || 'Unknown'}</div>
              </div>
            </div>
            
            <!-- Office -->
            <div style="display: flex; flex-direction: column; align-items: flex-start; width: 22%;">
              <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 5px;">OFFICE</div>
              <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${
                  report.office_status === 'normal' ? '#4caf50' : 
                  report.office_status === 'issues' ? '#ff9800' : '#f44336'
                }; margin-right: 10px;"></div>
                <div style="font-size: 14px; color: ${
                  report.office_status === 'normal' ? '#4caf50' : 
                  report.office_status === 'issues' ? '#ff9800' : '#f44336'
                };">${report.office_status || 'Unknown'}</div>
              </div>
            </div>
            
            <!-- Parking -->
            <div style="display: flex; flex-direction: column; align-items: flex-start; width: 22%;">
              <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 5px;">PARKING</div>
              <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${
                  report.parking_status === 'normal' ? '#4caf50' : 
                  report.parking_status === 'issues' ? '#ff9800' : '#f44336'
                }; margin-right: 10px;"></div>
                <div style="font-size: 14px; color: ${
                  report.parking_status === 'normal' ? '#4caf50' : 
                  report.parking_status === 'issues' ? '#ff9800' : '#f44336'
                };">${report.parking_status || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Incident Report Section -->
        <div style="position: absolute; left: 58px; top: ${incidentReportY}px; right: 20px; border-bottom: 1px solid #e0e0e0; padding: 15px 0;">
          <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 15px 0; text-transform: uppercase; font-weight: bold;">Incident Report</h2>
          
          ${report.incident_occurred 
            ? `<div style="margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                  <!-- Incident Type -->
                  <div style="border: 1px solid #e0e0e0; padding: 10px;">
                    <div style="font-size: 14px; font-weight: bold; color: #5d6d7e; margin-bottom: 5px;">INCIDENT TYPE</div>
                    <div style="font-size: 16px; color: #e74c3c;">${report.incident_type}</div>
                  </div>
                  
                  <!-- Incident Time -->
                  <div style="border: 1px solid #e0e0e0; padding: 10px;">
                    <div style="font-size: 14px; font-weight: bold; color: #5d6d7e; margin-bottom: 5px;">INCIDENT TIME</div>
                    <div style="font-size: 16px; color: #2c3e50;">${report.incident_time ? new Date(report.incident_time).toLocaleString() : 'Not specified'}</div>
                  </div>
                </div>
                
                <!-- Incident Location -->
                <div style="border: 1px solid #e0e0e0; padding: 10px; margin-bottom: 15px;">
                  <div style="font-size: 14px; font-weight: bold; color: #5d6d7e; margin-bottom: 5px;">INCIDENT LOCATION</div>
                  <div style="font-size: 16px; color: #2c3e50;">${report.incident_location}</div>
                </div>
                
                <!-- Description -->
                <div style="border: 1px solid #e0e0e0; padding: 10px; margin-bottom: 15px;">
                  <div style="font-size: 14px; font-weight: bold; color: #5d6d7e; margin-bottom: 5px;">DESCRIPTION</div>
                  <div style="font-size: 14px; color: #2c3e50; line-height: 1.4;">${report.incident_description}</div>
                </div>
                
                <!-- Action Taken -->
                <div style="border: 1px solid #e0e0e0; padding: 10px;">
                  <div style="font-size: 14px; font-weight: bold; color: #5d6d7e; margin-bottom: 5px;">ACTION TAKEN</div>
                  <div style="font-size: 14px; color: #2c3e50; line-height: 1.4;">${report.action_taken}</div>
                </div>
              </div>`
            : `<div style="padding: 15px 0;">
                <p style="font-size: 16px; color: #2c3e50; margin: 0;">No incidents reported during this shift.</p>
              </div>`
          }
        </div>

        <!-- Notes Section (if available) -->
        ${report.notes 
          ? `<div style="position: absolute; left: 58px; top: ${notesY}px; right: 20px; padding: 15px 0;">
              <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 15px 0; text-transform: uppercase; font-weight: bold;">Notes</h2>
              <div style="border: 1px solid #e0e0e0; padding: 15px; font-size: 14px; color: #2c3e50; line-height: 1.5;">
                ${report.notes}
              </div>
            </div>`
          : ''
        }

        <!-- Footer -->
        <div style="position: absolute; left: 0; bottom: 10px; width: 100%; text-align: center; padding: 10px 0; border-top: 1px solid #e0e0e0;">
          <div style="font-size: 12px; color: #7f8c8d;">Generated on ${new Date().toLocaleString()} • MTNR Security & Safety</div>
          <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">CONFIDENTIAL • Page 1 of 1</div>
        </div>
      </div>
    `;

    // Convert to PDF
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add image to PDF - single page only
    pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, imgWidth, imgHeight);

    // Save PDF with a cleaner filename
    pdf.save(`Security_Report_${report.location ? report.location.replace(/\s+/g, '_') : 'Location'}_${formattedDate.replace(/\//g, '-')}.pdf`);

    // Cleanup
    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error('Error exporting report:', error);
  }
};

  // Helper Components
  const StatusCard = ({ icon: Icon, label, value, color }) => (
    <div className={`flex items-center p-4 rounded-lg border ${color} bg-opacity-10`}>
      <div className={`p-3 rounded-full ${color} bg-opacity-20 mr-4`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  const StatusBadge = ({ status, type }) => {
    let color;
    switch (status?.toLowerCase()) {
      case 'normal':
        color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        break;
      case 'issues':
      case 'issues present':
      case 'partial-issue':
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        break;
      case 'offline':
      case 'outage':
      case 'not-working':
        color = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        break;
      case 'not-supervised':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }

    const Icon = type === 'electricity' ? Power :
                 type === 'water' ? Droplets :
                 type === 'office' ? Building2 :
                 type === 'parking' ? Car : null;

    return (
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-4 h-4" />}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {status || 'N/A'}
        </span>
      </div>
    );
  };

  const UtilityStatus = ({ icon: Icon, label, status }) => {
    const getStatusStyles = () => {
      switch (status?.toLowerCase()) {
        case 'normal':
          return {
            container: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
            text: 'text-green-800 dark:text-green-200',
            icon: 'text-green-500 dark:text-green-400'
          };
        case 'issues':
          return {
            container: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
            text: 'text-yellow-800 dark:text-yellow-200',
            icon: 'text-yellow-500 dark:text-yellow-400'
          };
        default:
          return {
            container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
            text: 'text-red-800 dark:text-red-200',
            icon: 'text-red-500 dark:text-red-400'
          };
      }
    };

    const styles = getStatusStyles();

    return (
      <div className={`p-4 rounded-lg border ${styles.container}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-white dark:bg-gray-800`}>
              <Icon className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
              <p className={`text-sm font-medium ${styles.text}`}>
                {status || 'N/A'}
              </p>
            </div>
          </div>
          <div className={`h-2 w-2 rounded-full ${
            status === 'normal' 
              ? 'bg-green-500' 
              : status === 'issues' 
              ? 'bg-yellow-500' 
              : 'bg-red-500'
          }`} />
        </div>
      </div>
    );
  };

  const ReportModal = ({ report, onClose }) => {
    if (!report) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full relative">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Report Details</h2>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {report.submitted_by}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {report.location}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportDetailedReport(report)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title="Export Report"
                  >
                    <Download className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Shift Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {report.shift_type.toUpperCase()}
                  </p>
                </div>
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {report.team_members?.length || 0} Members
                  </p>
                </div>
                <div className={`p-4 border rounded-lg ${
                  report.incident_occurred 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : 'dark:border-gray-700'
                }`}>
                  <p className={`text-sm ${
                    report.incident_occurred 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>Status</p>
                  <p className={`text-lg font-semibold ${
                    report.incident_occurred 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {report.incident_occurred ? 'Incident Reported' : 'Normal'}
                  </p>
                </div>
              </div>

              {/* CCTV Status */}
              <div className="border rounded-lg dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <Camera className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CCTV Status</h3>
                </div>
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">CCTV Status</span>
                    <StatusBadge status={report.cctv_status} />
                  </div>
                  
                  {report.cctv_status === 'not-supervised' && (
                    <div className="mt-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">Reason</div>
                      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {report.cctv_supervision_reason === 'staff-shortage' ? 'Staff Shortage' :
                           report.cctv_supervision_reason === 'emergency-elsewhere' ? 'Handling Emergency Elsewhere' :
                           report.cctv_supervision_reason === 'no-access' ? 'No Access to CCTV Room' :
                           report.cctv_supervision_reason === 'other' ? 'Other Reason' :
                           report.cctv_supervision_reason || 'Not specified'}
                        </p>
                        {report.cctv_supervision_reason === 'other' && report.cctv_supervision_other_reason && (
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            {report.cctv_supervision_other_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {report.cctv_issues && (
                    <div className="mt-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">Issues Description</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {report.cctv_issues}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Utility Status */}
              <div className="border rounded-lg dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <Activity className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Utility Status</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <UtilityStatus icon={Power} label="Electricity" status={report.electricity_status} />
                  <UtilityStatus icon={Droplets} label="Water" status={report.water_status} />
                  <UtilityStatus icon={Building2} label="Office" status={report.office_status} />
                  <UtilityStatus icon={Car} label="Parking" status={report.parking_status} />
                </div>
              </div>

              {/* Team Members */}
              <div className="border rounded-lg dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Team</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.team_members?.map((member, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg dark:border-gray-700">
                      <UserCircle className="w-10 h-10 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {member.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Report */}
              {report.incident_occurred && (
                <div className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                      Incident Report
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Incident Type</p>
                        <p className="mt-1 text-lg font-medium text-red-700 dark:text-red-300">
                          {report.incident_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Time of Incident</p>
                        <p className="mt-1 text-lg font-medium text-red-700 dark:text-red-300">
                          {report.incident_time ? 
                            new Date(report.incident_time).toLocaleString() : 
                            'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Description</p>
                      <p className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 
                                 dark:border-red-800 text-gray-900 dark:text-red-100">
                        {report.incident_description}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Action Taken</p>
                      <p className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 
                                 dark:border-red-800 text-gray-900 dark:text-red-100">
                        {report.action_taken}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {report.notes && (
                <div className="border rounded-lg dark:border-gray-700 p-6">
                  <div className="flex items-center mb-4">
                    <FileText className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Notes</h3>
                  </div>
                  <div className="p-4 border rounded-lg dark:border-gray-700">
                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                      {report.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Load initial data
  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filters, currentPage, reportsPerPage]);

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Export Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Security Reports Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Monitor and manage security shift reports
            </p>
          </div>
          
          <button
            onClick={exportAllReports}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 
                     text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 
                     transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Export All Reports</span>
          </button>
        </div>

        {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <StatusCard
    icon={FileText}
    label="Total Reports (In 7 Days)"
    value={stats.totalReports}
    color="text-blue-600 dark:text-blue-500"
  />
  <StatusCard
    icon={CheckCircle}
    label="Normal Reports (In 7 Days)"
    value={stats.normalReports}
    color="text-green-600 dark:text-green-500"
  />
  <StatusCard
    icon={AlertTriangle}
    label="Reports with Issues (In 7 Days)"
    value={stats.issuesReports}
    color="text-yellow-600 dark:text-yellow-500"
  />
  <StatusCard
    icon={AlertCircle}
    label="Incident Reports (In 7 Days)"
    value={stats.incidentReports}
    color="text-red-600 dark:text-red-500"
  />
</div>

{/* Filters Section */}
<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <div className="mb-4 flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter Reports
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              >
                <option value="">All Locations</option>
                <option value="Nyarutarama HQ">Nyarutarama HQ</option>
                <option value="Remera Switch">Remera Switch</option>
                <option value="Kabuga SC">Kabuga Service Center</option>
                <option value="Kimironko SC">Kimironko Service Center</option>
                <option value="Giporoso SC">Giporoso Service Center</option>
                <option value="Kisimenti SC">Kisimenti Service Center</option>
                <option value="Kicukiro SC">Kicukiro Service Center</option>
                <option value="KCM SC">KCM Service Center</option>
                <option value="CHIC SC">CHIC Service Center</option>
                <option value="Nyamirambo SC">Nyamirambo Service Center</option>
                <option value="Nyabugogo SC">Nyabugogo Service Center</option>
                <option value="Gisozi SC">Gisozi Service Center</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shift Type
              </label>
              <select
                value={filters.shiftType}
                onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              >
                <option value="">All Shifts</option>
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.hasIncident}
                onChange={(e) => setFilters({ ...filters, hasIncident: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              >
                <option value="">All Reports</option>
                <option value="true">With Incidents</option>
                <option value="false">Without Incidents</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guard Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="    Search guard..."
                  value={filters.guard}
                  onChange={(e) => setFilters({ ...filters, guard: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                           dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                           dark:focus:ring-gray-400"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Reset Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                startDate: getWeekDates().startDate,
                endDate: getWeekDates().endDate,
                shiftType: '',
                hasIncident: '',
                guard: '',
                location: ''
              })}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900
                       dark:hover:text-white transition-colors border border-gray-200 
                       dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Submitted By
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    CCTV Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Report Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr 
                      key={report.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Date & Time Column */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(report.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>

                      {/* Guard Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.submitted_by}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {report.shift_type === 'day' ? 'Day Shift' : 'Night Shift'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {report.location}
                          </span>
                        </div>
                      </td>

                      {/* CCTV Status Column */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium 
                                       ${report.cctv_status === 'fully-functional' 
                                         ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                         : report.cctv_status === 'partial-issue'
                                         ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                         : report.cctv_status === 'not-working'
                                         ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                         : report.cctv_status === 'not-supervised'
                                         ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                         : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                                       }`}>
                          <Camera className="w-3.5 h-3.5 mr-1" />
                          {report.cctv_status || 'Not Specified'}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4">
                        {report.incident_occurred ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium 
                                         bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" />
                            Incident Reported
                          </span>
                        ) : hasIssues(report) ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium 
                                         bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Issues Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium 
                                         bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm
                                     bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 
                                     dark:hover:bg-gray-600 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </button>
                          <button
                            onClick={() => exportDetailedReport(report)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm
                                     border border-gray-200 dark:border-gray-600
                                     hover:bg-gray-100 dark:hover:bg-gray-700 
                                     text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1.5" />
                            Export
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 
                        flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * reportsPerPage) + 1} to {Math.min(currentPage * reportsPerPage, totalCount)} of {totalCount} reports
              </span>
              <select
                value={reportsPerPage}
                onChange={(e) => {
                  setCurrentPage(1);
                  setReportsPerPage(Number(e.target.value));
                }}
                className="ml-2 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-black
                         dark:focus:ring-gray-400"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                         text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                         text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Report Detail Modal */}
        {showReportModal && selectedReport && (
          <ReportModal 
            report={selectedReport}
            onClose={() => {
              setShowReportModal(false);
              setSelectedReport(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GuardShiftReportViewer;
