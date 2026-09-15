import { useEffect, useState } from 'react';
import API_CONFIG from '../apiConfig';
import { apiRequest, getLocations, studentToFormData } from '../apiClient';
import './AuthPages.css';

function RegisterPage({ onRegistered, onBackToLogin }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    date_of_birth: '',
    gender: '',
    address: '',
    qualification: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    profile_image: null,
  });

  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getLocations()
      .then((items) => {
        if (!cancelled) setLocations(items);
      })
      .catch((requestError) => {
        if (!cancelled) setGeneralError(requestError.message || 'Unable to load locations.');
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validatePhone = (phone) => {
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
    if (!form.location) newErrors.location = 'Please select a location';
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(form.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const formData = studentToFormData({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location,
        password: form.password,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        address: form.address.trim() || undefined,
        qualification: form.qualification.trim() || undefined,
        emergency_contact_name: form.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
        profile_image: form.profile_image,
      });

      await apiRequest(API_CONFIG.ENDPOINTS.STAFF_REGISTER, {
        method: 'POST',
        body: formData,
      });

      setSuccessMessage('Registration successful. Please wait for administrator approval.');
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        location: '',
        password: '',
        confirmPassword: '',
        date_of_birth: '',
        gender: '',
        address: '',
        qualification: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        profile_image: null,
      });
      setPreview('');

      setTimeout(() => {
        onRegistered();
      }, 2000);
    } catch (requestError) {
      setGeneralError(requestError.message || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <main className="auth-page auth-page-centered">
        <section className="auth-form-panel auth-register-panel">
          <div className="auth-form-wrap">
            <div className="auth-success-message">
              <div className="auth-success-icon">✓</div>
              <h2>Registration Successful</h2>
              <p>{successMessage}</p>
              <p className="auth-success-subtext">You will be redirected to login shortly...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page auth-page-centered">
      <section className="auth-form-panel auth-register-panel">
        <div className="auth-form-wrap">
          <button className="auth-back-button" type="button" onClick={onBackToLogin}>← Back to login</button>
          {/* <p className="auth-kicker">Admin portal</p> */}
          <h2>Create new account</h2>
          <p className="auth-intro">Set up access for a new Melody Music Institute staff member.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Required Fields Section */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>

              <div className="auth-field-row">
                <div>
                  <label htmlFor="first-name">First name <span className="required-indicator">*</span></label>
                  <input
                    id="first-name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={updateField}
                    placeholder="First name"
                    autoComplete="given-name"
                    className={errors.first_name ? 'input-error' : ''}
                  />
                  {errors.first_name && <span className="field-error">{errors.first_name}</span>}
                </div>
                <div>
                  <label htmlFor="last-name">Last name <span className="required-indicator">*</span></label>
                  <input
                    id="last-name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={updateField}
                    placeholder="Last name"
                    autoComplete="family-name"
                    className={errors.last_name ? 'input-error' : ''}
                  />
                  {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                </div>
              </div>

              <div>
                <label htmlFor="register-email">Email address <span className="required-indicator">*</span></label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div>
                <label htmlFor="phone">Phone number <span className="required-indicator">*</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div>
                <label htmlFor="register-location">Location <span className="required-indicator">*</span></label>
                <select
                  id="register-location"
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  disabled={locationsLoading}
                  className={errors.location ? 'input-error' : ''}
                >
                  <option value="">
                    {locationsLoading ? 'Loading locations...' : 'Select a location'}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name || location.branch_name || location.location_name || `Location ${location.id}`}
                    </option>
                  ))}
                </select>
                {errors.location && <span className="field-error">{errors.location}</span>}
              </div>

              <div className="auth-field-row">
                <div>
                  <label htmlFor="register-password">Password <span className="required-indicator">*</span></label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="Create a password (min 8 characters)"
                    autoComplete="new-password"
                    className={errors.password ? 'input-error' : ''}
                  />
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>
                <div>
                  <label htmlFor="confirm-password">Confirm password <span className="required-indicator">*</span></label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={updateField}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className={errors.confirmPassword ? 'input-error' : ''}
                  />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="form-section">
              <h3 className="form-section-title">Profile Information</h3>

              <div>
                <label>Profile Image</label>
                <div className="register-profile-image-container">
                  {preview ? (
                    <div className="register-profile-image-preview">
                      <label htmlFor="register-profile-image" className="register-profile-image-change" title="Change profile image">
                        <img className="register-profile-image" src={preview} alt="Profile preview" />
                      </label>
                      <button
                        type="button"
                        className="register-profile-image-remove"
                        onClick={clearImagePreview}
                        aria-label="Remove profile image"
                        title="Remove profile image"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13" />
                        </svg>
                      </button>
                      <input id="register-profile-image" className="register-profile-image-input" type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
                    </div>
                  ) : (
                    <label className="register-profile-image-picker" htmlFor="register-profile-image">
                      <input id="register-profile-image" className="register-profile-image-input" type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
                      <span>Choose image</span>
                    </label>
                  )}
                </div>
                {errors.profile_image && <span className="field-error">{errors.profile_image}</span>}
                {!errors.profile_image && <p className="field-hint">JPG, JPEG, or PNG (max 5MB)</p>}
              </div>

              <div className="auth-field-row">
                <div>
                  <label htmlFor="dob">Date of birth</label>
                  <input
                    id="dob"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={updateField}
                    className={errors.date_of_birth ? 'input-error' : ''}
                  />
                  {errors.date_of_birth && <span className="field-error">{errors.date_of_birth}</span>}
                </div>
                <div>
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" name="gender" value={form.gender} onChange={updateField}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label htmlFor="qualification">Qualification</label>
                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  value={form.qualification}
                  onChange={updateField}
                  placeholder="e.g., Bachelor of Music, MA in Performance"
                />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="form-section">
              <h3 className="form-section-title">Emergency Contact</h3>

              <div>
                <label htmlFor="emergency-name">Emergency contact name</label>
                <input
                  id="emergency-name"
                  name="emergency_contact_name"
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={updateField}
                  placeholder="Full name"
                />
              </div>

              <div>
                <label htmlFor="emergency-phone">Emergency contact phone</label>
                <input
                  id="emergency-phone"
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

            {generalError && <p className="auth-error" role="alert">{generalError}</p>}
            <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
