import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import departments from './departments';
 
// Alert/Popup Component
const Alert = ({ message, type = 'error', onClose, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg
      ${type === 'success' 
        ? 'bg-black text-white dark:bg-white dark:text-black' 
        : 'bg-red-500 text-white'
      }
      transition-colors duration-300`}
  >
    <div className="flex items-center space-x-4">
      <span>{message}</span>
      {onConfirm && (
        <div className="flex space-x-2">
          <button 
            onClick={onConfirm} 
            className="px-3 py-1 bg-white/30 hover:bg-white/40 rounded-lg"
          >
            Confirm
          </button>
          <button 
            onClick={onClose} 
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
      {!onConfirm && (
        <button 
          onClick={onClose} 
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg"
        >
          Close
        </button>
      )}
    </div>
  </motion.div>
);

const NewBackground = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // No need to load departments - they're hardcoded

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [alertConfirmAction, setAlertConfirmAction] = useState(null);
  const [errors, setErrors] = useState({});
  const [duplicateIdFound, setDuplicateIdFound] = useState(false);
  const [idCheckLoading, setIdCheckLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_names: '',
    citizenship: '',
    id_passport_number: '',
    passport_expiry_date: '',
    department_id: '',
    date_start: '',
    date_end: '',
    work_with: '',
    contact_number: '',
    additional_info: ''
  });
  
  // Check for duplicate ID
  const checkForDuplicateId = async (idNumber) => {
    if (!idNumber) return;
    
    setIdCheckLoading(true);
    try {
      const { data, error } = await supabase
        .from('v5_backgrounds')
        .select('id_passport_number')
        .eq('id_passport_number', idNumber)
        .limit(1);

      if (error) throw error;
      setDuplicateIdFound(data && data.length > 0);
    } catch (error) {
      console.error('Error checking for duplicate ID:', error);
    } finally {
      setIdCheckLoading(false);
    }
  };

  // Show error alert
  const showErrorAlert = (message) => {
    setAlertMessage(message);
    setAlertType('error');
    setShowAlert(true);
    setAlertConfirmAction(null);

    // Automatically remove alert after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  // Show success alert
  const showSuccessAlert = (message, confirmAction = null) => {
    setAlertMessage(message);
    setAlertType('success');
    setShowAlert(true);
    setAlertConfirmAction(confirmAction);

    // Automatically remove alert after 3 seconds if no confirm action
    if (!confirmAction) {
      setTimeout(() => {
        setShowAlert(false);
        // Navigate after the alert is hidden
        navigate('/backgrounds', { 
          state: { 
            success: true,
            message: 'Background check request added successfully'
          }
        });
      }, 3000);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'id_passport_number') {
      setFormData(prev => ({ ...prev, [name]: value }));
      checkForDuplicateId(value);
    } else if (name === 'citizenship') {
      const formattedValue = value.trim();
      const lowerCaseValue = formattedValue.toLowerCase();
      if (['rwanda', 'rwandan'].includes(lowerCaseValue)) {
        const capitalizedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1).toLowerCase();
        setFormData(prev => ({
          ...prev,
          [name]: capitalizedValue,
          passport_expiry_date: ''
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.full_names) newErrors.full_names = 'Full names are required';
    if (!formData.citizenship) newErrors.citizenship = 'Citizenship is required';
    if (!formData.id_passport_number) newErrors.id_passport_number = 'ID/Passport number is required';
    
    // Passport expiry date for non-Rwandans
    const citizenshipLower = formData.citizenship?.trim().toLowerCase();
    if (formData.citizenship && !['rwanda', 'rwandan'].includes(citizenshipLower) && !formData.passport_expiry_date) {
      newErrors.passport_expiry_date = 'Passport expiry date is required';
    }
    
    if (!formData.department_id) newErrors.department_id = 'Department is required';
    if (!formData.date_start) newErrors.date_start = 'Start date is required';
    if (!formData.date_end) newErrors.date_end = 'End date is required';
    if (!formData.work_with) newErrors.work_with = 'Supervisor name is required';
    if (!formData.contact_number) newErrors.contact_number = 'Contact number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      showErrorAlert('User session expired. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('v5_backgrounds')
        .insert([{
          full_names: formData.full_names,
          citizenship: formData.citizenship,
          id_passport_number: formData.id_passport_number,
          passport_expiry_date: formData.passport_expiry_date || null,
          department_id: formData.department_id,
          department_name: departments.find(d => d.id === formData.department_id)?.name || '',
          date_start: formData.date_start,
          date_end: formData.date_end,
          work_with: formData.work_with,
          contact_number: formData.contact_number,
          additional_info: formData.additional_info || null,
          created_by: user.id,
          updated_by: user.id,
          type: 'internship'
        }]);

      if (error) throw error;
      
      showSuccessAlert('Background check request submitted successfully');
    } catch (error) {
      console.error('Submission error:', error);
      showErrorAlert(error.message || 'An error occurred during submission');
    } finally {
      setIsLoading(false);
    }
  };

  // Close alert handler
  const handleCloseAlert = () => {
    setShowAlert(false);
    if (alertConfirmAction) {
      alertConfirmAction();
    } else {
      // If no confirm action, navigate to backgrounds page
      navigate('/backgrounds', { 
        state: { 
          success: true,
          message: 'Background check request added successfully'
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative">
      {/* Alert Popup */}
      <AnimatePresence>
        {showAlert && (
          <Alert 
            message={alertMessage} 
            type={alertType}
            onClose={handleCloseAlert}
            onConfirm={alertConfirmAction ? handleCloseAlert : null}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Panel - Personal Information */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Personal Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="full_names"
                      placeholder="Full Names"
                      value={formData.full_names}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border 
                                ${errors.full_names ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                bg-white dark:bg-gray-800 dark:text-white
                                focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                    />
                    {errors.full_names && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.full_names}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      name="citizenship"
                      placeholder="Citizenship"
                      value={formData.citizenship}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border 
                                ${errors.citizenship ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                bg-white dark:bg-gray-800 dark:text-white
                                focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                    />
                    {errors.citizenship && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.citizenship}</p>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      name="id_passport_number"
                      placeholder="ID or Passport Number"
                      value={formData.id_passport_number}
                      onChange={handleInputChange}
                      maxLength={16}
                      className={`w-full px-4 py-2 rounded-lg border 
                              ${errors.id_passport_number ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                              bg-white dark:bg-gray-800 dark:text-white
                              focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                    />
                    {idCheckLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {errors.id_passport_number && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.id_passport_number}</p>
                    )}
                    {duplicateIdFound && (
                      <p className="mt-1 text-sm text-blue-500">
                        This ID/Passport already exists in our system. You can still proceed.
                      </p>
                    )}
                  </div>

                  {/* Only show passport expiry field for non-Rwandans */}
                  {formData.citizenship && 
                   !['Rwanda', 'Rwandan'].includes(formData.citizenship.trim()) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Passport Expiry Date
                      </label>
                      <input
                        type="date"
                        name="passport_expiry_date"
                        value={formData.passport_expiry_date}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border 
                                  ${errors.passport_expiry_date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                  bg-white dark:bg-gray-800 dark:text-white
                                  focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                      />
                      {errors.passport_expiry_date && (
                        <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                          {errors.passport_expiry_date}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <input
                      type="tel"
                      name="contact_number"
                      placeholder="Contact Number (e.g., 250...)"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border 
                                ${errors.contact_number ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                bg-white dark:bg-gray-800 dark:text-white
                                focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                    />
                    {errors.contact_number && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.contact_number}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Internship Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Department Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6"
              >
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Department</h2>
                <div>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border 
                              ${errors.department_id ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                              bg-white dark:bg-gray-800 dark:text-white
                              focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.department_id && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.department_id}</p>
                  )}
                </div>
              </motion.div>

              {/* Internship Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6"
              >
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Internship Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="date_start"
                        value={formData.date_start}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border 
                                  ${errors.date_start ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                  bg-white dark:bg-gray-800 dark:text-white
                                  focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                      />
                      {errors.date_start && (
                        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.date_start}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="date_end"
                        value={formData.date_end}
                        onChange={handleInputChange}
                        min={formData.date_start}
                        className={`w-full px-4 py-2 rounded-lg border 
                                  ${errors.date_end ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                  bg-white dark:bg-gray-800 dark:text-white
                                  focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                      />
                      {errors.date_end && (
                        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.date_end}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supervisor/Mentor
                    </label>
                    <input
                      type="text"
                      name="work_with"
                      value={formData.work_with}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border 
                                ${errors.work_with ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                bg-white dark:bg-gray-800 dark:text-white
                                focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                      placeholder="Name of supervisor or mentor"
                    />
                    {errors.work_with && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.work_with}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      name="additional_info"
                      value={formData.additional_info}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                               bg-white dark:bg-gray-800 dark:text-white
                               focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      placeholder="Any additional information about the internship..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Form Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end space-x-4 pt-4"
              >
                <button
                  type="button"
                  onClick={() => navigate('/backgrounds')}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700
                           transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBackground;
