import { useEffect, useState } from 'react';
import Header from './component/Header';
import Sidebar from './component/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import CoursesPage from './pages/CoursesPage';
import InstructorsPage from './pages/InstructorsPage';
import RoomsPage from './pages/RoomsPage';
import StudentsListPage from './pages/StudentsListPage';
import ProfilePage from './pages/ProfilePage';
import StaffProfilePage from './pages/StaffProfilePage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import StaffManagementPage from './pages/StaffManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LogoutPage from './pages/LogoutPage';
import API_CONFIG from './apiConfig';
import {
  apiRequest,
  clearStaffSession,
  getLocations,
  getRefreshToken,
  getSelectedLocationId,
  setSelectedLocationId,
  isStaffAdmin,
} from './apiClient';
import './App.css';

function App() {
  const [authPage, setAuthPage] = useState('login');
  const [selectedPage, setSelectedPage] = useState('Dashboard');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [studentEditor, setStudentEditor] = useState({ mode: 'create', studentId: null });
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocation] = useState(getSelectedLocationId());
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    if (authPage !== 'app') return;

    let cancelled = false;
    setLocationsLoading(true);
    getLocations()
      .then((items) => {
        if (cancelled) return;
        setLocations(items);
        const savedLocation = getSelectedLocationId();
        const defaultLocation = items.find((item) => String(item.id) === String(savedLocation)) || items[0];
        if (defaultLocation) {
          const id = String(defaultLocation.id);
          setSelectedLocationId(id);
          setSelectedLocation(id);
        }
      })
      .catch((error) => {
        console.error('Unable to load locations:', error);
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });

    return () => { cancelled = true; };
  }, [authPage]);

  const handleLocationChange = (locationId) => {
    setSelectedLocationId(locationId);
    setSelectedLocation(locationId);
  };

  const handleLocationsChanged = (nextLocations, preferredLocationId = selectedLocationId) => {
    setLocations(nextLocations);
    const activeLocation = nextLocations.find(
      (location) => String(location.id) === String(preferredLocationId)
    ) || nextLocations[0];

    if (activeLocation) {
      handleLocationChange(String(activeLocation.id));
    } else {
      setSelectedLocationId('');
      setSelectedLocation('');
    }
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        await apiRequest(API_CONFIG.ENDPOINTS.STAFF_LOGOUT, {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Staff logout failed:', error);
      }
    }

    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_refresh_token');
    localStorage.removeItem('staff_profile');
    setSelectedPage('Dashboard');
    setLocations([]);
    setSelectedLocation('');
    setSelectedLocationId('');
    setAuthPage('logout');
  };

  const openStudentForm = (mode, studentId = null) => {
    setStudentEditor({ mode, studentId });
    setSelectedPage('Dummy Registration');
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStaffSession();
      setAuthPage('login');
    };

    const handleProfileNavigation = () => {
      setSelectedPage('Profile');
    };

    const handleNewStaff = () => {
      setAuthPage('staff-register');
    };

    const handleClassesNavigation = () => {
      setSelectedPage('Classes');
    };

    window.addEventListener('staff-auth-expired', handleAuthExpired);
    window.addEventListener('navigate-profile', handleProfileNavigation);
    window.addEventListener('open-new-staff', handleNewStaff);
    window.addEventListener('navigate-classes', handleClassesNavigation);

    return () => {
      window.removeEventListener('staff-auth-expired', handleAuthExpired);
      window.removeEventListener('navigate-profile', handleProfileNavigation);
      window.removeEventListener('open-new-staff', handleNewStaff);
      window.removeEventListener('navigate-classes', handleClassesNavigation);
    };
  }, []);

  const renderPage = () => {
    if (selectedPage === 'Classes') {
      return <ClassesPage />;
    }

    if (selectedPage === 'Appointments' || selectedPage === 'Schedule') {
      return <AppointmentsPage />;
    }

    if (selectedPage === 'Courses') {
      return <CoursesPage />;
    }

    if (['Instructors', 'Instructor Availability', 'Instructor Schedule'].includes(selectedPage)) {
      const instructorView = selectedPage === 'Instructor Availability'
        ? 'Availability'
        : selectedPage === 'Instructor Schedule'
          ? 'Instructor Schedule'
          : 'All Instructors';

      return (
        <InstructorsPage
          activeView={instructorView}
          currentLocation={locations.find((location) => String(location.id) === String(selectedLocationId))}
        />
      );
    }

    if (selectedPage === 'Practice Rooms' || selectedPage === 'Rooms') {
      return <RoomsPage />;
    }

    if (['Students', 'All Students', 'Enrolled Students'].includes(selectedPage)) {
      const activeType = selectedPage === 'Enrolled Students' ? 'enrolled' : 'all';

      return (
        <StudentsListPage
          activeType={activeType}
          onAddStudent={() => openStudentForm('create')}
          onViewStudent={(id) => openStudentForm('view', id)}
          onEditStudent={(id) => openStudentForm('edit', id)}
        />
      );
    }

    if (selectedPage === 'Profile') {
      return <ProfilePage />;
    }

    if (selectedPage === 'Staff Profile') {
      return <StaffProfilePage />;
    }

    if (selectedPage === 'Staff Management') {
      return <StaffManagementPage />;
    }

    if (selectedPage === 'Dummy Registration' || selectedPage === 'Student Registration') {
      return (
        <StudentRegistrationPage
          mode={studentEditor.mode}
          studentId={studentEditor.studentId}
          onBack={() => setSelectedPage('Students')}
          onSuccess={() => setSelectedPage('Courses')}
        />
      );
    }

    return <DashboardPage />;
  };

  if (authPage === 'login') {
    return <LoginPage onLogin={(destination = 'app') => {
      setIsAdminMode(destination === 'admin');
      setSelectedPage('Dashboard');
      setAuthPage('app');
    }} onCreateAccount={() => setAuthPage('register')} />;
  }

  if (authPage === 'register') {
    return <RegisterPage onRegistered={() => setAuthPage('login')} onBackToLogin={() => setAuthPage('login')} />;
  }

  if (authPage === 'staff-register') {
    return (
      <RegisterPage
        onRegistered={() => {
          setSelectedPage('Staff Management');
          setAuthPage('app');
        }}
        onBackToLogin={() => setAuthPage('app')}
      />
    );
  }

  if (authPage === 'logout') {
    return <LogoutPage onLogin={(destination = 'app') => {
      setIsAdminMode(destination === 'admin');
      setSelectedPage('Dashboard');
      setAuthPage('app');
    }} onCreateAccount={() => setAuthPage('register')} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
        onLogout={handleLogout}
        onAddStudent={() => openStudentForm('create')}
        locations={locations}
        selectedLocationId={selectedLocationId}
        locationsLoading={locationsLoading}
        onLocationChange={handleLocationChange}
        onLocationsChanged={handleLocationsChanged}
      />

      <div className="content-panel">
        <Header
          onLogout={handleLogout}
          locations={locations}
          selectedLocationId={selectedLocationId}
          locationsLoading={locationsLoading}
          onLocationChange={handleLocationChange}
        />

        <div className="body-layout">
          <main className="main-content" key={selectedLocationId || 'no-location'}>
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
