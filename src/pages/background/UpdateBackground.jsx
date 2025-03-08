import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
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

// Success Modal Component
const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 relative"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Success</h3>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Error Modal Component
const ErrorModal = ({ message, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-white">Error</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          {message}
        </p>
        <div className="flex justify-center">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const UpdateBackground = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Search states
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // Form states
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [errors, setErrors] = useState({});
  
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
    additional_info: '',
    status: 'Pending',
    closed_date: ''
  });

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
    setSearchError('');
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      setSearchError('Please enter an ID or passport number');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase
        .from('v5_backgrounds')
        .select('*')
        .ilike('id_passport_number', `%${searchInput}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchError('No records found with this ID/passport number');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search records. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a background to edit
  const handleSelectBackground = (background) => {
    setSelectedBackground(background);
    setFormData({
      full_names: background.full_names || '',
      citizenship: background.citizenship || '',
      id_passport_number: background.id_passport_number || '',
      passport_expiry_date: background.passport_expiry_date || '',
      department_id: background.department_id || '',
      date_start: background.date_start || '',
      date_end: background.date_end || '',
      work_with: background.work_with || '',
      contact_number: background.contact_number || '',
      additional_info: background.additional_info || '',
      status: background.status || 'Pending',
      closed_date: background.closed_date || ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'citizenship') {
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
    
    // Required fields for all
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
    
    // Status validation
    if (formData.status === 'Closed' && !formData.closed_date) {
      newErrors.closed_date = 'Closed date is required when status is Closed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
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
      const selectedDepartment = departments.find(dept => dept.id === formData.department_id);
      
      const { error } = await supabase
        .from('v5_backgrounds')
        .update({
          full_names: formData.full_names,
          citizenship: formData.citizenship,
          id_passport_number: formData.id_passport_number,
          passport_expiry_date: formData.passport_expiry_date || null,
          department_id: formData.department_id,
          department_name: selectedDepartment?.name || '',
          date_start: formData.date_start,
          date_end: formData.date_end,
          work_with: formData.work_with,
          contact_number: formData.contact_number,
          additional_info: formData.additional_info || null,
          status: formData.status,
          closed_date: formData.status === 'Closed' ? formData.closed_date : null,
          closed_by: formData.status === 'Closed' ? user.id : null,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBackground.id);

      if (error) throw error;
      
      setModalMessage(`Background check request ${formData.status === 'Closed' ? 'closed' : 'updated'} successfully`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Update error:', error);
      setModalMessage(error.message || 'An error occurred during update');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Error alert handler
  const showErrorAlert = (message) => {
    setAlertMessage(message);
    setAlertType('error');
    setShowAlert(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  // Reset form
  const resetForm = () => {
    setSelectedBackground(null);
    setFormData({
      full_names: '',
      citizenship: '',
      id_passport_number: '',
      passport_expiry_date: '',
      department_id: '',
      date_start: '',
      date_end: '',
      work_with: '',
      contact_number: '',
      additional_info: '',
      status: 'Pending',
      closed_date: ''
    });
    setErrors({});
  };

  // Render the search view
  const renderSearchView = () => (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 flex-grow flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Search Container */}
          <motion.div
            className="z-10"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <form onSubmit={handleSearch} className="relative mb-8">
              <input
                type="text"
                className="w-full h-16 px-6 pr-12 text-lg
                  bg-gray-100 dark:bg-gray-800 
                  text-gray-900 dark:text-white
                  border-2 border-gray-200 dark:border-gray-700 
                  rounded-3xl shadow-xl
                  focus:outline-none focus:border-black dark:focus:border-gray-500 
                  transition-all duration-300
                  hover:shadow-2xl
                  placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter ID or Passport Number"
                value={searchInput}
                onChange={handleSearchInputChange}
                disabled={isSearching}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-4 top-1/2 -translate-y-1/2
                  w-8 h-8 flex items-center justify-center
                  text-gray-400 dark:text-gray-500 
                  hover:text-black dark:hover:text-white 
                  transition-colors"
              >
                {isSearching ? (
                  <motion.div
                    className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </button>

              {searchError && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 text-red-500 dark:text-red-400 text-sm text-center w-full"
                >
                  {searchError}
                </motion.p>
              )}
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Results</h3>
                <div className="space-y-4">
                  {searchResults.map(result => (
                    <div 
                      key={result.id}
                      onClick={() => handleSelectBackground(result)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{result.full_names}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">ID/Passport: {result.id_passport_number}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Department: {result.department_name || departments.find(d => d.id === result.department_id)?.name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                                        ${result.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                                        ${result.status === 'Closed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}`}>
                            {result.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Search Guide */}
            {searchResults.length === 0 && (
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Guide</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p className="flex items-center">
                    <span className="mr-2 text-black dark:text-white">•</span> 
                    Search by ID or Passport number
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2 text-black dark:text-white">•</span> 
                    Records are sorted by most recent first
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2 text-black dark:text-white">•</span> 
                    Click on a record to view and edit details
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );

  // Render the form view
  const renderFormView = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative">
      {/* Alert Popup */}
      <AnimatePresence>
        {showAlert && (
          <Alert 
            message={alertMessage} 
            type={alertType}
            onClose={() => setShowAlert(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Update Background Check</h1>
          <button
            onClick={() => setSelectedBackground(null)}
            className="px-4 py-2 flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
            <span>Back to Search</span>
          </button>
        </div>

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
                  
                  <div>
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
                    {errors.id_passport_number && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.id_passport_number}</p>
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

              {/* Status Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6"
              >
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Status Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                               bg-white dark:bg-gray-800 dark:text-white
                               focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  {formData.status === 'Closed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Closed Date
                      </label>
                      <input
                        type="date"
                        name="closed_date"
                        value={formData.closed_date}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border 
                                  ${errors.closed_date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                  bg-white dark:bg-gray-800 dark:text-white
                                  focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent`}
                      />
                      {errors.closed_date && (
                        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.closed_date}</p>
                      )}
                    </div>
                  )}
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
                  onClick={resetForm}
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
                      <span>Update Request</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={modalMessage}
          onClose={() => {
            setShowSuccessModal(false);
            resetForm();
          }}
        />
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          message={modalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );

  return selectedBackground ? renderFormView() : renderSearchView();
};

export default UpdateBackground;
