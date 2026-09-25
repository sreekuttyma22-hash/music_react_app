const DEFAULT_API_BASE_URL = 'https://music-backend-app-4cv8.onrender.com';
const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

// Only accept an absolute backend URL. A relative value such as "/api" would
// make the browser send requests to the Vercel frontend instead of Render.
const API_BASE_URL = /^https?:\/\//i.test(configuredApiBaseUrl)
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : DEFAULT_API_BASE_URL;

const API_CONFIG = {
  BASE_URL: API_BASE_URL,

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
    DASHBOARD: '/api/analytics/dashboard/',
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
