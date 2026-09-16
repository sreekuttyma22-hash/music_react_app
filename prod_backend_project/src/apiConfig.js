const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000' || 'https://music-backend-app-4cv8.onrender.com',

  ENDPOINTS: {
    LOCATIONS: '/api/locations/',
    STUDENTS: '/api/students/',
    COURSES: '/api/courses/',
    COURSE_STATS: '/api/courses/stats/',
    COURSE_PRICING: '/api/course-pricing/',
    COURSE_PACKAGES: '/api/course-packages/',
    COURSE_PACKAGE_PRICES: '/api/course-package-prices/',
    ENROLLMENTS: '/api/enrollments/',
    LESSON_TYPES: '/api/lesson-types/',
    LESSON_DURATIONS: '/api/lesson-durations/',
    LESSON_MODES: '/api/lesson-modes/',
    CLASSES: '/api/classes/',
    INSTRUCTORS: '/api/instructors/',
    CATEGORIES: '/api/categories/',
    ROOMS: '/api/rooms/',
    APPOINTMENTS: '/api/appointments/',
    DASHBOARD: '/api/dashboard/',
    STAFF_LOGIN: '/api/staff/login/',
    STAFF_REGISTER: '/api/staff/create/',
    STAFF_LOGOUT: '/api/staff/logout/',
    STAFF_ME: '/api/staff/me/',
    STAFF_LIST: '/api/staff/',
    STAFF_DETAIL: (staffId) => `/api/staff/${staffId}/`,
    STAFF_APPROVAL: (staffId) => `/api/staff/${staffId}/approval/`,
    STAFF_PROFILE_UPDATE: (staffId) => `/api/staff/${staffId}/`,
  },
};

export default API_CONFIG;
