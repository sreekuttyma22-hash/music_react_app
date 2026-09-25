
import { useEffect, useMemo, useRef, useState } from 'react';
import { authenticatedFetch } from '../apiClient';
import API_CONFIG from '../apiConfig';
import ConfirmDialog from '../component/ConfirmDialog';

const API_URL = 'https://sreekuttyma22.pythonanywhere.com/api/instructors/';
const CATEGORIES_API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;

/* =========================================================
   ICONS
========================================================= */

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/* =========================================================
   DEFAULT AVAILABILITY
========================================================= */

const defaultAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyForm = {
  instructor_name: '',
  profile_image: null,
  date_of_birth: '',
  gender: '',
  email: '',
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  address: '',
  qualification: '',
  specialization: '',
  experience_years: 0,
  bio: '',
  branch_id: '',
  branch_name: '',
  joining_date: '',
  employment_type: 'full_time',
  status: 'active',
  availability: defaultAvailability,
  notes: '',
};

/* =========================================================
   HELPERS
========================================================= */

const parseJSONField = (value, fallback) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(
        'Unable to parse JSON field:',
        value,
        error
      );

      return fallback;
    }
  }

  return fallback;
};

const normalizeAvailability = (availability) => {
  const parsed = parseJSONField(
    availability,
    {}
  );

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    return {
      ...defaultAvailability,
    };
  }

  return {
    ...defaultAvailability,
    ...parsed,
  };
};

const normalizeSpecializationValues = (specialization) => {
  const parsed = parseJSONField(specialization, []);
  const values = Array.isArray(parsed) ? parsed : [parsed];

  return values
    .map((item) => {
      if (item && typeof item === 'object') {
        return item.name || item.category_name || item.title || '';
      }

      return item;
    })
    .filter(Boolean);
};

const normalizeCategoryList = (data) => {
  const list = Array.isArray(data) ? data : data?.results || data?.data || [];

  return list.filter((category) => category && category.id !== undefined && category.id !== null);
};

const formatSpecialization = (specialization) => {
  const values = normalizeSpecializationValues(specialization);
  return values.length ? values.join(', ') : 'Music Instructor';
};

const getLocationName = (location) =>
  location?.name || location?.branch_name || location?.location_name || location?.title || '';

const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const formatStatus = (status) => {
  if (!status) return '';

  return status
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
};

const getImageUrl = (image) => {
  if (!image) return null;

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  return `https://sreekuttyma22.pythonanywhere.com${image}`;
};

/* =========================================================
   CALENDAR HELPERS
========================================================= */

const WEEK_DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const TIMELINE_START = 0;
const TIMELINE_END = 24;
const HOUR_WIDTH = 90;
const RESOURCE_WIDTH = 170;

const getStartOfWeek = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  result.setDate(
    result.getDate() - day
  );

  return result;
};

const getWeekDates = (date) => {
  const start = getStartOfWeek(date);

  return Array.from(
    { length: 7 },
    (_, index) => {
      const dateValue = new Date(start);

      dateValue.setDate(
        start.getDate() + index
      );

      return dateValue;
    }
  );
};

const getMonthDates = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  );

  const lastDay = new Date(
    year,
    month + 1,
    0
  );

  const start = new Date(firstDay);

  start.setDate(
    firstDay.getDate() -
      firstDay.getDay()
  );

  const end = new Date(lastDay);

  end.setDate(
    lastDay.getDate() +
      (6 - lastDay.getDay())
  );

  const dates = [];

  const current = new Date(start);

  while (current <= end) {
    dates.push(
      new Date(current)
    );

    current.setDate(
      current.getDate() + 1
    );
  }

  return dates;
};

const isSameDate = (
  first,
  second
) => {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
};

const formatDate = (date) => {
  return `${MONTH_LABELS[date.getMonth()].slice(
    0,
    3
  )} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatShortDate = (date) => {
  return `${MONTH_LABELS[date.getMonth()].slice(
    0,
    3
  )} ${date.getDate()}`;
};

const parseTime = (time) => {
  if (!time) return null;

  const normalizedTime = time
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  const match = normalizedTime.match(
    /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
  );

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3];

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    minute > 59 ||
    hour > (period ? 12 : 23) ||
    (period && hour === 0)
  ) {
    return null;
  }

  if (period === 'AM' && hour === 12) {
    hour = 0;
  } else if (period === 'PM' && hour !== 12) {
    hour += 12;
  }

  return {
    hour,
    minute,
  };
};

const parseSlot = (slot) => {
  if (
    !slot ||
    typeof slot !== 'string'
  ) {
    return null;
  }

  const parts = slot.split('-');

  if (parts.length !== 2) {
    return null;
  }

  const start = parseTime(
    parts[0].trim()
  );

  const end = parseTime(
    parts[1].trim()
  );

  if (!start || !end) {
    return null;
  }

  return {
    start,
    end,
  };
};

const minutesFromStart = (
  time
) => {
  return (
    (time.hour - TIMELINE_START) *
      60 +
    time.minute
  );
};

const formatTime = (time) => {
  if (!time) return '';

  const date = new Date();

  date.setHours(
    time.hour,
    time.minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );
};

const formatTimeRange = (
  slot
) => {
  const parsed = parseSlot(slot);

  if (!parsed) {
    return slot;
  }

  return `${formatTime(
    parsed.start
  )} - ${formatTime(
    parsed.end
  )}`;
};

const getAvailabilitySlots = (
  instructor,
  date
) => {
  const availability =
    normalizeAvailability(
      instructor.availability
    );

  const dayName =
    WEEK_DAYS[date.getDay()];

  return Array.isArray(
    availability[dayName]
  )
    ? availability[dayName]
    : [];
};

/* =========================================================
   COMPONENT
========================================================= */

const InstructorsPage = ({ activeView = 'All Instructors', currentLocation }) => {

  const [instructors, setInstructors] =
    useState([]);

  const [specializationOptions, setSpecializationOptions] =
    useState([]);

  const [showSpecializationDropdown, setShowSpecializationDropdown] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [editingInstructor, setEditingInstructor] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [instructorToDelete, setInstructorToDelete] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const imageInputRef = useRef(null);

  const specializationSelectRef = useRef(null);

  /* =======================================================
     CALENDAR STATE
  ======================================================= */

  const [calendarView, setCalendarView] =
    useState('day');

  const [calendarDate, setCalendarDate] =
    useState(new Date());

  const [selectedInstructorId, setSelectedInstructorId] =
    useState('all');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [viewMode, setViewMode] =
    useState('grid');

  /* =======================================================
     GET INSTRUCTORS
  ======================================================= */

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await authenticatedFetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Failed to load instructors (${response.status})`
        );
      }

      const data =
        await response.json();

      const instructorData =
        Array.isArray(data)
          ? data
          : data.results ||
            data.data ||
            [];

      setInstructors(
        instructorData
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Unable to load instructors.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authenticatedFetch(CATEGORIES_API_URL);

      if (!response.ok) {
        throw new Error(`Failed to load categories (${response.status})`);
      }

      const data = await response.json();
      setSpecializationOptions(normalizeCategoryList(data));
    } catch (err) {
      console.error('Unable to load instructor categories:', err);
      setSpecializationOptions([]);
    }
  };

  useEffect(() => {
    fetchInstructors();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!showSpecializationDropdown) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!specializationSelectRef.current?.contains(event.target)) {
        setShowSpecializationDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowSpecializationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSpecializationDropdown]);

  /* =======================================================
     CALENDAR DATA
  ======================================================= */

  const visibleInstructors =
    useMemo(() => {
      if (
        selectedInstructorId ===
        'all'
      ) {
        return instructors;
      }

      return instructors.filter(
        (instructor) =>
          String(instructor.id) ===
          String(
            selectedInstructorId
          )
      );
    }, [
      instructors,
      selectedInstructorId,
    ]);

  const filteredInstructors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return instructors;
    }

    return instructors.filter((instructor) => {
      const searchableText = [
        instructor.instructor_name,
        instructor.instructor_number,
        instructor.email,
        instructor.phone,
        instructor.specialization,
        instructor.qualification,
        instructor.branch_name,
        instructor.employment_type,
        instructor.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [instructors, searchTerm]);

  const weekDates = useMemo(
    () =>
      getWeekDates(
        calendarDate
      ),
    [calendarDate]
  );

  const monthDates = useMemo(
    () =>
      getMonthDates(
        calendarDate
      ),
    [calendarDate]
  );

  /* =======================================================
     CALENDAR NAVIGATION
  ======================================================= */

  const goToday = () => {
    setCalendarDate(
      new Date()
    );
  };

  const goPrevious = () => {
    setCalendarDate((prev) => {
      const date = new Date(prev);

      if (
        calendarView === 'day'
      ) {
        date.setDate(
          date.getDate() - 1
        );
      } else if (
        calendarView === 'week'
      ) {
        date.setDate(
          date.getDate() - 7
        );
      } else {
        date.setMonth(
          date.getMonth() - 1
        );
      }

      return date;
    });
  };

  const goNext = () => {
    setCalendarDate((prev) => {
      const date = new Date(prev);

      if (
        calendarView === 'day'
      ) {
        date.setDate(
          date.getDate() + 1
        );
      } else if (
        calendarView === 'week'
      ) {
        date.setDate(
          date.getDate() + 7
        );
      } else {
        date.setMonth(
          date.getMonth() + 1
        );
      }

      return date;
    });
  };

  const goLastWeek = () => {
    setCalendarView('week');

    setCalendarDate((prev) => {
      const date = new Date(prev);

      date.setDate(
        date.getDate() - 7
      );

      return date;
    });
  };

  /* =======================================================
     CALENDAR TITLE
  ======================================================= */

  const getCalendarTitle = () => {
    if (
      calendarView === 'day'
    ) {
      return formatDate(
        calendarDate
      );
    }

    if (
      calendarView === 'week'
    ) {
      const start =
        weekDates[0];

      const end =
        weekDates[6];

      if (
        start.getMonth() ===
        end.getMonth()
      ) {
        return `${MONTH_LABELS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      }

      return `${formatShortDate(
        start
      )} – ${formatDate(end)}`;
    }

    return `${MONTH_LABELS[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
  };

  /* =======================================================
     FORM FIELD UPDATE
  ======================================================= */

  const updateField = (
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =======================================================
     ADD
  ======================================================= */

  const handleAddInstructor = () => {
    setEditingInstructor(null);

    setFormData({
      ...emptyForm,
      branch_id: currentLocation?.id ?? '',
      branch_name: getLocationName(currentLocation),
      availability: {
        ...defaultAvailability,
      },
    });

    setShowSpecializationDropdown(false);
    setImagePreview(null);

    setShowModal(true);
  };

  useEffect(() => {
    const handleOpenNewInstructor = () => handleAddInstructor();
    window.addEventListener('open-new-instructor', handleOpenNewInstructor);
    return () => window.removeEventListener('open-new-instructor', handleOpenNewInstructor);
  }, []);

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEditInstructor = (
    instructor
  ) => {
    try {
      setEditingInstructor(
        instructor
      );

      const specialization = normalizeSpecializationValues(instructor.specialization);

      const availability =
        normalizeAvailability(
          instructor.availability
        );

      setFormData({
        instructor_name:
          instructor.instructor_name ||
          '',

        profile_image: null,

        date_of_birth:
          instructor.date_of_birth ||
          '',

        gender:
          instructor.gender ||
          '',

        email:
          instructor.email ||
          '',

        phone:
          instructor.phone ||
          '',

        emergency_contact_name:
          instructor.emergency_contact_name ||
          '',

        emergency_contact_phone:
          instructor.emergency_contact_phone ||
          '',

        address:
          instructor.address ||
          '',

        qualification:
          instructor.qualification ||
          '',

        specialization,

        experience_years:
          instructor.experience_years ||
          0,

        bio:
          instructor.bio ||
          '',

        branch_id:
          currentLocation?.id ?? instructor.branch_id ?? '',

        branch_name:
          getLocationName(currentLocation) || instructor.branch_name || '',

        joining_date:
          instructor.joining_date ||
          '',

        employment_type:
          instructor.employment_type ||
          'full_time',

        status:
          instructor.status ||
          'active',

        availability,

        notes:
          instructor.notes ||
          '',
      });

      setImagePreview(
        getImageUrl(
          instructor.profile_image
        )
      );

      setShowModal(true);
    } catch (err) {
      console.error(err);

      setError(
        'Unable to open instructor details.'
      );
    }
  };

  /* =======================================================
     IMAGE
  ======================================================= */

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    updateField(
      'profile_image',
      file
    );

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  const removeImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    updateField('profile_image', null);
    setImagePreview(null);
  };

  const toggleSpecialization = (specialization) => {
    setFormData((prev) => {
      const selectedSpecializations = Array.isArray(prev.specialization)
        ? prev.specialization
        : normalizeSpecializationValues(prev.specialization);

      return {
        ...prev,
        specialization: selectedSpecializations.includes(specialization)
          ? selectedSpecializations.filter((item) => item !== specialization)
          : [...selectedSpecializations, specialization],
      };
    });
  };

  /* =======================================================
     AVAILABILITY UPDATE
  ======================================================= */

  const updateAvailability = (
    day,
    value
  ) => {
    const slots =
      value
        .split(',')
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);

    setFormData((prev) => ({
      ...prev,

      availability: {
        ...normalizeAvailability(
          prev.availability
        ),

        [day]: slots,
      },
    }));
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const payload =
        new FormData();

      const submissionData = {
        ...formData,
        branch_id: currentLocation?.id ?? formData.branch_id,
        branch_name: getLocationName(currentLocation) || formData.branch_name,
      };

      Object.entries(
        submissionData
      ).forEach(
        ([key, value]) => {
          if (
            key ===
            'profile_image'
          ) {
            if (
              value instanceof File
            ) {
              payload.append(
                key,
                value
              );
            }

            return;
          }

          if (
            key ===
              'specialization' ||
            key ===
              'availability'
          ) {
            const serializedValue = JSON.stringify(value);

            payload.append(
              key,
              serializedValue
            );

            if (key === 'specialization') {
              payload.append('instruments', serializedValue);
            }

            return;
          }

          if (
            value !== null &&
            value !== undefined
          ) {
            payload.append(
              key,
              String(value)
            );
          }
        }
      );

      let url = API_URL;
      let method = 'POST';

      if (editingInstructor) {
        url =
          `${API_URL}${editingInstructor.id}/`;

        method = 'PUT';
      }

      const response =
        await authenticatedFetch(url, {
          method,
          body: payload,
        });

      let responseData = {};

      try {
        responseData =
          await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        let errorMessage =
          'Unable to save instructor.';

        if (
          responseData &&
          typeof responseData ===
            'object'
        ) {
          errorMessage =
            Object.values(
              responseData
            )
              .flat()
              .join(' ') ||
            errorMessage;
        }

        throw new Error(
          errorMessage
        );
      }

      setShowModal(false);
      setEditingInstructor(null);

      setFormData({
        ...emptyForm,
        availability: {
          ...defaultAvailability,
        },
      });

      setImagePreview(null);

      await fetchInstructors();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Unable to save instructor.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDeleteInstructor =
    async (instructor) => {
      try {
        setDeletingId(
          instructor.id
        );

        setError('');

        const response =
          await authenticatedFetch(
            `${API_URL}${instructor.id}/`,
            {
              method: 'DELETE',
            }
          );

        if (
          !response.ok &&
          response.status !== 204
        ) {
          let errorData = {};

          try {
            errorData =
              await response.json();
          } catch {}

          throw new Error(
            errorData.detail ||
              'Unable to delete instructor.'
          );
        }

        setInstructors(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                instructor.id
            )
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            'Unable to delete instructor.'
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingInstructor(null);

    setFormData({
      ...emptyForm,
      availability: {
        ...defaultAvailability,
      },
    });

    setImagePreview(null);
  };

  /* =======================================================
     DAY TIMELINE
  ======================================================= */

  const renderDayTimeline = () => {
    const timelineDate =
      calendarDate;

    const totalHours =
      TIMELINE_END -
      TIMELINE_START;

    const timelineWidth =
      totalHours *
      HOUR_WIDTH;

    return (
      <div className="timeline-container">

        {/* TIME HEADER */}

        <div className="timeline-header">

          <div
            className="timeline-resource-header"
          >
            Instructor
          </div>

          <div
            className="timeline-hours"
            style={{
              width: timelineWidth,
            }}
          >

            {Array.from(
              {
                length: totalHours,
              },
              (_, index) => {

                const hour =
                  TIMELINE_START +
                  index;

                const date =
                  new Date();

                date.setHours(
                  hour,
                  0,
                  0,
                  0
                );

                return (
                  <div
                    key={hour}
                    className="timeline-hour"
                    style={{
                      width:
                        HOUR_WIDTH,
                    }}
                  >
                    {date.toLocaleTimeString(
                      'en-US',
                      {
                        hour: 'numeric',
                        minute: '2-digit',
                      }
                    )}
                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* RESOURCE ROWS */}

        {visibleInstructors.length ===
        0 ? (

          <div className="timeline-empty">
            No instructors found.
          </div>

        ) : (

          visibleInstructors.map(
            (instructor) => {

              const slots =
                getAvailabilitySlots(
                  instructor,
                  timelineDate
                );

              return (
                <div
                  className="timeline-row"
                  key={instructor.id}
                >

                  {/* INSTRUCTOR */}

                  <div className="timeline-resource">

                    <div className="resource-avatar">

                      {getInitials(
                        instructor.instructor_name
                      )}

                    </div>

                    <div className="resource-info">

                      <strong>
                        {instructor.instructor_name ||
                          'Unnamed Instructor'}
                      </strong>

                      <span>
                        {formatSpecialization(instructor.specialization)}
                      </span>

                    </div>

                  </div>


                  {/* HOURS */}

                  <div
                    className="timeline-track"
                    style={{
                      width:
                        timelineWidth,
                    }}
                  >

                    {Array.from(
                      {
                        length:
                          totalHours,
                      },
                      (_, index) => (
                        <div
                          key={index}
                          className="timeline-grid-line"
                          style={{
                            left:
                              index *
                              HOUR_WIDTH,
                          }}
                        />
                      )
                    )}


                    {/* CURRENT TIME */}

                    {isSameDate(
                      timelineDate,
                      new Date()
                    ) && (
                      <div
                        className="current-time-line"
                        style={{
                          left:
                            ((new Date().getHours() +
                              new Date().getMinutes() /
                                60 -
                              TIMELINE_START) *
                              HOUR_WIDTH),
                        }}
                      />
                    )}


                    {/* AVAILABILITY */}

                    {slots.map(
                      (
                        slot,
                        index
                      ) => {

                        const parsed =
                          parseSlot(
                            slot
                          );

                        if (
                          !parsed
                        ) {
                          return null;
                        }

                        const startMinutes =
                          minutesFromStart(
                            parsed.start
                          );

                        const endMinutes =
                          minutesFromStart(
                            parsed.end
                          );

                        const left =
                          Math.max(
                            0,
                            (startMinutes /
                              60) *
                              HOUR_WIDTH
                          );

                        const width =
                          Math.max(
                            50,
                            ((endMinutes -
                              startMinutes) /
                              60) *
                              HOUR_WIDTH
                          );

                        return (
                          <div
                            key={`${instructor.id}-${index}`}
                            className="availability-block"
                            style={{
                              left,
                              width,
                            }}
                            title={`${instructor.instructor_name} • ${formatTimeRange(
                              slot
                            )}`}
                          >

                            <strong>
                              {instructor.instructor_name}
                            </strong>

                            <span>
                              {formatTimeRange(
                                slot
                              )}
                            </span>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              );
            }
          )

        )}

      </div>
    );
  };

  /* =======================================================
     WEEK TIMELINE
  ======================================================= */

  const renderWeekTimeline = () => {
    return (
      <div className="week-timeline">

        {/* HEADER */}

        <div className="week-header">

          <div className="week-resource-header">
            Instructor
          </div>

          {weekDates.map(
            (date) => {

              const today =
                isSameDate(
                  date,
                  new Date()
                );

              return (
                <div
                  key={date.toISOString()}
                  className={`week-date-header ${
                    today
                      ? 'today-header'
                      : ''
                  }`}
                >

                  <span>
                    {
                      DAY_LABELS[
                        date.getDay()
                      ]
                    }
                  </span>

                  <strong>
                    {date.getDate()}
                  </strong>

                  <small>
                    {MONTH_LABELS[
                      date.getMonth()
                    ].slice(0, 3)}
                  </small>

                </div>
              );
            }
          )}

        </div>


        {/* ROWS */}

        {visibleInstructors.length ===
        0 ? (

          <div className="timeline-empty">
            No instructors found.
          </div>

        ) : (

          visibleInstructors.map(
            (instructor) => (

              <div
                className="week-resource-row"
                key={instructor.id}
              >

                <div className="week-resource">

                  <div className="resource-avatar">
                    {getInitials(
                      instructor.instructor_name
                    )}
                  </div>

                  <div className="resource-info">
                    <strong>
                      {instructor.instructor_name}
                    </strong>

                    <span>
                      {formatSpecialization(instructor.specialization)}
                    </span>
                  </div>

                </div>


                {weekDates.map(
                  (date) => {

                    const slots =
                      getAvailabilitySlots(
                        instructor,
                        date
                      );

                    return (
                      <div
                        key={date.toISOString()}
                        className="week-day-cell"
                      >

                        {slots.length ===
                        0 ? (

                          <span className="week-empty">
                            —
                          </span>

                        ) : (

                          slots.map(
                            (
                              slot,
                              index
                            ) => (

                              <div
                                key={`${slot}-${index}`}
                                className="week-availability-block"
                              >

                                <strong>
                                  Available
                                </strong>

                                <span>
                                  {formatTimeRange(
                                    slot
                                  )}
                                </span>

                              </div>

                            )
                          )

                        )}

                      </div>
                    );
                  }
                )}

              </div>

            )
          )

        )}

      </div>
    );
  };

  /* =======================================================
     MONTH TIMELINE
  ======================================================= */

  const renderMonthTimeline = () => {
    return (
      <div className="month-calendar">

        <div className="month-weekdays">

          {DAY_LABELS.map(
            (day) => (
              <div
                key={day}
                className="month-weekday"
              >
                {day.slice(0, 3)}
              </div>
            )
          )}

        </div>


        <div className="month-grid">

          {monthDates.map(
            (date) => {

              const currentMonth =
                date.getMonth() ===
                calendarDate.getMonth();

              const today =
                isSameDate(
                  date,
                  new Date()
                );

              return (
                <div
                  key={date.toISOString()}
                  className={`month-cell ${
                    !currentMonth
                      ? 'outside-month'
                      : ''
                  } ${
                    today
                      ? 'month-today'
                      : ''
                  }`}
                >

                  <div className="month-cell-header">

                    <span>
                      {date.getDate()}
                    </span>

                  </div>


                  <div className="month-cell-content">

                    {visibleInstructors.map(
                      (instructor) => {

                        const slots =
                          getAvailabilitySlots(
                            instructor,
                            date
                          );

                        if (
                          slots.length ===
                          0
                        ) {
                          return null;
                        }

                        return (
                          <div
                            key={
                              instructor.id
                            }
                            className="month-instructor-slot"
                          >

                            <strong>
                              {instructor.instructor_name}
                            </strong>

                            {slots.map(
                              (
                                slot,
                                index
                              ) => (
                                <span
                                  key={
                                    `${slot}-${index}`
                                  }
                                >
                                  {formatTimeRange(
                                    slot
                                  )}
                                </span>
                              )
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="page-container instructors-page">

      <style>{`

        /* =================================================
           PAGE
        ================================================= */

        .instructors-page {
          width: 100%;
          height: auto;
          flex: 0 0 auto;
          min-height: 100%;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          padding: 10px;
        }

        .instructors-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .instructors-header h2 {
          margin: 0;
          color: #202236;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .instructors-header p {
          margin: 5px 0 0;
          color: #818496;
          font-size: 12px;
        }

        /* =================================================
           BUTTON
        ================================================= */

        .add-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          padding: 0 15px;
          border: 0;
          border-radius: 8px;
          background: #7041df;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(112, 65, 223, 0.18);
        }

        .add-button:hover {
          background: #6133d0;
        }

        /* =================================================
           TABS
        ================================================= */

        .courses-tabs {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px;
          margin-bottom: 18px;
          width: fit-content;
          border: 1px solid #e9e7ef;
          border-radius: 9px;
          background: #f8f7fa;
        }

        .course-tab {
          height: 34px;
          padding: 0 14px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #77798a;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .course-tab.active {
          background: #fff;
          color: #6237d1;
          box-shadow: 0 2px 6px rgba(30,33,54,.08);
        }

        /* =================================================
           ERROR
        ================================================= */

        .api-error {
          margin-bottom: 15px;
          padding: 11px 14px;
          border: 1px solid #f3cccc;
          border-radius: 8px;
          background: #fff5f5;
          color: #c0392b;
          font-size: 11px;
        }

        .loading-state,
        .empty-state {
          width: 100%;
          padding: 50px 20px;
          box-sizing: border-box;
          text-align: center;
          border: 1px solid #e8e6ed;
          border-radius: 12px;
          background: #fff;
          color: #858797;
          font-size: 12px;
        }

        /* =================================================
           INSTRUCTOR GRID
        ================================================= */

        .instructor-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          width: 100%;
        }

        .instructor-card {
          position: relative;
          min-height: 174px;
          padding: 13px;
          overflow: hidden;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #e9e9ee;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(30,33,54,.055);
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
        }

        .instructor-card:hover {
          transform: translateY(-1px);
          border-color: #dedee6;
          box-shadow: 0 5px 14px rgba(30,33,54,.09);
        }

        .instructor-image-section {
          position: absolute;
          top: 13px;
          left: 13px;
          width: 42px;
          height: 42px;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ede7ff;
        }

        .instructor-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .instructor-avatar {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #512a76;
          font-size: 22px;
          font-weight: 700;
        }

        .instructor-info {
          position: relative;
          padding: 0 0 28px;
          min-width: 0;
        }

        .instructor-name-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 7px;
          min-height: 43px;
          padding-left: 54px;
        }

        .instructor-name-row h3 {
          margin: 0;
          color: #171827;
          font-size: 13px;
        }

        .instructor-number {
          margin-top: 3px;
          color: #8c8d9b;
          font-size: 8px;
        }

        .instructor-status {
          position: absolute;
          left: 0;
          bottom: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 7px;
          border-radius: 20px;
          background: #e8f8ef;
          color: #12925b;
          font-size: 9px;
          font-weight: 700;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #18a76a;
        }

        .instructor-role {
          margin: 11px 0 0;
          padding-top: 9px;
          border-top: 1px solid #eeeeF2;
          color: #747687;
          font-size: 10px;
        }

        .instructor-email {
          margin: 6px 0 0;
          color: #77798a;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .instructor-experience {
          margin-top: 6px;
          color: #77798a;
          font-size: 10px;
        }

        

        .instructor-actions {
          position: absolute;
          right: 0;
          bottom: 0;
          display: flex;
          gap: 5px;
        }

        .card-action {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e8e6ee;
          border-radius: 8px;
          background: #faf9fc;
          color: #686477;
          cursor: pointer;
        }

        .card-action.delete:hover {
          background: #fff0f0;
          color: #d9534f;
        }

        /* =================================================
           AVAILABILITY TOOLBAR
        ================================================= */

        .availability-calendar {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 0;
          width: 100%;
          border: 1px solid #e3e1e8;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(30,33,54,.04);
        }

        .availability-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e3e9;
          background: #fff;
        }

        .availability-toolbar-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .availability-toolbar-right {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .calendar-nav-button {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dddbe3;
          border-radius: 6px;
          background: #fff;
          color: #565766;
          cursor: pointer;
        }

        .calendar-nav-button:hover {
          border-color: #cfc4f4;
          background: #f7f3ff;
          color: #7041df;
        }

        .calendar-today {
          height: 30px;
          padding: 0 10px;
          border: 1px solid #dddbe3;
          border-radius: 6px;
          background: #fff;
          color: #555667;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .calendar-today:hover {
          background: #f7f3ff;
          color: #7041df;
        }

        .calendar-title {
          min-width: 190px;
          margin-left: 7px;
        }

        .calendar-title strong {
          display: block;
          color: #202236;
          font-size: 12px;
        }

        .calendar-title span {
          display: block;
          margin-top: 2px;
          color: #999aa7;
          font-size: 8px;
        }

        .calendar-filter-label {
          color: #77798a;
          font-size: 9px;
          font-weight: 600;
        }

        .calendar-filter {
          height: 30px;
          min-width: 155px;
          padding: 0 9px;
          border: 1px solid #dddbe3;
          border-radius: 6px;
          background: #fff;
          color: #454756;
          outline: none;
          font-size: 9px;
        }

        .calendar-view-buttons {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px;
          border: 1px solid #e1dfe6;
          border-radius: 7px;
          background: #f8f7fa;
        }

        .calendar-view-button {
          height: 25px;
          padding: 0 8px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: #77798a;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .calendar-view-button.active {
          background: #fff;
          color: #7041df;
          box-shadow: 0 1px 4px rgba(30,33,54,.08);
        }

        /* =================================================
           DAY TIMELINE
        ================================================= */

        .timeline-container {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 100%;
          width: ${RESOURCE_WIDTH + (TIMELINE_END - TIMELINE_START) * HOUR_WIDTH}px;
          min-width: ${RESOURCE_WIDTH + (TIMELINE_END - TIMELINE_START) * HOUR_WIDTH}px;
          overflow: hidden;
        }

        .timeline-scroll {
          display: block;
          flex: 1 1 auto;
          width: 100%;
          min-height: 0;
          overflow: auto;
        }

        .timeline-header {
          display: flex;
          height: 40px;
          border-bottom: 1px solid #dedce4;
          background: #faf9fc;
        }

        .timeline-resource-header {
          width: ${RESOURCE_WIDTH}px;
          min-width: ${RESOURCE_WIDTH}px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          padding: 0 12px;
          border-right: 1px solid #dedce4;
          color: #6d6e7d;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .timeline-hours {
          position: relative;
          display: flex;
          overflow: hidden;
        }

        .timeline-hour {
          height: 40px;
          flex: 0 0 auto;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #e8e6ed;
          color: #77798a;
          font-size: 8px;
          white-space: nowrap;
        }

        .timeline-row {
          display: flex;
          flex: 1 1 0;
          min-height: 52px;
          border-bottom: 1px solid #e8e6ed;
        }

        .timeline-resource {
          width: ${RESOURCE_WIDTH}px;
          min-width: ${RESOURCE_WIDTH}px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border-right: 1px solid #dedce4;
          background: #fff;
        }

        .resource-avatar {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eee8ff;
          color: #7041df;
          font-size: 9px;
          font-weight: 700;
        }

        .resource-info {
          min-width: 0;
        }

        .resource-info strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #353646;
          font-size: 9px;
          font-weight: 700;
        }

        .resource-info span {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #999aa7;
          font-size: 7px;
        }

        .timeline-track {
          position: relative;
          flex: 0 0 auto;
          height: 100%;
          min-height: 0;
          background:
            linear-gradient(
              to bottom,
              #fff 0%,
              #fff 100%
            );
        }

        .timeline-grid-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #eeecf1;
        }

        .availability-block {
          position: absolute;
          top: 14px;
          height: 40px;
          box-sizing: border-box;
          padding: 6px 8px;
          overflow: hidden;
          border-left: 3px solid #7041df;
          border-radius: 4px;
          background: #eee8ff;
          box-shadow: 0 1px 3px rgba(80,50,140,.08);
          cursor: pointer;
        }

        .availability-block:hover {
          background: #e5dcff;
          z-index: 5;
        }

        .availability-block strong {
          display: block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #4e3588;
          font-size: 8px;
        }

        .availability-block span {
          display: block;
          margin-top: 2px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #75639a;
          font-size: 7px;
        }

        .current-time-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #d9534f;
          z-index: 4;
        }

        .current-time-line::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #d9534f;
        }

        /* =================================================
           WEEK VIEW
        ================================================= */

        .week-timeline {
          width: 100%;
          min-width: 950px;
          overflow-x: auto;
        }

        .week-header,
        .week-resource-row {
          display: grid;
          grid-template-columns:
            ${RESOURCE_WIDTH}px
            repeat(7, minmax(110px, 1fr));
        }

        .week-resource-header {
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: 55px;
          border-right: 1px solid #dedce4;
          border-bottom: 1px solid #dedce4;
          background: #faf9fc;
          color: #6d6e7d;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .week-date-header {
          height: 55px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border-right: 1px solid #e6e4ea;
          border-bottom: 1px solid #dedce4;
          background: #faf9fc;
        }

        .week-date-header span {
          color: #8a8b98;
          font-size: 8px;
          text-transform: uppercase;
        }

        .week-date-header strong {
          color: #414252;
          font-size: 14px;
        }

        .week-date-header small {
          color: #aaaab4;
          font-size: 7px;
        }

        .week-date-header.today-header {
          background: #f3edff;
        }

        .week-date-header.today-header strong,
        .week-date-header.today-header span {
          color: #7041df;
        }

        .week-resource {
          min-height: 100px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border-right: 1px solid #dedce4;
          border-bottom: 1px solid #e6e4ea;
        }

        .week-day-cell {
          min-height: 100px;
          box-sizing: border-box;
          padding: 7px;
          border-right: 1px solid #e6e4ea;
          border-bottom: 1px solid #e6e4ea;
          background: #fff;
        }

        .week-availability-block {
          margin-bottom: 5px;
          padding: 7px;
          border-left: 3px solid #7041df;
          border-radius: 4px;
          background: #eee8ff;
        }

        .week-availability-block strong {
          display: block;
          color: #51388c;
          font-size: 8px;
        }

        .week-availability-block span {
          display: block;
          margin-top: 2px;
          color: #77659a;
          font-size: 7px;
        }

        .week-empty {
          display: block;
          padding-top: 25px;
          text-align: center;
          color: #c1c1c9;
          font-size: 10px;
        }

        /* =================================================
           MONTH VIEW
        ================================================= */

        .month-calendar {
          width: 100%;
          min-width: 850px;
        }

        .month-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #dedce4;
        }

        .month-weekday {
          padding: 9px;
          text-align: center;
          background: #faf9fc;
          border-right: 1px solid #e7e5eb;
          color: #77798a;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .month-cell {
          min-height: 120px;
          padding: 7px;
          box-sizing: border-box;
          border-right: 1px solid #e7e5eb;
          border-bottom: 1px solid #e7e5eb;
          background: #fff;
        }

        .month-cell.outside-month {
          background: #fafafa;
        }

        .month-cell-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
        }

        .month-cell-header span {
          width: 23px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #666775;
          font-size: 8px;
          font-weight: 700;
        }

        .month-cell.month-today
          .month-cell-header span {
          background: #7041df;
          color: #fff;
        }

        .month-cell-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .month-instructor-slot {
          padding: 5px;
          border-left: 2px solid #7041df;
          border-radius: 3px;
          background: #eee8ff;
        }

        .month-instructor-slot strong {
          display: block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #50358b;
          font-size: 7px;
        }

        .month-instructor-slot span {
          display: block;
          margin-top: 2px;
          color: #77659a;
          font-size: 6px;
        }

        /* =================================================
           EMPTY
        ================================================= */

        .timeline-empty {
          padding: 45px;
          text-align: center;
          color: #999aa7;
          font-size: 10px;
        }

        /* =================================================
           MODAL
        ================================================= */

        .instructor-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(20,20,30,.45);
        }

        .instructor-modal {
          width: min(850px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #eeeef2;
        }

        .modal-header h3 {
          margin: 0;
          color: #202236;
          font-size: 17px;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 7px;
          background: #f6f5f8;
          color: #666;
          cursor: pointer;
        }

        .modal-form {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-group label {
          color: #555667;
          font-size: 10px;
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 10px;
          border: 1px solid #dedce5;
          border-radius: 7px;
          outline: none;
          color: #333443;
          font-size: 11px;
          background: #fff;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #7041df;
          box-shadow: 0 0 0 2px rgba(112,65,223,.08);
        }

        .instructor-category-select {
          position: relative;
        }

        .instructor-category-select.is-open {
          z-index: 30;
        }

        .instructor-category-trigger {
          width: 100%;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 10px;
          border: 1px solid #dedce5;
          border-radius: 7px;
          outline: none;
          color: #333443;
          font: inherit;
          font-size: 11px;
          text-align: left;
          background: #fff;
          cursor: pointer;
        }

        .instructor-category-trigger:hover,
        .instructor-category-select.is-open .instructor-category-trigger {
          border-color: #7041df;
          background: #fcfaff;
        }

        .instructor-category-trigger:focus-visible {
          border-color: #7041df;
          box-shadow: 0 0 0 2px rgba(112,65,223,.08);
        }

        .instructor-category-menu {
          position: absolute;
          z-index: 20;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          max-height: 190px;
          overflow-y: auto;
          padding: 5px;
          border: 1px solid #ded6f5;
          border-radius: 7px;
          background: #fff !important;
          box-shadow: 0 12px 28px rgba(35,24,73,.14);
        }

        .instructor-modal .form-group .instructor-category-option {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 9px;
          min-height: 34px;
          padding: 7px 9px;
          border-radius: 5px;
          color: #000 !important;
          font-family: inherit;
          font-size: 11px;
          font-weight: 400;
          line-height: 1.3;
          white-space: nowrap;
          cursor: pointer;
        }

        .instructor-modal .form-group .instructor-category-option:hover,
        .instructor-modal .form-group .instructor-category-option.is-selected {
          background: #f2edff !important;
          color: #000 !important;
        }

        .instructor-modal .form-group .instructor-category-option input {
          flex: 0 0 15px;
          width: 15px;
          height: 15px;
          appearance: auto;
          margin: 0;
          padding: 0;
          border: 1px solid #8c8c8c;
          border-radius: 2px;
          background: #fff;
          box-shadow: none;
          outline: none;
          accent-color: #7041df;
        }

        .instructor-modal .form-group .instructor-category-option input:focus {
          border-color: #8c8c8c;
          box-shadow: none;
          outline: none;
        }

        .instructor-modal .form-group .instructor-category-option span {
          color: inherit;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .instructor-category-empty {
          padding: 10px 9px;
          color: #8a8998;
          font-size: 11px;
        }

        .instructor-category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 7px;
        }

        .instructor-category-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eee8ff;
          color: #5b3a9b;
          font-size: 10px;
          font-weight: 600;
        }

        .instructor-category-chip button {
          padding: 0;
          border: 0;
          color: inherit;
          background: transparent;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
        }

        .instructor-image-upload {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .instructor-image-preview {
          position: relative;
          width: 96px;
          height: 96px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eadff5;
          border-radius: 12px;
          background: #faf8fc;
          color: #734de4;
          font-size: 13px;
          font-weight: 700;
        }

        .instructor-image-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .instructor-image-upload-placeholder {
          padding: 8px;
          color: #734de4;
          font-size: 11px;
          line-height: 1.25;
          text-align: center;
          cursor: pointer;
        }

        .instructor-image-remove-icon {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 22px;
          height: 22px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          cursor: pointer;
        }

        .instructor-image-remove-icon:hover {
          background: #c81e1e;
        }

        .instructor-image-remove-icon svg {
          width: 13px;
          height: 13px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .instructor-image-file-input {
          position: absolute;
          width: 1px !important;
          height: 1px;
          padding: 0 !important;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0 !important;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eeeef2;
        }

        .cancel-button,
        .save-button {
          min-width: 90px;
          height: 36px;
          padding: 0 15px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-button {
          border: 1px solid #dddbe4;
          background: #fff;
          color: #666;
        }

        .save-button {
          border: 0;
          background: #7041df;
          color: #fff;
        }

        .save-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }


        /* =================================================
           INSTRUCTOR TOOLBAR
        ================================================= */

        .instructors-toolbar {
          display: flex;
          position: sticky;
          top: -10px;
          z-index: 25;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: -10px 0 6px;
          padding: 16px 0;
          background: #f5f3f4;
          box-shadow: 0 10px 12px -16px rgba(35,31,55,.45);
        }

        .instructor-search {
          width: 325px;
          height: 36px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          box-sizing: border-box;
          border: 1px solid #e4e2e9;
          border-radius: 8px;
          background: #fff;
          color: #9999a5;
        }

        .instructor-search input {
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #333443;
          font-size: 13px;
        }

        .instructor-search input::placeholder {
          color: #aaaab4;
        }

        .instructors-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .instructor-count {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          white-space: nowrap;
          margin-right: 4px;
        }

        .instructor-count span {
          color: #77798a;
          font-size: 10px;
          font-weight: 600;
        }

        .instructor-count strong {
          color: #202236;
          font-size: 12px;
          line-height: 1;
        }

        .view-toggle {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 3px;
          border: 1px solid #e4e2e9;
          border-radius: 8px;
          background: #f8f7fa;
        }

        .view-toggle-button {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #8c8c98;
          cursor: pointer;
        }

        .view-toggle-button:hover {
          color: #7041df;
        }

        .view-toggle-button.active {
          color: #7041df;
          background: #f0ebff;
        }

        .instructor-list-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e5e3ea;
          border-radius: 10px;
          background: #fff;
        }

        .instructor-list {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .instructor-list th {
          padding: 11px 13px;
          border-bottom: 1px solid #e8e6ed;
          background: #faf9fc;
          color: #77798a;
          font-size: 9px;
          font-weight: 700;
          text-align: left;
          white-space: nowrap;
        }

        .instructor-list td {
          padding: 10px 13px;
          border-bottom: 1px solid #f0eef3;
          color: #555667;
          font-size: 10px;
          white-space: nowrap;
        }

        .instructor-list tbody tr:last-child td {
          border-bottom: 0;
        }

        .instructor-list tbody tr:hover {
          background: #fcfbff;
        }

        .list-instructor {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 190px;
        }

        .list-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          object-fit: cover;
          border-radius: 8px;
          background: #f1ebff;
        }

        .list-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6237d1;
          font-size: 10px;
          font-weight: 700;
        }

        .list-instructor strong,
        .list-instructor span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .list-instructor strong {
          max-width: 150px;
          color: #30313f;
          font-size: 10px;
          font-weight: 700;
        }

        .list-instructor span {
          max-width: 150px;
          margin-top: 3px;
          color: #9696a2;
          font-size: 8px;
        }

        .list-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 7px;
          border-radius: 20px;
          background: #f4f4f6;
          color: #77798a;
          font-size: 8px;
          font-weight: 700;
        }

        .list-status.active {
          background: #e8f8ef;
          color: #12925b;
        }

        .list-status.inactive {
          background: #f5f5f7;
          color: #77798a;
        }

        .list-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .list-availability {
          color: #d05a55;
          font-size: 9px;
          font-weight: 600;
        }

        .list-availability.available {
          color: #12925b;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1100px) {

          .availability-toolbar {
            flex-wrap: wrap;
          }

          .availability-toolbar-right {
            width: 100%;
            justify-content: flex-end;
          }

          .instructor-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 900px) {

          .instructors-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .instructor-search {
            width: 100%;
          }

          .instructors-toolbar-actions {
            justify-content: flex-end;
          }

        }

        @media (max-width: 760px) {

          .instructors-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .add-button {
            width: 100%;
          }

          .courses-tabs {
            width: 100%;
            overflow-x: auto;
          }

          .course-tab {
            white-space: nowrap;
          }

          .instructor-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full {
            grid-column: auto;
          }

          .availability-toolbar-left {
            width: 100%;
          }

          .availability-toolbar-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .calendar-title {
            min-width: auto;
          }

        }

      `}</style>


     


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="api-error">
          {error}
        </div>
      )}


      {/* =================================================
          TABS
      ================================================= */}

      {/* =================================================
          ALL INSTRUCTORS
      ================================================= */}

      {activeView ===
        'All Instructors' && (

        <>
          <div className="instructors-toolbar">

            <div className="instructor-search">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search instructors..."
              />
            </div>

            <div className="instructors-toolbar-actions">

              <div className="view-toggle">
                <button
                  type="button"
                  className={`view-toggle-button ${
                    viewMode === 'grid' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="4" y="4" width="6" height="6" rx="1" />
                    <rect x="14" y="4" width="6" height="6" rx="1" />
                    <rect x="4" y="14" width="6" height="6" rx="1" />
                    <rect x="14" y="14" width="6" height="6" rx="1" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={`view-toggle-button ${
                    viewMode === 'list' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 6h12M8 12h12M8 18h12" />
                    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
                    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
                    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                className="add-button"
                onClick={handleAddInstructor}
              >
                <PlusIcon />
                Add Instructor
              </button>

            </div>
          </div>

          {loading ? (

            <div className="loading-state">
              Loading instructors...
            </div>

          ) : filteredInstructors.length === 0 ? (

            <div className="empty-state">
              {searchTerm
                ? 'No instructors match your search.'
                : 'No instructors found.'}
            </div>

          ) : viewMode === 'list' ? (

            <div className="instructor-list-wrap">
              <table className="instructor-list">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInstructors.map((person) => {
                    const imageUrl = getImageUrl(person.profile_image);
                    const available = Object.values(
                      normalizeAvailability(person.availability)
                    ).some(
                      (slots) => Array.isArray(slots) && slots.length > 0
                    );

                    return (
                      <tr key={person.id}>
                        <td>
                          <div className="list-instructor">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={person.instructor_name || 'Instructor'}
                                className="list-avatar"
                              />
                            ) : (
                              <div className="list-avatar list-avatar-placeholder">
                                {getInitials(person.instructor_name)}
                              </div>
                            )}

                            <div>
                              <strong>
                                {person.instructor_name || 'Unnamed Instructor'}
                              </strong>
                              <span>{person.email || '-'}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {formatSpecialization(person.specialization) !== 'Music Instructor'
                            ? formatSpecialization(person.specialization)
                            : person.qualification || 'Music Instructor'}
                        </td>

                        <td>
                          {person.experience_years || 0} years
                        </td>

                        <td>{person.branch_name || '-'}</td>

                        <td>
                          <span
                            className={`list-status ${
                              person.status === 'active'
                                ? 'active'
                                : person.status === 'inactive'
                                ? 'inactive'
                                : ''
                            }`}
                          >
                            <span className="status-dot"></span>
                            {formatStatus(person.status)}
                          </span>
                        </td>

                       

                        <td>
                          <div className="list-actions">
                            <button
                              type="button"
                              className="card-action"
                              onClick={() => handleEditInstructor(person)}
                              title="Edit instructor"
                            >
                              <EditIcon />
                            </button>

                            <button
                              type="button"
                              className="card-action delete"
                              disabled={deletingId === person.id}
                              onClick={() => setInstructorToDelete(person)}
                              title="Delete instructor"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          ) : (

            <div className="instructor-grid">
              {filteredInstructors.map((person) => {
                const imageUrl = getImageUrl(person.profile_image);

                return (
                  <article
                    key={person.id}
                    className="instructor-card"
                  >
                    <div className="instructor-image-section">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={person.instructor_name || 'Instructor'}
                          className="instructor-image"
                        />
                      ) : (
                        <div className="instructor-avatar">
                          {getInitials(person.instructor_name)}
                        </div>
                      )}
                    </div>

                    <div className="instructor-info">
                      <div className="instructor-name-row">
                        <div>
                          <h3>
                            {person.instructor_name ||
                              'Unnamed Instructor'}
                          </h3>

                          <div className="instructor-number">
                            {person.instructor_number}
                          </div>
                        </div>

                        <span className="instructor-status">
                          <span className="status-dot"></span>
                          {formatStatus(person.status)}
                        </span>
                      </div>

                      <p className="instructor-role">
                        {formatSpecialization(person.specialization) !== 'Music Instructor'
                          ? formatSpecialization(person.specialization)
                          : person.qualification || 'Music Instructor'}
                      </p>

                      <p className="instructor-email">
                        {person.email}
                      </p>

                      <div className="instructor-experience">
                        <strong>{person.experience_years || 0}</strong>{' '}
                        years experience
                      </div>

                     

                      <div className="instructor-actions">
                        <button
                          type="button"
                          className="card-action"
                          onClick={() => handleEditInstructor(person)}
                          title="Edit instructor"
                        >
                          <EditIcon />
                        </button>

                        <button
                          type="button"
                          className="card-action delete"
                          disabled={deletingId === person.id}
                          onClick={() => setInstructorToDelete(person)}
                          title="Delete instructor"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =================================================
          AVAILABILITY TIMELINE
      ================================================= */}

      {activeView ===
        'Availability' && (

        loading ? (

          <div className="loading-state">
            Loading availability...
          </div>

        ) : (

          <div className="availability-calendar">

            {/* TOOLBAR */}

            <div className="availability-toolbar">

              <div className="availability-toolbar-left">

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={
                    goPrevious
                  }
                  title="Previous"
                >
                  <ChevronLeftIcon />
                </button>

                <button
                  type="button"
                  className="calendar-today"
                  onClick={
                    goToday
                  }
                >
                  TODAY
                </button>

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={
                    goNext
                  }
                  title="Next"
                >
                  <ChevronRightIcon />
                </button>

                <div className="calendar-title">

                  <strong>
                    {getCalendarTitle()}
                  </strong>

                  <span>
                    Instructor availability
                  </span>

                </div>

              </div>


              <div className="availability-toolbar-right">

                <span className="calendar-filter-label">
                  Instructor
                </span>

                <select
                  className="calendar-filter"
                  value={
                    selectedInstructorId
                  }
                  onChange={(event) =>
                    setSelectedInstructorId(
                      event.target.value
                    )
                  }
                >

                  <option value="all">
                    All Instructors
                  </option>

                  {instructors.map(
                    (instructor) => (
                      <option
                        key={
                          instructor.id
                        }
                        value={
                          instructor.id
                        }
                      >
                        {
                          instructor.instructor_name
                        }
                      </option>
                    )
                  )}

                </select>


                <div className="calendar-view-buttons">

                  <button
                    type="button"
                    className={`calendar-view-button ${
                      calendarView ===
                      'day'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setCalendarView(
                        'day'
                      )
                    }
                  >
                    TIMELINE DAY
                  </button>

                  <button
                    type="button"
                    className={`calendar-view-button ${
                      calendarView ===
                      'week'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setCalendarView(
                        'week'
                      )
                    }
                  >
                    TIMELINE WEEK
                  </button>

                  <button
                    type="button"
                    className={`calendar-view-button ${
                      calendarView ===
                      'month'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setCalendarView(
                        'month'
                      )
                    }
                  >
                    TIMELINE MONTH
                  </button>

                </div>

              </div>

            </div>


            {/* CALENDAR CONTENT */}

            <div className="timeline-scroll">
              {calendarView ===
                'day' &&
                renderDayTimeline()}

              {calendarView ===
                'week' &&
                renderWeekTimeline()}

              {calendarView ===
                'month' &&
                renderMonthTimeline()}
            </div>

          </div>

        )
      )}


      {/* =================================================
          INSTRUCTOR SCHEDULE
      ================================================= */}

      {activeView ===
        'Instructor Schedule' && (

        <div className="availability-calendar">

          <div className="schedule-table-wrap">

            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      background:
                        '#faf9fc',
                      fontSize: '10px',
                      color:
                        '#77798a',
                    }}
                  >
                    Instructor
                  </th>

                  <th
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      background:
                        '#faf9fc',
                      fontSize: '10px',
                      color:
                        '#77798a',
                    }}
                  >
                    Specialization
                  </th>

                  <th
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      background:
                        '#faf9fc',
                      fontSize: '10px',
                      color:
                        '#77798a',
                    }}
                  >
                    Branch
                  </th>

                  <th
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      background:
                        '#faf9fc',
                      fontSize: '10px',
                      color:
                        '#77798a',
                    }}
                  >
                    Employment
                  </th>

                  <th
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      background:
                        '#faf9fc',
                      fontSize: '10px',
                      color:
                        '#77798a',
                    }}
                  >
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {instructors.map(
                  (person) => (

                    <tr
                      key={
                        person.id
                      }
                    >

                      <td
                        style={{
                          padding:
                            '13px 16px',
                          borderBottom:
                            '1px solid #f0eef3',
                          fontSize:
                            '11px',
                        }}
                      >
                        {
                          person.instructor_name
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            '13px 16px',
                          borderBottom:
                            '1px solid #f0eef3',
                          fontSize:
                            '11px',
                        }}
                      >
                        {formatSpecialization(person.specialization) !== 'Music Instructor'
                          ? formatSpecialization(person.specialization)
                          : person.qualification || 'Music Instructor'}
                      </td>

                      <td
                        style={{
                          padding:
                            '13px 16px',
                          borderBottom:
                            '1px solid #f0eef3',
                          fontSize:
                            '11px',
                        }}
                      >
                        {
                          person.branch_name ||
                          '-'
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            '13px 16px',
                          borderBottom:
                            '1px solid #f0eef3',
                          fontSize:
                            '11px',
                        }}
                      >
                        {formatStatus(
                          person.employment_type
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            '13px 16px',
                          borderBottom:
                            '1px solid #f0eef3',
                          fontSize:
                            '11px',
                        }}
                      >
                        {formatStatus(
                          person.status
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div
          className="instructor-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="instructor-modal">

            <div className="modal-header">

              <h3>
                {editingInstructor
                  ? 'Edit Instructor'
                  : 'Add Instructor'}
              </h3>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                <CloseIcon />
              </button>

            </div>


            <form
              className="modal-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Instructor Name *
                  </label>

                  <input
                    type="text"
                    value={
                      formData.instructor_name
                    }
                    onChange={(event) =>
                      updateField(
                        'instructor_name',
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={(event) =>
                      updateField(
                        'email',
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Phone *
                  </label>

                  <input
                    type="text"
                    value={
                      formData.phone
                    }
                    onChange={(event) =>
                      updateField(
                        'phone',
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={
                      formData.date_of_birth
                    }
                    onChange={(event) =>
                      updateField(
                        'date_of_birth',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Gender
                  </label>

                  <select
                    value={
                      formData.gender
                    }
                    onChange={(event) =>
                      updateField(
                        'gender',
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select Gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Specialization
                  </label>

                  <div
                    ref={specializationSelectRef}
                    className={`instructor-category-select ${showSpecializationDropdown ? 'is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="instructor-category-trigger"
                      onClick={() => setShowSpecializationDropdown((prev) => !prev)}
                      aria-expanded={showSpecializationDropdown}
                      aria-haspopup="listbox"
                    >
                      <span>
                        {(Array.isArray(formData.specialization) ? formData.specialization : []).length === 0
                          ? 'Select one or more specializations'
                          : `${formData.specialization.length} specialization${formData.specialization.length === 1 ? '' : 's'} selected`}
                      </span>
                    </button>

                    {showSpecializationDropdown && (
                      <div className="instructor-category-menu" role="listbox" aria-label="Instructor specializations">
                        {specializationOptions.length === 0 ? (
                          <div className="instructor-category-empty">
                            No specializations available
                          </div>
                        ) : (
                          specializationOptions.map((category) => {
                            const categoryName = category.name || category.category_name || category.title || `Category ${category.id}`;
                            const selectedSpecializations = Array.isArray(formData.specialization) ? formData.specialization : [];
                            const isSelected = selectedSpecializations.includes(categoryName);

                            return (
                              <label
                                key={category.id}
                                className={`instructor-category-option ${isSelected ? 'is-selected' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSpecialization(categoryName)}
                                />
                                <span>{categoryName}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {Array.isArray(formData.specialization) && formData.specialization.length > 0 && (
                    <div className="instructor-category-chips">
                      {formData.specialization.map((specialization) => {
                        return (
                          <span key={specialization} className="instructor-category-chip">
                            {specialization}
                            <button
                              type="button"
                              onClick={() => toggleSpecialization(specialization)}
                              aria-label={`Remove ${specialization}`}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                </div>


                <div className="form-group">

                  <label>
                    Qualification
                  </label>

                  <input
                    type="text"
                    value={
                      formData.qualification
                    }
                    onChange={(event) =>
                      updateField(
                        'qualification',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Experience (Years)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      formData.experience_years
                    }
                    onChange={(event) =>
                      updateField(
                        'experience_years',
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Emergency Contact Name
                  </label>

                  <input
                    type="text"
                    value={
                      formData.emergency_contact_name
                    }
                    onChange={(event) =>
                      updateField(
                        'emergency_contact_name',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Emergency Contact Phone
                  </label>

                  <input
                    type="text"
                    value={
                      formData.emergency_contact_phone
                    }
                    onChange={(event) =>
                      updateField(
                        'emergency_contact_phone',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Joining Date
                  </label>

                  <input
                    type="date"
                    value={
                      formData.joining_date
                    }
                    onChange={(event) =>
                      updateField(
                        'joining_date',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Employment Type
                  </label>

                  <select
                    value={
                      formData.employment_type
                    }
                    onChange={(event) =>
                      updateField(
                        'employment_type',
                        event.target.value
                      )
                    }
                  >

                    <option value="full_time">
                      Full Time
                    </option>

                    <option value="part_time">
                      Part Time
                    </option>

                    <option value="contract">
                      Contract
                    </option>

                    <option value="visiting">
                      Visiting
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      formData.status
                    }
                    onChange={(event) =>
                      updateField(
                        'status',
                        event.target.value
                      )
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="on_leave">
                      On Leave
                    </option>

                  </select>

                </div>


                <div className="form-group full">

                  <label>
                    Profile Image
                  </label>

                  <div className="instructor-image-upload">

                    <div className="instructor-image-preview">

                      {imagePreview ? (

                        <>
                          <img
                            src={
                              imagePreview
                            }
                            alt="Preview"
                          />
                          <button
                            type="button"
                            className="instructor-image-remove-icon"
                            onClick={removeImage}
                            aria-label="Remove image"
                            title="Remove image"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13" />
                            </svg>
                          </button>
                        </>

                      ) : (

                        <label htmlFor="instructor-profile-image" className="instructor-image-upload-placeholder">
                          Upload image
                        </label>

                      )}

                    </div>

                    <input
                      ref={imageInputRef}
                      id="instructor-profile-image"
                      className="instructor-image-file-input"
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageChange
                      }
                    />

                  </div>

                </div>


                <div className="form-group full">

                  <label>
                    Address
                  </label>

                  <textarea
                    value={
                      formData.address
                    }
                    onChange={(event) =>
                      updateField(
                        'address',
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group full">

                  <label>
                    Bio
                  </label>

                  <textarea
                    value={
                      formData.bio
                    }
                    onChange={(event) =>
                      updateField(
                        'bio',
                        event.target.value
                      )
                    }
                  />

                </div>


                {/* AVAILABILITY */}

                <div className="form-group full">

                  <label>
                    Availability
                  </label>

                  <div
                    className="form-grid"
                    style={{
                      marginTop: '4px',
                    }}
                  >

                    {Object.keys(
                      defaultAvailability
                    ).map(
                      (day) => (

                        <div
                          className="form-group"
                          key={day}
                        >

                          <label>
                            {day
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                              day.slice(
                                1
                              )}
                          </label>

                          <input
                            type="text"
                            placeholder="09:00-13:00, 15:00-18:00"
                            value={
                              Array.isArray(
                                formData
                                  .availability[
                                  day
                                ]
                              )
                                ? formData.availability[
                                    day
                                  ].join(
                                    ', '
                                  )
                                : ''
                            }
                            onChange={(
                              event
                            ) =>
                              updateAvailability(
                                day,
                                event
                                  .target
                                  .value
                              )
                            }
                          />

                        </div>

                      )
                    )}

                  </div>

                </div>


                <div className="form-group full">

                  <label>
                    Notes
                  </label>

                  <textarea
                    value={
                      formData.notes
                    }
                    onChange={(event) =>
                      updateField(
                        'notes',
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingInstructor
                    ? 'Update Instructor'
                    : 'Add Instructor'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      <ConfirmDialog
        open={Boolean(instructorToDelete)}
        title="Delete instructor?"
        message={instructorToDelete ? `Are you sure you want to delete ${instructorToDelete.instructor_name}?` : ''}
        confirmLabel="Delete"
        busy={Boolean(deletingId)}
        onCancel={() => setInstructorToDelete(null)}
        onConfirm={async () => {
          await handleDeleteInstructor(instructorToDelete);
          setInstructorToDelete(null);
        }}
      />
    </div>
  );
};

export default InstructorsPage;
