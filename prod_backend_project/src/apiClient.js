import API_CONFIG from './apiConfig';

const LOCATION_STORAGE_KEY = 'selected_location_id';

export const getSelectedLocationId = () => localStorage.getItem(LOCATION_STORAGE_KEY) || '';

export const setSelectedLocationId = (locationId) => {
  if (locationId === undefined || locationId === null || locationId === '') {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(LOCATION_STORAGE_KEY, String(locationId));
};

const locationFreePaths = [
  '/api/locations/',
  '/api/courses/',
  '/api/course-pricing/',
  '/api/course-packages/',
  '/api/course-package-prices/',
  '/api/lesson-types/',
  '/api/lesson-durations/',
  '/api/lesson-modes/',
  '/api/staff/',
];

// Courses are global, but their statistics aggregate branch-owned enrollment data.
const locationRequiredPaths = ['/api/courses/stats/'];

const isLocationScoped = (endpoint) => {
  const path = String(endpoint || '').replace(API_CONFIG.BASE_URL, '').split('?')[0];
  if (locationRequiredPaths.some((requiredPath) => path.startsWith(requiredPath))) {
    return true;
  }
  return !locationFreePaths.some((freePath) => path.startsWith(freePath));
};

const withSelectedLocation = (url, endpoint) => {
  const locationId = getSelectedLocationId();
  if (!locationId || !isLocationScoped(endpoint || url)) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}location=${encodeURIComponent(locationId)}`;
};

const buildUrl = (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const safeEndpoint = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.BASE_URL}${endpoint}`;

  if (!queryString) {
    return safeEndpoint;
  }

  return `${safeEndpoint}${safeEndpoint.includes('?') ? '&' : '?'}${queryString}`;
};

const formatApiError = (data) => {
  if (!data) {
    return 'Request failed';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.detail) {
    return Array.isArray(data.detail) ? data.detail.join(' ') : String(data.detail);
  }

  if (data.message || data.error) {
    return data.message || data.error;
  }

  const fieldErrors = Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      return `${field}: ${text}`;
    })
    .join(' ');

  return fieldErrors || 'Request failed';
};

export const apiRequest = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    Accept: 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (isFormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(withSelectedLocation(buildUrl(endpoint), endpoint), {
      method: 'GET',
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      notifyUnauthorized(response.status);
      throw new Error(formatApiError(data));
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const getAccessToken = () => localStorage.getItem('staff_access_token');

export const getRefreshToken = () => localStorage.getItem('staff_refresh_token');

export const clearStaffSession = () => {
  localStorage.removeItem('staff_access_token');
  localStorage.removeItem('staff_refresh_token');
  localStorage.removeItem('staff_profile');
};

const notifyUnauthorized = (status) => {
  if (status === 401 || status === 403) {
    clearStaffSession();
    window.dispatchEvent(new CustomEvent('staff-auth-expired'));
  }
};

export const getStaffProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('staff_profile') || '{}');
  } catch {
    return {};
  }
};

export const saveStaffProfile = (profile) => {
  localStorage.setItem('staff_profile', JSON.stringify(profile));
};

export const isStaffAdmin = () => {
  const staff = getStaffProfile();
  return staff.is_admin === true && staff.admin_enabled === true && staff.is_active === true;
};

export const isStaffApproved = () => {
  const staff = getStaffProfile();
  return staff.admin_enabled === true && staff.is_active === true;
};

export const isStaffActive = () => {
  const staff = getStaffProfile();
  return staff.is_active === true;
};

export const authHeaders = () => {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export const authenticatedFetch = (url, options = {}) => fetch(withSelectedLocation(url, url), {
  ...options,
  headers: {
    ...authHeaders(),
    ...(options.headers || {}),
  },
}).then((response) => {
  notifyUnauthorized(response.status);
  return response;
});

export const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

export const studentToFormData = (body = {}) => {
  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'image' || key === 'profile_image') {
      if (value instanceof File) {
        formData.append(key, value);
      }
      return;
    }

    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const many2oneName = (value) => {
  if (Array.isArray(value)) {
    return value[1] || '';
  }

  if (value && typeof value === 'object') {
    return value.name || value.display_name || value.student_name || '';
  }

  return typeof value === 'string' ? value : '';
};

export const imageToSrc = (image) => {
  if (!image || image === false) {
    return '';
  }

  if (typeof image === 'object') {
    const nestedImage = image.url || image.image_url || image.profile_image || image.data || image.base64;
    return nestedImage ? imageToSrc(nestedImage) : '';
  }

  const value = String(image);

  if (value.startsWith('http') || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${value}`;
  }

  return `data:image/jpeg;base64,${value}`;
};

const courseLabel = (record) => {
  if (record.branch_name) {
    return record.branch_name;
  }

  const details = record.course_details;
  if (details && typeof details === 'object') {
    return details.course || details.name || '—';
  }

  return '—';
};

export const mapStudentListItem = (record) => {
  const name = record.student_name || record.name || many2oneName(record.partner_id) || 'Student';

  return {
    id: record.id,
    name,
    studentId: record.student_number || `#${record.id}`,
    course: courseLabel(record),
    phone: record.phone || '—',
    email: record.email || '—',
    address: record.address || '—',
    enrollment_date: record.registration_date || '—',
    status: record.active ? 'Active' : 'Inactive',
    avatar:
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'ST',
    photo: imageToSrc(record.image),
  };
};

let studentsListRequest = null;

export const createStudent = async (body) =>
  apiRequest(API_CONFIG.ENDPOINTS.STUDENTS, {
    method: 'POST',
    body: studentToFormData(body),
  });

export const getStudents = async () => {
  if (studentsListRequest) {
    return studentsListRequest;
  }

  studentsListRequest = (async () => {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.STUDENTS, { method: 'GET' });
    return unwrapList(data).map(mapStudentListItem);
  })().finally(() => {
    studentsListRequest = null;
  });

  return studentsListRequest;
};

export const getEnrolledStudents = async () => {
  const response = await api.get('/api/enrolled-students/');
  return response?.results || [];
};

export const getStudentById = async (id) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.STUDENTS}${id}/`, { method: 'GET' });

export const updateStudent = async (id, body) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.STUDENTS}${id}/`, {
    method: 'PATCH',
    body: studentToFormData(body),
  });

export const deleteStudent = async (id) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.STUDENTS}${id}/`, {
    method: 'DELETE',
  });

// Courses API helpers
export const getCourses = async () =>
  apiRequest(API_CONFIG.ENDPOINTS.COURSES, { method: 'GET' });

export const getCourseStats = async () =>
  apiRequest(API_CONFIG.ENDPOINTS.COURSE_STATS, { method: 'GET' });

export const createCourse = async (body) =>
  apiRequest(API_CONFIG.ENDPOINTS.COURSES, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const updateCourse = async (id, body) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.COURSES}${id}/`, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const deleteCourse = async (id) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.COURSES}${id}/`, {
    method: 'DELETE',
  });

// Enrollments API helpers
export const getEnrollments = async () =>
  apiRequest(API_CONFIG.ENDPOINTS.ENROLLMENTS, { method: 'GET' });

export const createEnrollment = async (body) =>
  apiRequest(API_CONFIG.ENDPOINTS.ENROLLMENTS, {
    method: 'POST',
    body: JSON.stringify(body),
  });

// Instructors API helpers
export const getInstructors = async () =>
  apiRequest(API_CONFIG.ENDPOINTS.INSTRUCTORS, { method: 'GET' });

export const getLocations = async () => {
  const data = await apiRequest(API_CONFIG.ENDPOINTS.LOCATIONS, { method: 'GET' });
  return unwrapList(data);
};

export const createLocation = async (body) =>
  apiRequest(API_CONFIG.ENDPOINTS.LOCATIONS, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateLocation = async (id, body) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.LOCATIONS}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteLocation = async (id) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.LOCATIONS}${id}/`, { method: 'DELETE' });

export const getRooms = async () => {
  const data = await apiRequest(API_CONFIG.ENDPOINTS.ROOMS, {
    method: 'GET',
  });
  return unwrapList(data);
};

export const createRoom = async (body) =>
  apiRequest(API_CONFIG.ENDPOINTS.ROOMS, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateRoom = async (id, body) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.ROOMS}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteRoom = async (id) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.ROOMS}${id}/`, { method: 'DELETE' });

export const getAppointmentParticipants = async (appointmentId) => {
  const data = await apiRequest(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}${appointmentId}/participants/`, {
    method: 'GET',
  });
  return unwrapList(data);
};

export const addAppointmentParticipant = async (appointmentId, enrollment) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}${appointmentId}/participants/`, {
    method: 'POST',
    body: JSON.stringify({ enrollment: Number(enrollment) }),
  });

export const removeAppointmentParticipant = async (appointmentId, participantId) =>
  apiRequest(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}${appointmentId}/participants/${participantId}/`, {
    method: 'DELETE',
  });

export const api = {
  get: (endpoint, params = {}) => apiRequest(buildUrl(endpoint, params).replace(API_CONFIG.BASE_URL, ''), { method: 'GET' }),

  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (endpoint) =>
    apiRequest(endpoint, {
      method: 'DELETE',
    }),
};

// Staff management API helpers
export const getStaffList = async () => {
  const data = await apiRequest(API_CONFIG.ENDPOINTS.STAFF_LIST, { method: 'GET' });
  return unwrapList(data);
};

export const getStaffDetail = async (staffId) => {
  try {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.STAFF_DETAIL(staffId), { method: 'GET' });
    // Handle wrapped response format { success: true, result: {...} }
    return data.result || data;
  } catch (error) {
    // If apiRequest throws on 404, try fetching directly to get wrapped response
    try {
      const url = buildUrl(API_CONFIG.ENDPOINTS.STAFF_DETAIL(staffId));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...authHeaders(),
        },
      });

      const responseData = await response.json();
      // Extract data from wrapped response { success: true, result: {...} }
      if (responseData && responseData.result) {
        return responseData.result;
      }
      if (responseData && responseData.success && responseData.result === undefined) {
        return responseData;
      }
      return responseData;
    } catch (fallbackError) {
      throw error; // Throw original error if fallback also fails
    }
  }
};

export const updateStaffProfile = async (staffId, formDataOrBody) => {
  const isFormData = formDataOrBody instanceof FormData;
  return apiRequest(API_CONFIG.ENDPOINTS.STAFF_PROFILE_UPDATE(staffId), {
    method: 'PATCH',
    body: isFormData ? formDataOrBody : JSON.stringify(formDataOrBody),
  });
};

export const approveStaff = async (staffId, { admin_enabled, is_active }) =>
  apiRequest(API_CONFIG.ENDPOINTS.STAFF_APPROVAL(staffId), {
    method: 'PATCH',
    body: JSON.stringify({ admin_enabled, is_active }),
  });



// ==================================================================
export default api;
