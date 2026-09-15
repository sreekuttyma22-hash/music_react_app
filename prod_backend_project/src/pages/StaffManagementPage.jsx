import { useState, useEffect } from 'react';
import { getStaffList, getStaffDetail, approveStaff, isStaffAdmin } from '../apiClient';
import StaffEditModal from '../component/StaffEditModal';
import './StaffManagementPage.css';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const getInitials = (firstName = '', lastName = '') => {
  return [firstName, lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

function StaffManagementPage() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadStaff = async () => {
    setIsLoading(true);
    setError('');

    try {
      const staff = await getStaffList();
      setStaffList(staff);
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaffAdmin()) {
      setIsLoading(false);
      return;
    }

    loadStaff();
  }, []);

  const handleOpenEditModal = async (staffId) => {
    setIsLoadingDetail(true);
    try {
      const staffDetail = await getStaffDetail(staffId);
      setEditingStaff(staffDetail);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load staff details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleEditSuccess = () => {
    loadStaff();
    setSuccess('Staff profile updated successfully!');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const handleApproveStaff = async (staffId, currentStaff) => {
    setActionInProgress(staffId);
    setError('');
    setSuccess('');

    try {
      const newApprovalState = {
        admin_enabled: true,
        is_active: true,
      };

      await approveStaff(staffId, newApprovalState);
      setSuccess(`${currentStaff.first_name} ${currentStaff.last_name} has been approved.`);
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to approve staff member');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDisableStaff = async (staffId, currentStaff) => {
    setActionInProgress(staffId);
    setError('');
    setSuccess('');

    try {
      const newApprovalState = {
        admin_enabled: false,
        is_active: false,
      };

      await approveStaff(staffId, newApprovalState);
      setSuccess(`${currentStaff.first_name} ${currentStaff.last_name} has been disabled.`);
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to disable staff member');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isStaffAdmin()) {
    return (
      <div className="staff-management-page">
        <div className="staff-management-error">
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-management-page">
      <div className="staff-management-header">
        <div>
          {/* <h1>Staff Management</h1>
          <p>Approve, manage, and monitor staff members</p> */}
        </div>
        <button className="staff-add-button" onClick={() => window.dispatchEvent(new CustomEvent('open-new-staff'))}>
          <PlusIcon /> Add Staff
        </button>
      </div>

      {error && <div className="staff-management-alert alert-error" role="alert">{error}</div>}
      {success && <div className="staff-management-alert alert-success" role="alert">{success}</div>}

      {isLoading ? (
        <div className="staff-management-loading">
          <p>Loading staff list...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="staff-management-empty">
          <p>No staff members found.</p>
        </div>
      ) : (
        <div className="staff-grid">
          {staffList.map((staff) => {
            const isApproved = staff.admin_enabled === true && staff.is_active === true;
            const isActionInProgress = actionInProgress === staff.id;
            const statusBgColor = isApproved ? '#e8f8ef' : '#fff3cd';
            const statusTextColor = isApproved ? '#12925b' : '#997a00';
            const statusText = isApproved ? 'Approved' : 'Pending';

            return (
              <article key={staff.id} className="staff-card">
                <div className="staff-image-section">
                  <div className="staff-avatar">
                    {getInitials(staff.first_name, staff.last_name)}
                  </div>
                </div>

                <div className="staff-info">
                  <div className="staff-name-row">
                    <div>
                      <h3>{staff.first_name} {staff.last_name}</h3>
                      <div className="staff-number">#{staff.id}</div>
                    </div>
                    <span className="staff-status" style={{ background: statusBgColor, color: statusTextColor }}>
                      <span className="status-dot" style={{ background: statusTextColor }}></span>
                      {statusText}
                    </span>
                  </div>

                  <p className="staff-role">
                    {staff.is_admin ? 'Administrator' : 'Staff Member'}
                  </p>

                  <p className="staff-email">
                    {staff.email}
                  </p>

                  <p className="staff-phone">
                    {staff.phone || '—'}
                  </p>

                  <div className="staff-actions">
                    <button
                      type="button"
                      className="card-action edit"
                      onClick={() => handleOpenEditModal(staff.id)}
                      disabled={isLoadingDetail || isActionInProgress}
                      title="Edit profile"
                    >
                      <EditIcon />
                    </button>
                    {!isApproved ? (
                      <button
                        type="button"
                        className="card-action approve"
                        onClick={() => handleApproveStaff(staff.id, staff)}
                        disabled={isActionInProgress}
                        title="Approve staff"
                      >
                        <PlusIcon />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="card-action delete"
                        onClick={() => handleDisableStaff(staff.id, staff)}
                        disabled={isActionInProgress}
                        title="Disable staff"
                      >
                        <DeleteIcon />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen && editingStaff && (
        <StaffEditModal
          staff={editingStaff}
          onClose={handleCloseModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default StaffManagementPage;
