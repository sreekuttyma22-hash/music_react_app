import { useEffect, useState } from 'react';
import {
  createLocation,
  deleteLocation,
  getLocations,
  getStaffProfile,
  updateLocation,
  isStaffAdmin,
} from '../apiClient';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard' },
  // { label: 'Classes', icon: 'classes' },
  { label: 'Courses', icon: 'courses' },
    { label: 'Students', icon: 'students' },
  { label: 'Instructors', icon: 'instructors' },
    { label: 'Appointments', icon: 'schedule' },

//   { label: 'Dummy Registration', icon: 'students' },
  { label: 'Practice Rooms', icon: 'rooms' },
//   { label: 'Events', icon: 'events' },
//   { label: 'Payments', icon: 'payments' },
//   { label: 'Certificates', icon: 'certificates' },
//   { label: 'Messages', icon: 'messages' },
];

const iconMap = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5V6.5a2.5 2.5 0 0 1 2.5-2.5h3.5v8.5H4Zm10.5-8.5h2.5A2.5 2.5 0 0 1 19.5 6.5v6H14.5V4Zm0 10h5v3.5A2.5 2.5 0 0 1 17 20h-2.5v-6ZM4 14h8v6H6.5A2.5 2.5 0 0 1 4 17.5v-3.5Z" fill="currentColor"/></svg>
  ),
  classes: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#f7f3ff" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v2M17 4v2M5 8h14M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  courses: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M9 4v4M15 4v4M7 10h10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  instructors: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6 6a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M17 9h2m-1-1v2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  rooms: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm2 3.5h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  students: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-8 0v1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="12" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M19 19v-1a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M5 19v-1a4 4 0 0 1 3-3.87" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  staff: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6 6a6 6 0 0 1 12 0M18 9h3M19.5 7.5v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.5 8l4.8.7-3.5 3.4 1 4.8L12 0l-4.8 2.4 1-4.8-3.5-3.4 4.8-.7L12 3.5Z" fill="currentColor"/></svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14v10H5zM5 11h14M9 6h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  certificates: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h10a2.5 2.5 0 0 1 2.5 2.5v11l-3.5-2-3.5 2-3.5-2-3.5 2V7A2.5 2.5 0 0 1 7 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6A2.5 2.5 0 0 1 16.5 16H12l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6 6a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  )
};

const locationLabel = (location) =>
  location?.name || location?.branch_name || location?.location_name || location?.title || `Location ${location?.id}`;

const emptyLocationForm = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  active: true,
};

const Sidebar = ({
  selectedPage,
  setSelectedPage,
  onLogout,
  onAddStudent,
  locations = [],
  selectedLocationId,
  onLocationsChanged,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [openActions, setOpenActions] = useState({});
  const [locationManagerOpen, setLocationManagerOpen] = useState(false);
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationForm, setLocationForm] = useState(emptyLocationForm);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');
  const [locationToDelete, setLocationToDelete] = useState(null);
  const staff = getStaffProfile();
  const staffName = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Staff member';
  const initials = [staff.first_name, staff.last_name]
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .toUpperCase() || 'ST';

  useEffect(() => {
    const handleOpenLocationManager = () => openLocationManager();
    window.addEventListener('open-location-manager', handleOpenLocationManager);
    return () => window.removeEventListener('open-location-manager', handleOpenLocationManager);
  });

  const refreshLocations = async (preferredLocationId) => {
    const refreshedLocations = await getLocations();
    onLocationsChanged?.(refreshedLocations, preferredLocationId);
  };

  const openLocationManager = () => {
    setAccountMenuOpen(false);
    setLocationManagerOpen(true);
    setLocationForm(emptyLocationForm);
    setEditingLocationId(null);
    setLocationFeedback('');
    setLocationFormOpen(false);
  };

  const openAddLocationForm = () => {
    resetLocationForm();
    setLocationFormOpen(true);
  };

  const editLocation = (location) => {
    setEditingLocationId(location.id);
    setLocationForm({
      name: location.name || '',
      code: location.code || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      active: location.active !== false,
    });
    setLocationFeedback('');
    setLocationFormOpen(true);
  };

  const resetLocationForm = () => {
    setLocationForm(emptyLocationForm);
    setEditingLocationId(null);
    setLocationFeedback('');
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    if (!locationForm.name.trim()) {
      setLocationFeedback('Location name is required.');
      return;
    }

    setLocationSaving(true);
    setLocationFeedback('');
    try {
      const payload = {
        ...locationForm,
        name: locationForm.name.trim(),
        code: locationForm.code.trim(),
        address: locationForm.address.trim(),
        phone: locationForm.phone.trim(),
        email: locationForm.email.trim(),
      };
      const savedLocation = editingLocationId
        ? await updateLocation(editingLocationId, payload)
        : await createLocation(payload);
      await refreshLocations(savedLocation?.id || selectedLocationId);
      resetLocationForm();
      setLocationFormOpen(false);
    } catch (error) {
      setLocationFeedback(error?.message || 'Unable to save this location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const removeLocation = async () => {
    if (!locationToDelete) return;
    setLocationSaving(true);
    setLocationFeedback('');
    try {
      await deleteLocation(locationToDelete.id);
      await refreshLocations(selectedLocationId === String(locationToDelete.id) ? '' : selectedLocationId);
      if (editingLocationId === locationToDelete.id) resetLocationForm();
      setLocationToDelete(null);
    } catch (error) {
      setLocationFeedback(error?.message || 'Unable to delete this location.');
    } finally {
      setLocationSaving(false);
    }
  };

  return (
    <aside className={`sidebar-panel ${isExpanded ? 'expanded' : 'collapsed'} ${locationManagerOpen ? 'has-modal' : ''}`}>
      <div className="sidebar-brand" aria-label="Melody Music Institute">
        <div className="sidebar-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M15 8.5V17a2.5 2.5 0 1 1-1.5-2.35V4.5l7-1.5v2.5l-5.5 1.2v9.3A2.5 2.5 0 1 1 15 17Zm-8-2.5a2.5 2.5 0 1 1-2.5 2.5A2.5 2.5 0 0 1 7 6Zm0 5.5a2.5 2.5 0 1 1-2.5 2.5A2.5 2.5 0 0 1 7 12Z" fill="currentColor" />
          </svg>
        </div>
        {isExpanded && <strong>Melody Music Institute</strong>}
      </div>

      <div className="sidebar-toggle-row">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={isExpanded ? 'M15 18L9 12l6-6' : 'M9 18l6-6-6-6'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const instructorSubPages = ['Instructor Availability', 'Instructor Schedule'];
          const isInstructorSubPage = item.label === 'Instructors' && instructorSubPages.includes(selectedPage);
          const studentSubPages = ['All Students', 'Enrolled Students'];
          const isActive = selectedPage === item.label || isInstructorSubPage || (item.label === 'Students' && (studentSubPages.includes(selectedPage) || selectedPage === 'Students'));
          const hasCreateAction = ['Appointments', 'Courses', 'Students', 'Instructors'].includes(item.label);
          const isActionOpen  = Boolean(openActions[item.label]);

          return (
            <div className="nav-item-group" key={item.label}>
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.label === 'Students') {
                    setSelectedPage('All Students');
                  } else {
                    setSelectedPage(item.label);
                  }
                  if (hasCreateAction) {
                    setOpenActions((previous) => ({ ...previous, [item.label]: !previous[item.label] }));
                  }
                }}
                title={item.label}
              >
                <span className="nav-icon">{iconMap[item.icon]}</span>
                {isExpanded && <span className="nav-label">{item.label}</span>}
                {isExpanded && hasCreateAction && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        transform: isActionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>

              {isExpanded && isActionOpen && (
                <>
                  {item.label === 'Instructors' && (
                    <div className="nav-submenu" aria-label="Instructor views">
                      {[
                        ['All Instructors', 'Instructors'],
                        ['Availability', 'Instructor Availability'],
                        ['Instructor Schedule', 'Instructor Schedule'],
                      ].map(([label, page]) => (
                        <button
                          key={page}
                          type="button"
                          className={`nav-subitem ${selectedPage === page ? 'active' : ''}`}
                          onClick={() => setSelectedPage(page)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {item.label === 'Students' && (
                    <div className="nav-submenu" aria-label="Student views">
                      {[
                        ['All Students', 'All Students'],
                        ['Enrolled Students', 'Enrolled Students'],
                      ].map(([label, page]) => (
                        <button
                          key={page}
                          type="button"
                          className={`nav-subitem ${(selectedPage === page || (page === 'All Students' && selectedPage === 'Students')) ? 'active' : ''}`}
                          onClick={() => setSelectedPage(page)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="nav-create-action"
                    onClick={() => {
                      if (item.label === 'Students') {
                        setSelectedPage('All Students');
                        onAddStudent();
                      } else {
                        setSelectedPage(item.label);
                        window.dispatchEvent(new CustomEvent(
                          item.label === 'Appointments'
                            ? 'open-new-appointment'
                            : item.label === 'Courses'
                              ? 'open-new-course'
                              : 'open-new-instructor'
                        ));
                      }
                    }}
                  >
                    {item.label === 'Appointments' ? 'New Appointment' : item.label === 'Courses' ? 'Create Course' : item.label === 'Students' ? 'Add Student' : 'Add Instructor'}
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* <button
          type="button"
          className={`nav-item ${selectedPage === 'Staff Profile' ? 'active' : ''}`}
          onClick={() => setSelectedPage('Staff Profile')}
          title="My Profile"
        >
          <span className="nav-icon">{iconMap.profile}</span>
          {isExpanded && <span className="nav-label">My Profile</span>}
        </button> */}

        {isStaffAdmin() && (
          <button
            type="button"
            className={`nav-item ${selectedPage === 'Staff Management' ? 'active' : ''}`}
            onClick={() => setSelectedPage('Staff Management')}
            title="Staff Management"
          >
            <span className="nav-icon">{iconMap.staff}</span>
            {isExpanded && <span className="nav-label">Staff Management</span>}
          </button>
        )}
      </nav>

      <div className="floating-quick-actions" aria-label="Account and location controls">
        <div className="floating-action-wrap">
        {/* <button
          type="button"
          className={`floating-profile-button ${accountMenuOpen ? 'active' : ''}`}
          onClick={() => {
            setAccountMenuOpen((open) => !open);
            setLocationMenuOpen(false);
          }}
          title="Profile and account"
          aria-expanded={accountMenuOpen}
        >
          <span className="floating-avatar">{initials}</span>
        </button> */}

        {accountMenuOpen && (
          <div className="sidebar-account-actions">
            <div className="account-popup-header"><strong>{staffName}</strong><small>{staff.email || 'Staff account'}</small></div>
            <button
              type="button"
              onClick={() => {
                setSelectedPage('Profile');
                setAccountMenuOpen(false);
              }}
            >
              Profile
            </button>
            <button type="button" onClick={openLocationManager}>Locations</button>
            <button type="button" onClick={onLogout}>Logout</button>
          </div>
        )}
        </div>
      </div>

      {locationManagerOpen && (
        <div className="location-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="location-manager-title">
          <section className="location-manager">
            <header className="location-manager-header">
              <div>
                <p>Branch settings</p>
                <h2 id="location-manager-title">Locations</h2>
              </div>
              <button type="button" className="location-close" onClick={() => { setLocationManagerOpen(false); setLocationFormOpen(false); resetLocationForm(); }} aria-label="Close locations">×</button>
            </header>

            {!locationFormOpen ? (
              <div className="location-manager-content location-manager-list-only">
              <div className="location-list-panel">
                <div className="location-list-header">
                  <div>
                    <h3>All locations</h3>
                    <span>{locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
                  </div>
                  {isStaffAdmin() && (
                    <button type="button" className="location-add-button" onClick={openAddLocationForm}>+ Add Location</button>
                  )}
                </div>
                <div className="location-list" aria-label="Locations">
                {locations.length === 0 ? <p className="location-empty">No locations have been added.</p> : locations.map((location) => (
                  <article className={`location-list-item ${String(location.id) === String(selectedLocationId) ? 'selected' : ''}`} key={location.id}>
                    <div>
                      <strong>{locationLabel(location)}</strong>
                      <span>{location.code || 'No code'} · {location.active === false ? 'Inactive' : 'Active'}</span>
                    </div>
                    {isStaffAdmin() && (
                      <div className="location-item-actions">
                        <button type="button" className="location-icon-button" onClick={() => editLocation(location)} aria-label={`Edit ${locationLabel(location)}`} title="Edit location">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L18.7 8.8a2.6 2.6 0 0 0-3.6-3.6L4 16.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m13.8 6.5 3.7 3.7" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>
                        </button>
                        <button type="button" className="location-icon-button danger" disabled={locationSaving} onClick={() => setLocationToDelete(location)} aria-label={`Delete ${locationLabel(location)}`} title="Delete location">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                </div>
              </div>
              </div>
            ) : (
              <form className="location-form location-form-in-manager" onSubmit={saveLocation}>
                <div className="location-form-heading">
                  <h3>{editingLocationId ? 'Edit Location' : 'Add Location'}</h3>
                  <button type="button" onClick={() => { resetLocationForm(); setLocationFormOpen(false); }}>Back to list</button>
                </div>
                <label>Name<input required value={locationForm.name} onChange={(event) => setLocationForm((form) => ({ ...form, name: event.target.value }))} placeholder="Main Branch" /></label>
                <label>Code<input value={locationForm.code} onChange={(event) => setLocationForm((form) => ({ ...form, code: event.target.value }))} placeholder="MAIN" /></label>
                <label>Address<textarea value={locationForm.address} onChange={(event) => setLocationForm((form) => ({ ...form, address: event.target.value }))} /></label>
                <label>Phone<input value={locationForm.phone} onChange={(event) => setLocationForm((form) => ({ ...form, phone: event.target.value }))} /></label>
                <label>Email<input type="email" value={locationForm.email} onChange={(event) => setLocationForm((form) => ({ ...form, email: event.target.value }))} /></label>
                <label className="location-active"><input type="checkbox" checked={locationForm.active} onChange={(event) => setLocationForm((form) => ({ ...form, active: event.target.checked }))} /> Active location</label>
                {locationFeedback && <p className="location-feedback">{locationFeedback}</p>}
                <button className="location-save" type="submit" disabled={locationSaving}>{locationSaving ? 'Saving…' : editingLocationId ? 'Update Location' : 'Add Location'}</button>
              </form>
            )}
          </section>
        </div>
      )}

      {locationToDelete && (
        <div className="location-confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-location-title">
          <section className="location-confirm-dialog">
            <h3 id="delete-location-title">Delete location?</h3>
            <p><strong>{locationLabel(locationToDelete)}</strong> will be permanently deleted. This action cannot be undone.</p>
            <div className="location-confirm-actions">
              <button type="button" onClick={() => setLocationToDelete(null)} disabled={locationSaving}>Cancel</button>
              <button type="button" className="danger" onClick={removeLocation} disabled={locationSaving}>{locationSaving ? 'Deleting…' : 'Delete Location'}</button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
