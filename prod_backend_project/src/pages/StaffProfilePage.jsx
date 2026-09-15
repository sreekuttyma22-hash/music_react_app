import { useState, useEffect } from 'react';
import { getStaffProfile, imageToSrc } from '../apiClient';
import StaffEditModal from '../component/StaffEditModal';
import './StaffProfilePage.css';

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

function StaffProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const staffProfile = getStaffProfile();
    if (staffProfile && staffProfile.id) {
      setProfile(staffProfile);
    } else {
      setError('Unable to load profile information.');
    }
    setIsLoading(false);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEditSuccess = () => {
    const updated = getStaffProfile();
    setProfile(updated);
  };

  if (isLoading) {
    return (
      <div className="staff-profile-page">
        <div className="loading-state">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="staff-profile-page">
        <div className="error-state">{error || 'Profile not found'}</div>
      </div>
    );
  }

  const isApproved = profile.admin_enabled === true && profile.is_active === true;
  const isActive = profile.is_active === true;
  const statusLabel = isApproved ? 'Approved' : (profile.admin_enabled === false ? 'Disabled' : 'Pending Approval');
  const statusColor = isApproved ? '#12925b' : '#997a00';
  const profileImage = profile.profile_image ? imageToSrc(profile.profile_image) : '';

  return (
    <div className="staff-profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button className="edit-button" onClick={() => setIsModalOpen(true)}>
          <EditIcon /> Edit Profile
        </button>
      </div>

      <div className="profile-container">
        {/* Profile Summary Card */}
        <div className="profile-summary-card">
          <div className="profile-image-section">
            {profileImage ? (
              <img src={profileImage} alt={`${profile.first_name} ${profile.last_name}`} className="profile-image" />
            ) : (
              <div className="profile-avatar">
                {(profile.first_name?.[0] || 'S') + (profile.last_name?.[0] || 'T')}
              </div>
            )}
          </div>

          <div className="profile-header-info">
            <h2>{profile.first_name} {profile.last_name}</h2>
            <p className="staff-id">Staff ID: #{profile.id}</p>
            <p className="staff-role">
              {profile.is_admin ? 'Administrator' : 'Staff Member'}
            </p>
            
            <div className="status-badges">
              <div className="status-badge" style={{ borderColor: statusColor, color: statusColor }}>
                <span className="badge-dot" style={{ backgroundColor: statusColor }}></span>
                {statusLabel}
              </div>
              <div className="status-badge" style={{ borderColor: isActive ? '#12925b' : '#999', color: isActive ? '#12925b' : '#999' }}>
                <span className="badge-dot" style={{ backgroundColor: isActive ? '#12925b' : '#999' }}></span>
                {isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="profile-section">
          <h3 className="section-title">Contact Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{profile.email || '—'}</p>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <p>{profile.phone || '—'}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="profile-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Date of Birth</label>
              <p>{profile.date_of_birth || '—'}</p>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <p>{profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'}</p>
            </div>
            <div className="info-item">
              <label>Address</label>
              <p>{profile.address || '—'}</p>
            </div>
            <div className="info-item">
              <label>Qualification</label>
              <p>{profile.qualification || '—'}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="profile-section">
          <h3 className="section-title">Emergency Contact</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Emergency Contact Name</label>
              <p>{profile.emergency_contact_name || '—'}</p>
            </div>
            <div className="info-item">
              <label>Emergency Contact Phone</label>
              <p>{profile.emergency_contact_phone || '—'}</p>
            </div>
          </div>
        </div>

        {/* Approval Status Info */}
        {!isApproved && (
          <div className="approval-notice">
            <h3>Approval Status</h3>
            <p>
              Your account is currently <strong>{statusLabel.toLowerCase()}</strong>. 
              Once an administrator approves your account, you'll have full access to all features.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && profile && (
        <StaffEditModal
          staff={profile}
          onClose={handleCloseModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default StaffProfilePage;
