import { getStaffProfile } from '../apiClient';

const formatDate = (value) => {
  if (!value) return 'Not available';

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ProfilePage = () => {
  const staff = getStaffProfile();
  const fullName = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Staff member';
  const initials = [staff.first_name, staff.last_name]
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .toUpperCase() || 'ST';

  const details = [
    ['First name', staff.first_name],
    ['Last name', staff.last_name],
    ['Staff number', staff.staff_number],
    ['Email address', staff.email],
    ['Phone number', staff.phone],
    ['Role', staff.is_admin === true ? 'Administrator' : 'Staff member'],
    ['Joined', formatDate(staff.created_at)],
  ];

  return (
    <div className="page-container profile-page">
      <div className="profile-shell">
        <div className="profile-header-row">
          <div className="profile-identity">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="eyebrow">STAFF PROFILE</div>
              <h2>{fullName}</h2>
              {/* <span className="student-badge">
                {staff.admin_enabled ? 'Admin enabled' : 'Awaiting admin approval'}
              </span> */}
            </div>
          </div>
        </div>

        <div className="profile-content-grid">
          <div className="left-column">
            <div className="section-box info-box">
              <div className="panel-header-row">
                <div className="section-title-wrap">
                  <div className="title-icon purple" aria-hidden="true">ID</div>
                  <h3>Account details</h3>
                </div>
              </div>

              <div className="info-grid">
                {details.map(([label, value]) => (
                  <div className="info-field" key={label}>
                    <label>{label}</label>
                    <span>{value || 'Not available'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* <div className="right-column">
            <div className="section-box info-box">
              <div className="panel-header-row">
                <div className="section-title-wrap">
                  <div className="title-icon purple" aria-hidden="true">OK</div>
                  <h3>Account status</h3>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-field">
                  <label>STATUS</label>
                  <span>{staff.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="info-field">
                  <label>ADMIN ACCESS</label>
                  <span>{staff.admin_enabled ? 'Enabled' : 'Pending approval'}</span>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
