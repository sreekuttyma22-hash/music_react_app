import { useState } from 'react';
import { getStaffProfile } from '../apiClient';

const Header = ({ onLogout, locations = [], selectedLocationId, locationsLoading, onLocationChange }) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [locationMenuOpen, setLocationMenuOpen] = useState(false);
	const staff = getStaffProfile();
	const staffName = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Staff member';
	const initials = [staff.first_name, staff.last_name]
		.filter(Boolean)
		.map((name) => name[0])
		.join('')
		.toUpperCase() || 'ST';

	return (
		<header className="top-toolbar">
			<div className="toolbar-brand">
				<div className="brand-mark" aria-hidden="true">
					<svg viewBox="0 0 24 24" role="img" aria-label="Music institute logo">
						<path d="M15 8.5V17a2.5 2.5 0 1 1-1.5-2.35V4.5l7-1.5v2.5l-5.5 1.2v9.3A2.5 2.5 0 1 1 15 17ZM7 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" fill="currentColor" />
					</svg>
				</div>
				<div className="brand-copy">
					<div className="brand-name">Melody Music Institute</div>
					<div className="brand-subtitle">Nurturing Every Note</div>
				</div>
			</div>

			<div className="toolbar-actions">
				<div className="header-location-wrap">
					<button
						className={`action-icon location-action${locationMenuOpen ? ' active' : ''}`}
						type="button"
						aria-label="Change location"
						aria-expanded={locationMenuOpen}
						title="Change location"
						onClick={() => {
							setLocationMenuOpen((open) => !open);
							setMenuOpen(false);
						}}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
							<circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
						</svg>
					</button>
					{locationMenuOpen && (
						<div className="header-location-menu" role="dialog" aria-label="Change location">
							<strong>Switch location</strong>
							<select
								value={selectedLocationId || ''}
								onChange={(event) => {
									onLocationChange?.(event.target.value);
									setLocationMenuOpen(false);
								}}
								disabled={locationsLoading || locations.length === 0}
							>
								{locationsLoading && <option value="">Loading locations...</option>}
								{!locationsLoading && locations.length === 0 && <option value="">No locations available</option>}
								{locations.map((location) => (
									<option key={location.id} value={location.id}>
										{location.name || location.branch_name || `Location ${location.id}`}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<div className="profile-menu-wrap">
					<button
						className={`user-profile${menuOpen ? ' open' : ''}`}
						type="button"
						aria-label="User profile"
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<span className="avatar">{initials}</span>
						{/* <div className="profile-meta">
							<span className="profile-name">{staffName}</span>
						</div> */}
						{/* <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
						</svg> */}
					</button>

					{menuOpen && (
						<div className="profile-dropdown" role="menu" aria-label="Profile menu">
							<div className="profile-dropdown-header">
								<span className="avatar dropdown-avatar">{initials}</span>
								<strong>{staffName}</strong>
							</div>
							<button
								className="dropdown-item"
								type="button"
								onClick={() => {
									setMenuOpen(false);
									window.dispatchEvent(new CustomEvent('navigate-profile'));
								}}
							>
								Profile
							</button>
								<button
									className="dropdown-item"
									type="button"
									onClick={() => {
										setMenuOpen(false);
										window.dispatchEvent(new CustomEvent('open-location-manager'));
									}}
								>
									Locations
								</button>
							<button
								className="dropdown-item danger"
								type="button"
								onClick={() => {
									setMenuOpen(false);
									onLogout();
								}}
							>
								Logout
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
// import { useState } from 'react';
// import { getStaffProfile } from '../apiClient';

// const Header = ({ onLogout }) => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const staff = getStaffProfile();
//   const staffName = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Staff member';
//   const initials = [staff.first_name, staff.last_name]
//     .filter(Boolean)
//     .map((name) => name[0])
//     .join('')
//     .toUpperCase() || 'ST';

//   return (
//     <header className="top-toolbar">
//       <div className="toolbar-brand">
//         <div className="brand-mark" aria-hidden="true">
//           <svg viewBox="0 0 24 24" role="img" aria-label="Music institute logo">
//             <path d="M15 8.5V17a2.5 2.5 0 1 1-1.5-2.35V4.5l7-1.5v2.5l-5.5 1.2v9.3A2.5 2.5 0 1 1 15 17Zm-8-2.5a2.5 2.5 0 1 1-2.5 2.5A2.5 2.5 0 0 1 7 6Zm0 5.5a2.5 2.5 0 1 1-2.5 2.5A2.5 2.5 0 0 1 7 12Z" fill="currentColor"/>
//           </svg>
//         </div>

//         <div className="brand-copy">
//           <div className="brand-name">Melody Music Institute</div>
//           <div className="brand-subtitle">Nurturing Every Note</div>
//         </div>
//       </div>

//       {/* <div className="toolbar-search" role="search">
//         <svg viewBox="0 0 24 24" aria-hidden="true">
//           <circle cx="11" cy="11" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
//           <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
//         </svg>
//         <input type="text" placeholder="Search classes, rooms, instructors..." />
//       </div> */}

//       <div className="toolbar-actions">
//         {/* <button className="action-icon" type="button" aria-label="Notifications">
//           <svg viewBox="0 0 24 24" aria-hidden="true">
//             <path d="M12 4a4 4 0 0 1 4 4v2.5c0 1.3.4 2.6 1.3 3.7l1.1 1.3H5.6l1.1-1.3A5.7 5.7 0 0 0 8 10.5V8a4 4 0 0 1 4-4Zm0 16a2.7 2.7 0 0 1-2.6-2h5.2A2.7 2.7 0 0 1 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
//           </svg>
//           <span className="notification-dot">3</span>
//         </button> */}

//         {/* <button className="action-icon" type="button" aria-label="Inbox">
//           <svg viewBox="0 0 24 24" aria-hidden="true">
//             <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-7Zm2 0 3.2 3.2a2.7 2.7 0 0 0 3.6 0L18 8.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </button>

//         <button className="action-icon" type="button" aria-label="Calendar">
//           <svg viewBox="0 0 24 24" aria-hidden="true">
//             <rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7"/>
//             <path d="M8 4v4M16 4v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
//           </svg>
//         </button> */}

//         <div className="profile-menu-wrap">
//           <button
//             className={`user-profile${menuOpen ? ' open' : ''}`}
//             type="button"
//             aria-label="User profile"
//             aria-expanded={menuOpen}
//             onClick={() => setMenuOpen((open) => !open)}
//           >
//             <span className="avatar">{initials}</span>
//             <div className="profile-meta">
//               <span className="profile-name">{staffName}</span>
//               {/* <span className="profile-role">Student</span> */}
//             </div>
//             <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
//               <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>

//           {menuOpen && (
//             <div className="profile-dropdown" role="menu" aria-label="Profile menu">
//               <div className="profile-dropdown-header">
//                 <span className="avatar dropdown-avatar">{initials}</span>
//                 <div>
//                   <strong>{staffName}</strong>
//                   {/* <span>Student</span> */}
//                 </div>
//               </div>

//               <button
//                 className="dropdown-item"
//                 type="button"
//                 onClick={() => {
//                   setMenuOpen(false);
//                   window.dispatchEvent(new CustomEvent('navigate-profile'));
//                 }}
//               >
//                 <svg viewBox="0 0 24 24" aria-hidden="true">
//                   <path d="M12 12.5a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12.5Zm-7 6.5a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//                 Profile
//               </button>

//               {/* <button className="dropdown-item" type="button" onClick={() => setMenuOpen(false)}>
//                 <svg viewBox="0 0 24 24" aria-hidden="true">
//                   <path d="M10 4.5h4M8 7.5h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm1.5 5.5h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//                 Settings
//               </button> */}

//               <button
//                 className="dropdown-item danger"
//                 type="button"
//                 onClick={() => {
//                   setMenuOpen(false);
//                   onLogout();
//                 }}
//               >
//                 <svg viewBox="0 0 24 24" aria-hidden="true">
//                   <path d="M9 7V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V7M5 7h14l-1 12.5A2 2 0 0 1 16 21H8a2 2 0 0 1-2-1.5L5 7Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
