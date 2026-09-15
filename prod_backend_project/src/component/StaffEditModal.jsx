import { useState, useEffect } from 'react';
import { updateStaffProfile, studentToFormData, imageToSrc } from '../apiClient';
import './StaffEditModal.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function StaffEditModal({ staff, onClose, onSuccess }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    qualification: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    profile_image: null,
  });

  const [preview, setPreview] = useState('');
  const [originalImage, setOriginalImage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (staff) {
      setForm({
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        date_of_birth: staff.date_of_birth || '',
        gender: staff.gender || '',
        address: staff.address || '',
        qualification: staff.qualification || '',
        emergency_contact_name: staff.emergency_contact_name || '',
        emergency_contact_phone: staff.emergency_contact_phone || '',
        profile_image: null,
      });

      if (staff.profile_image) {
        const imageSrc = imageToSrc(staff.profile_image);
        setOriginalImage(imageSrc);
        setPreview(imageSrc);
      } else {
        setPreview('');
        setOriginalImage('');
      }
    }
  }, [staff]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional for update
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    // Optional fields validation
    if (form.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) {
      newErrors.date_of_birth = 'Please enter a valid date';
    }
    if (form.emergency_contact_phone && !validatePhone(form.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
      setErrors({ ...errors, profile_image: 'Please upload a JPG, JPEG, or PNG image' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, profile_image: 'Image size must be less than 5MB' });
      return;
    }

    setForm({ ...form, profile_image: file });

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result || '');
    };
    reader.readAsDataURL(file);

    setErrors({ ...errors, profile_image: '' });
  };

  const clearImagePreview = () => {
    setForm({ ...form, profile_image: null });
    setPreview('');
    setOriginalImage('');
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        address: form.address.trim() || undefined,
        qualification: form.qualification.trim() || undefined,
        emergency_contact_name: form.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
      };

      // Only include profile_image if a new one was selected
      if (form.profile_image) {
        updateData.profile_image = form.profile_image;
      }

      const formData = studentToFormData(updateData);

      await updateStaffProfile(staff.id, formData);

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (requestError) {
      setGeneralError(requestError.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Staff Profile</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-first-name">First name <span className="required-indicator">*</span></label>
                  <input
                    id="edit-first-name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={updateField}
                    placeholder="First name"
                    className={errors.first_name ? 'input-error' : ''}
                  />
                  {errors.first_name && <span className="field-error">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-last-name">Last name <span className="required-indicator">*</span></label>
                  <input
                    id="edit-last-name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={updateField}
                    placeholder="Last name"
                    className={errors.last_name ? 'input-error' : ''}
                  />
                  {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email <span className="required-indicator">*</span></label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Email address"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-phone">Phone <span className="required-indicator">*</span></label>
                <input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Phone number"
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Profile Information */}
            <div className="form-section">
              <h3 className="form-section-title">Profile Information</h3>

              <div className="form-group">
                <label>Profile Image</label>
                <div className="staff-profile-image-upload">
                  {preview ? (
                    <div className="staff-profile-image-preview has-image">
                      <img src={preview} alt="Profile" />
                      <button type="button" className="staff-profile-image-remove" onClick={clearImagePreview} aria-label="Remove image" title="Remove image">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="staff-profile-image-preview">
                      <label htmlFor="edit-profile-image" className="staff-profile-image-placeholder">Upload image</label>
                    </div>
                  )}
                  <input id="edit-profile-image" className="staff-profile-image-input" type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                {errors.profile_image && <span className="field-error">{errors.profile_image}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-dob">Date of birth</label>
                  <input
                    id="edit-dob"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={updateField}
                    className={errors.date_of_birth ? 'input-error' : ''}
                  />
                  {errors.date_of_birth && <span className="field-error">{errors.date_of_birth}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-gender">Gender</label>
                  <select id="edit-gender" name="gender" value={form.gender} onChange={updateField}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-address">Address</label>
                <input
                  id="edit-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Street address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-qualification">Qualification</label>
                <input
                  id="edit-qualification"
                  name="qualification"
                  type="text"
                  value={form.qualification}
                  onChange={updateField}
                  placeholder="e.g., Bachelor of Music"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="form-section">
              <h3 className="form-section-title">Emergency Contact</h3>

              <div className="form-group">
                <label htmlFor="edit-emergency-name">Emergency contact name</label>
                <input
                  id="edit-emergency-name"
                  name="emergency_contact_name"
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={updateField}
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-emergency-phone">Emergency contact phone</label>
                <input
                  id="edit-emergency-phone"
                  name="emergency_contact_phone"
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={updateField}
                  placeholder="Phone number"
                  className={errors.emergency_contact_phone ? 'input-error' : ''}
                />
                {errors.emergency_contact_phone && <span className="field-error">{errors.emergency_contact_phone}</span>}
              </div>
            </div>

            {generalError && <div className="form-error-alert">{generalError}</div>}
            {success && <div className="form-success-alert">{success}</div>}

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StaffEditModal;
