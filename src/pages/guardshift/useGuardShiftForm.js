import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

export const useGuardShiftForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newTeamMember, setNewTeamMember] = useState({ id: '', name: '' });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    location: '',
    shiftType: '',
    shiftStartTime: '',
    shiftEndTime: '',
    teamMembers: [],
    cctvStatus: '',
    cctvIssues: '',
    cctvSupervisionReason: '',
    cctvSupervisionOtherReason: '',
    electricityStatus: '',
    waterStatus: '',
    officeStatus: '',
    parkingStatus: '',
    incidentOccurred: false,
    incidentType: '',
    incidentTime: '',
    incidentLocation: '',
    incidentDescription: '',
    actionTaken: '',
    notes: ''
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Watch for changes in cctvStatus to reset related fields
  useEffect(() => {
    if (formData.cctvStatus !== 'not-supervised') {
      setFormData(prev => ({
        ...prev,
        cctvSupervisionReason: '',
        cctvSupervisionOtherReason: ''
      }));
    }
    
    if (formData.cctvStatus !== 'partial-issue' && formData.cctvStatus !== 'not-working') {
      setFormData(prev => ({
        ...prev,
        cctvIssues: ''
      }));
    }
  }, [formData.cctvStatus]);

  // Reset cctvSupervisionOtherReason when reason is not "other"
  useEffect(() => {
    if (formData.cctvSupervisionReason !== 'other') {
      setFormData(prev => ({
        ...prev,
        cctvSupervisionOtherReason: ''
      }));
    }
  }, [formData.cctvSupervisionReason]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const addTeamMember = () => {
    if (newTeamMember.id && newTeamMember.name) {
      setFormData({
        ...formData,
        teamMembers: [...formData.teamMembers, { 
          id: newTeamMember.id, 
          name: newTeamMember.name 
        }]
      });
      setNewTeamMember({ id: '', name: '' });
    }
  };

  const removeTeamMember = (id) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter(member => member.id !== id)
    });
  };

const handleSubmit = async () => {
  setLoading(true);
  
  try {
    // Format data for database submission
    const submissionData = {
      submitted_by: user?.username || 'unknown',
      location: formData.location,
      shift_type: formData.shiftType,
      shift_start_time: formData.shiftStartTime,
      shift_end_time: formData.shiftEndTime,
      team_members: formData.teamMembers,
      cctv_status: formData.cctvStatus,
      cctv_issues: formData.cctvIssues || null,
      
      // Correctly handle the CCTV supervision fields
      cctv_supervision_reason: formData.cctvStatus === 'not-supervised' ? formData.cctvSupervisionReason : null,
      cctv_supervision_other_reason: 
        formData.cctvStatus === 'not-supervised' && 
        formData.cctvSupervisionReason === 'other' ? 
        formData.cctvSupervisionOtherReason : null,
        
      electricity_status: formData.electricityStatus,
      water_status: formData.waterStatus,
      office_status: formData.officeStatus,
      parking_status: formData.parkingStatus,
      incident_occurred: formData.incidentOccurred,
      incident_type: formData.incidentOccurred ? formData.incidentType : null,
      incident_time: formData.incidentOccurred ? formData.incidentTime : null,
      incident_location: formData.incidentOccurred ? formData.incidentLocation : null,
      incident_description: formData.incidentOccurred ? formData.incidentDescription : null,
      action_taken: formData.incidentOccurred ? formData.actionTaken : null,
      notes: formData.notes || null,
      created_at: new Date().toISOString()
    };

    console.log('Submitting data to Supabase:', submissionData);

    // Insert data into the guard_shift_reports table
    const { error: submitError } = await supabase
      .from('guard_shift_reports')
      .insert([submissionData]);

    if (submitError) {
      console.error('Supabase error:', submitError);
      throw submitError;
    }
    
    showToast('Report submitted successfully!', 'success');

    // Reset form
    setFormData({
      location: '',
      shiftType: '',
      shiftStartTime: '',
      shiftEndTime: '',
      teamMembers: [],
      cctvStatus: '',
      cctvIssues: '',
      cctvSupervisionReason: '',
      cctvSupervisionOtherReason: '',
      electricityStatus: '',
      waterStatus: '',
      officeStatus: '',
      parkingStatus: '',
      incidentOccurred: false,
      incidentType: '',
      incidentTime: '',
      incidentLocation: '',
      incidentDescription: '',
      actionTaken: '',
      notes: ''
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    showToast('Failed to submit report. Please try again.', 'error');
  } finally {
    setLoading(false);
    setIsConfirmDialogOpen(false);
  }
};

  const initiateSubmit = (e) => {
    e.preventDefault();

    // Form validation
    let isValid = true;
    let validationMessage = '';

    // Validate CCTV supervision reason if status is 'not-supervised'
    if (formData.cctvStatus === 'not-supervised' && !formData.cctvSupervisionReason) {
      isValid = false;
      validationMessage = 'Please select a reason for not supervising CCTV';
    }

    // Validate cctvSupervisionOtherReason if reason is 'other'
    if (
      formData.cctvStatus === 'not-supervised' && 
      formData.cctvSupervisionReason === 'other' && 
      !formData.cctvSupervisionOtherReason
    ) {
      isValid = false;
      validationMessage = 'Please specify the reason for not supervising CCTV';
    }

    // If validation fails, show error and stop submission
    if (!isValid) {
      showToast(validationMessage, 'error');
      return;
    }

    // All validations passed, open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const confirmSubmit = () => {
    handleSubmit();
  };

  const cancelSubmit = () => {
    setIsConfirmDialogOpen(false);
  };

  return {
    formData,
    loading,
    toast,
    currentTime,
    newTeamMember,
    isConfirmDialogOpen,
    setFormData,
    setNewTeamMember,
    setIsConfirmDialogOpen,
    addTeamMember,
    removeTeamMember,
    initiateSubmit,
    confirmSubmit,
    cancelSubmit
  };
};
