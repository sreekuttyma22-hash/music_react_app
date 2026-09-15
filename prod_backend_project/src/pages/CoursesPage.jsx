import React, { useEffect, useMemo, useState } from 'react';
import API_CONFIG from '../apiConfig';
import {
  api,
  apiRequest,
  createCourse,
  deleteCourse,
  getCourses,
  getCourseStats,
  getInstructors,
  getStudents,
  updateCourse,
  updateStudent,
} from '../apiClient';
import './CoursesPage.css';



const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', badgeClass: 'beginner' },
  { value: 'intermediate', label: 'Intermediate', badgeClass: 'intermediate' },
  { value: 'advanced', label: 'Advanced', badgeClass: 'advanced' },
];

const PACKAGE_OPTIONS = [
  { value: '2_lessons', label: '2 Lessons', lessons: 2 },
  { value: '4_lessons', label: '4 Lessons', lessons: 4 },
  { value: '6_lessons', label: '6 Lessons', lessons: 6 },
  { value: '8_lessons', label: '8 Lessons', lessons: 8 },
];

const formatCurrency = (val, currency = '₹') => {
  if (val === null || val === undefined || val === '') return `${currency} 0`;
  const num = Number(val);
  if (Number.isNaN(num)) return `${currency} ${val}`;
  return `${currency} ${num.toLocaleString('en-IN')}`;
};

const formatEnrollmentAmount = (value) =>
  `OMR ${Number(value || 0).toFixed(3)}`;



const createDefaultPricingCombinations = (
  levels = ['beginner', 'intermediate'],
  modes = ['online', 'institute'],
  lessonDurations = ['30_min', '45_min', '60_min'],
  packages = ['2_lessons', '4_lessons', '6_lessons'],
  base30MinPerLesson = 750,
  modeOptions = [],
  lessonDurationOptions = [],
  packageOptions = PACKAGE_OPTIONS
) => {
  const combinations = [];

  levels.forEach((lvl) => {
    let lvlMultiplier = 1.0;
    if (lvl === 'intermediate') lvlMultiplier = 1.25;
    if (lvl === 'advanced') lvlMultiplier = 1.5;

    modes.forEach((mode) => {
      const modeConfig = modeOptions.find((item) => item.code === mode || item.value === mode);
      const modeMultiplier = 1.0;

      lessonDurations.forEach((durKey) => {
        const durConfig = lessonDurationOptions.find((d) => d.value === durKey) || {
          multiplier: 1.0,
          minutes: Number(String(durKey).replace('_min', '')) || 30,
        };
        const durationMultiplier = durConfig.multiplier || (durConfig.minutes === 45 ? 1.4 : durConfig.minutes === 60 ? 1.8 : durConfig.minutes === 90 ? 2.5 : 1.0);
        const additionalFee = Number(modeConfig?.additional_fee || 0);

        const perLessonRate = Math.round((base30MinPerLesson * lvlMultiplier * modeMultiplier * durationMultiplier) + additionalFee);

        packages.forEach((pkgKey) => {
          const pkgConfig = packageOptions.find((p) => p.value === pkgKey) || {
            lessons: 2,
          };

          const totalBaseAmount = perLessonRate * pkgConfig.lessons;
          const discountAmount = 0;
          const finalAmount = totalBaseAmount;

          combinations.push({
            level: lvl,
            mode,
            lesson_duration: durKey,
            package: pkgKey,
            per_lesson_price: perLessonRate,
            price: finalAmount,
            base_price: totalBaseAmount,
            discount: 0,
            currency: '₹',
          });
        });
      });
    });
  });

  return combinations;
};

const createEmptyCourseForm = (modeOptions = [], lessonDurationOptions = [], packageOptions = PACKAGE_OPTIONS) => ({
  course_name: '',
  category: '',
  description: '',
  branch_name: 'Main Campus',
  status: 'active',
  instructors: [],
  selected_levels: ['beginner', 'intermediate'],
  selected_modes: modeOptions.length ? modeOptions.map((item) => item.code) : [],
  selected_lesson_durations: lessonDurationOptions.length ? lessonDurationOptions.map((item) => `${item.minutes}_min`) : [],
  selected_packages: ['2_lessons', '4_lessons', '6_lessons'],
  combination_pricing: createDefaultPricingCombinations(
    ['beginner', 'intermediate'],
    modeOptions.length ? modeOptions.map((item) => item.code) : [],
    lessonDurationOptions.length ? lessonDurationOptions.map((item) => `${item.minutes}_min`) : [],
    packageOptions.map((item) => item.value),
    750,
    modeOptions,
    lessonDurationOptions,
    packageOptions
  ),
  image: null,
  imagePreview: '',
});



export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lessonModes, setLessonModes] = useState([]);
  const [lessonDurations, setLessonDurations] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [packageOptions, setPackageOptions] = useState(PACKAGE_OPTIONS);
  const [newPackageLessons, setNewPackageLessons] = useState('');
  const [packageError, setPackageError] = useState('');
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    total_courses: 0,
    active_courses: 0,
    total_enrollments: 0,
    total_revenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(createEmptyCourseForm());
  const [basePriceAutofill, setBasePriceAutofill] = useState(750);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [registrationFee, setRegistrationFee] = useState('10');
  const [enrollForm, setEnrollForm] = useState({
    studentId: '',
    customStudentName: '',
    level: 'beginner',
    mode: 'institute',
    lessonDuration: '45_min',
    packageDuration: '2_lessons',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructorId: '',
    paymentMethod: 'card',
    notes: '',
  });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const getEnrollmentStudentId = (enrollment) => {
    if (!enrollment) return null;
    if (typeof enrollment.student === 'object' && enrollment.student !== null) {
      return enrollment.student.id;
    }
    return enrollment.studentRecordId || enrollment.student_details?.id || enrollment.student;
  };

  const getEnrollmentCourseId = (enrollment) => {
    if (!enrollment) return null;
    if (typeof enrollment.course === 'object' && enrollment.course !== null) {
      return enrollment.course.id;
    }
    return enrollment.course_details?.id || enrollment.course;
  };

  const getCourseEnrollmentCount = (course) => {
    if (!course) return 0;

    const courseId = course.id;
    const courseNumber = course.course_number;
    const courseName = (course.course_name || course.name || '').trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      if (enrollment.status === 'cancelled') return false;

      const enrollmentCourseId = getEnrollmentCourseId(enrollment);
      const enrollmentCourseNumber = enrollment.course_details?.course_number || enrollment.courseNumber;
      const enrollmentCourseName = (
        enrollment.course_details?.course_name ||
        enrollment.course_details?.name ||
        enrollment.course_name ||
        (typeof enrollment.course === 'string' ? enrollment.course : '')
      ).trim().toLowerCase();

      return (
        (courseId && enrollmentCourseId && String(courseId) === String(enrollmentCourseId)) ||
        (courseNumber && enrollmentCourseNumber && String(courseNumber) === String(enrollmentCourseNumber)) ||
        (courseName && enrollmentCourseName && courseName === enrollmentCourseName)
      );
    }).length;
  };

  const isStudentEnrolledInCourse = (studentId, course) => {
    if (!studentId || !course) return false;

    const targetCourseId = typeof course === 'object' ? course.id : course;
    const targetCourseNumber = typeof course === 'object' ? course.course_number : null;
    const targetCourseName = typeof course === 'object' ? (course.course_name || course.name)?.trim().toLowerCase() : null;

    const targetStudent = students.find((s) => String(s.id) === String(studentId));
    const targetStudentNumber = targetStudent?.studentId || targetStudent?.student_number;
    const targetStudentName = targetStudent?.name?.trim().toLowerCase();

    return enrollments.some((enrollment) => {
      if (enrollment.status === 'cancelled') return false;

      // 1. Match student
      const enrollStudentId = getEnrollmentStudentId(enrollment);
      const enrollStudentNumber = enrollment.student_details?.student_number || enrollment.studentId;
      const enrollStudentName = (enrollment.student_details?.student_name || enrollment.student_details?.name || enrollment.studentName || enrollment.name)?.trim().toLowerCase();

      const studentMatches =
        (studentId && enrollStudentId && String(studentId) === String(enrollStudentId)) ||
        (targetStudentNumber && enrollStudentNumber && String(targetStudentNumber) === String(enrollStudentNumber)) ||
        (targetStudentName && enrollStudentName && targetStudentName === enrollStudentName);

      if (!studentMatches) return false;

      // 2. Match course
      const enrollCourseId = getEnrollmentCourseId(enrollment);
      const enrollCourseNumber = enrollment.course_details?.course_number || enrollment.courseNumber;
      const enrollCourseName = (enrollment.course_details?.course_name || enrollment.course_details?.name || enrollment.course_name || enrollment.course)?.trim().toLowerCase();

      const courseMatches =
        (targetCourseId && enrollCourseId && String(targetCourseId) === String(enrollCourseId)) ||
        (targetCourseNumber && enrollCourseNumber && String(targetCourseNumber) === String(enrollCourseNumber)) ||
        (targetCourseName && enrollCourseName && (targetCourseName === enrollCourseName || enrollCourseName.includes(targetCourseName) || targetCourseName.includes(enrollCourseName)));

      return Boolean(courseMatches);
    });
  };

  const isCurrentStudentAlreadyEnrolled = useMemo(() => {
    if (!enrollCourse || !enrollForm.studentId || enrollForm.studentId === 'custom') return false;
    return isStudentEnrolledInCourse(enrollForm.studentId, enrollCourse);
  }, [enrollCourse, enrollForm.studentId, enrollments, students]);

  // This is only for the UI. The backend still decides the final fee.
  const registrationFeeAlreadyPaid = useMemo(() => {
    if (!enrollForm.studentId) return false;

    return enrollments.some((enrollment) => {
      if (enrollment.status === 'cancelled') return false;
      const enrollStudentId = getEnrollmentStudentId(enrollment);
      const fee = Number(enrollment.registration_fee);
      return String(enrollStudentId) === String(enrollForm.studentId) && fee > 0;
    });
  }, [enrollments, enrollForm.studentId]);

  const payableRegistrationFee = registrationFeeAlreadyPaid
    ? 0
    : Number(registrationFee) || 0;

  useEffect(() => {
    if (showEnrollModal) {
      setRegistrationFee(registrationFeeAlreadyPaid ? '0' : '10');
    }
  }, [showEnrollModal, registrationFeeAlreadyPaid]);

  

  useEffect(() => {
    console.log('[CoursesPage] LOOKUP STATE: lessonModes changed:', lessonModes);
    console.log('[CoursesPage] LOOKUP STATE: lessonModes count:', lessonModes.length);
    console.log('[CoursesPage] LOOKUP STATE: lesson mode codes:', lessonModes.map((mode) => mode?.code));
    console.log('[CoursesPage] LOOKUP STATE: lessonDurations changed:', lessonDurations);
    console.log('[CoursesPage] LOOKUP STATE: lessonDurations count:', lessonDurations.length);
    console.log('[CoursesPage] LOOKUP STATE: duration minutes:', lessonDurations.map((duration) => duration?.minutes));

    console.log('[CoursesPage] CATEGORY STATE: categories changed:', categories);
    console.log('[CoursesPage] CATEGORY STATE: categories count:', categories.length);
    console.log(
      '[CoursesPage] CATEGORY STATE: category names:',
      categories.map((category) => category?.name)
    );
  }, [categories]);

  const getModeOption = (code) => {
    return lessonModes.find((mode) => mode.code === code) || null;
  };

  const getModeLabel = (code) => {
    const mode = getModeOption(code);
    if (mode) return mode.name;
    if (code === 'offline') return 'Offline / Institute';
    return code || 'Unknown';
  };

  const getModeIcon = (code) => {
    if (code === 'online') return '🌐';
    if (code === 'home_visit') return '🏠';
    return '🏫';
  };

  const getDurationOption = (value) => {
    return lessonDurations.find((duration) => `${duration.minutes}_min` === value || duration.value === value) || null;
  };

  const getDurationLabel = (value) => {
    const duration = getDurationOption(value);
    return duration ? `${duration.minutes} Minutes` : value || 'Unknown';
  };

  const getDurationIcon = (value) => {
    const minutes = Number(String(value).replace('_min', ''));
    if (minutes === 30) return '⚡';
    if (minutes === 45) return '⏱️';
    if (minutes === 60) return '⌛';
    if (minutes === 90) return '🎯';
    return '⏱️';
  };

  const fetchLookupOptions = async () => {
    console.log('[CoursesPage][Lookup APIs] STEP 1: Starting lesson modes and durations API requests');
    console.log('[CoursesPage][Lookup APIs] STEP 2: Mode endpoint:', API_CONFIG.ENDPOINTS.LESSON_MODES);
    console.log('[CoursesPage][Lookup APIs] STEP 3: Duration endpoint:', API_CONFIG.ENDPOINTS.LESSON_DURATIONS);
    console.log('[CoursesPage][Lookup APIs] STEP 4: BASE_URL:', API_CONFIG.BASE_URL);

    const [modeData, durationData] = await Promise.all([
      apiRequest(API_CONFIG.ENDPOINTS.LESSON_MODES, { method: 'GET' }),
      apiRequest(API_CONFIG.ENDPOINTS.LESSON_DURATIONS, { method: 'GET' }),
    ]);

    console.log('[CoursesPage][Lookup APIs] STEP 5: Raw lesson modes response:', modeData);
    console.log('[CoursesPage][Lookup APIs] STEP 6: Raw lesson durations response:', durationData);
    console.log('[CoursesPage][Lookup APIs] STEP 7: Lesson modes is array:', Array.isArray(modeData));
    console.log('[CoursesPage][Lookup APIs] STEP 8: Lesson durations is array:', Array.isArray(durationData));

    const modes = (Array.isArray(modeData) ? modeData : modeData?.results || [])
      .filter((item) => item?.active !== false && item?.code)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map((item) => ({
        ...item,
        value: item.code,
        label: item.name,
        icon:
          item.code === 'online'
            ? '🌐'
            : item.code === 'home_visit'
              ? '🏠'
              : '🏫',
      }));

    const durations = (Array.isArray(durationData) ? durationData : durationData?.results || [])
      .filter((item) => item?.active !== false && Number(item?.minutes) > 0)
      .sort((a, b) => Number(a.minutes) - Number(b.minutes))
      .map((item) => ({
        ...item,
        value: `${item.minutes}_min`,
        label: `${item.minutes} Minutes`,
        icon: getDurationIcon(`${item.minutes}_min`),
        multiplier:
          Number(item.minutes) === 45
            ? 1.4
            : Number(item.minutes) === 60
              ? 1.8
              : Number(item.minutes) === 90
                ? 2.5
                : 1.0,
      }));

    console.log('[CoursesPage][Lookup APIs] STEP 9: Normalized lesson modes:', modes);
    console.log('[CoursesPage][Lookup APIs] STEP 10: Lesson mode count:', modes.length);
    console.log('[CoursesPage][Lookup APIs] STEP 11: Lesson mode codes:', modes.map((item) => item.code));
    console.log('[CoursesPage][Lookup APIs] STEP 12: Lesson mode names:', modes.map((item) => item.name));
    console.log('[CoursesPage][Lookup APIs] STEP 13: Normalized lesson durations:', durations);
    console.log('[CoursesPage][Lookup APIs] STEP 14: Lesson duration count:', durations.length);
    console.log('[CoursesPage][Lookup APIs] STEP 15: Lesson duration minutes:', durations.map((item) => item.minutes));

    setLessonModes(modes);
    setLessonDurations(durations);
    console.log('[CoursesPage][Lookup APIs] STEP 16: Lookup states updated');

    setCourseForm((prev) => {
      console.log('[CoursesPage][Lookup APIs] STEP 17: Existing course form modes:', prev.selected_modes);
      console.log('[CoursesPage][Lookup APIs] STEP 18: Existing course form durations:', prev.selected_lesson_durations);

      if (prev.selected_modes.length || prev.selected_lesson_durations.length) {
        console.log('[CoursesPage][Lookup APIs] STEP 19: Existing selections found; keeping them');
        return prev;
      }

      const defaultModes = modes.map((item) => item.code);
      const defaultDurations = durations.map((item) => item.value);

      console.log('[CoursesPage][Lookup APIs] STEP 20: Default API modes:', defaultModes);
      console.log('[CoursesPage][Lookup APIs] STEP 21: Default API durations:', defaultDurations);

      return {
        ...prev,
        selected_modes: defaultModes,
        selected_lesson_durations: defaultDurations,
        combination_pricing: createDefaultPricingCombinations(
          prev.selected_levels,
          defaultModes,
          defaultDurations,
          prev.selected_packages,
          750,
          modes,
          durations,
          packageOptions
        ),
      };
    });

    console.log('[CoursesPage][Lookup APIs] STEP 22: fetchLookupOptions completed successfully');
  };

  const fetchData = async () => {
    console.log('[CoursesPage] fetchData STEP 1: fetchData() started');
    setLoading(true);
    console.log('[CoursesPage] fetchData STEP 2: loading set to true');
    setApiError('');

    try {
      let fetchedCourses = [];
      try {
        await fetchLookupOptions();
      } catch (lookupError) {
        console.error('[CoursesPage][Lookup APIs] ERROR:', lookupError);
        setLessonModes([]);
        setLessonDurations([]);
      }
      try {
        console.log('[CoursesPage][Categories] STEP 1: Starting categories API request');
        console.log('[CoursesPage][Categories] STEP 2: Category endpoint:', API_CONFIG.ENDPOINTS.CATEGORIES || '/api/categories/');
        console.log('[CoursesPage][Categories] STEP 3: BASE_URL:', API_CONFIG.BASE_URL);

        const categoryEndpoint = API_CONFIG.ENDPOINTS.CATEGORIES || '/api/categories/';
        const data = await apiRequest(categoryEndpoint, { method: 'GET' });

        console.log('[CoursesPage][Categories] STEP 4: Raw categories response:', data);
        console.log('[CoursesPage][Categories] STEP 5: Is response an array:', Array.isArray(data));

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
              ? data.data
              : [];

        console.log('[CoursesPage][Categories] STEP 6: Normalized category list:', categoryList);
        console.log('[CoursesPage][Categories] STEP 7: Normalized category count:', categoryList.length);

        const activeCategories = categoryList
          .filter(
            (category) =>
              category &&
              category.id &&
              category.name &&
              category.active !== false
          )
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));

        console.log('[CoursesPage][Categories] STEP 8: Active categories:', activeCategories);
        console.log('[CoursesPage][Categories] STEP 9: Active category count:', activeCategories.length);
        console.log(
          '[CoursesPage][Categories] STEP 10: Category names:',
          activeCategories.map((category) => category.name)
        );

        setCategories(activeCategories);
        console.log('[CoursesPage][Categories] STEP 11: setCategories() called successfully');
      } catch (error) {
        console.error(
          '[CoursesPage][Categories] ERROR: Could not load categories:',
          error
        );
        console.error(
          '[CoursesPage][Categories] ERROR message:',
          error?.message
        );
        console.error(
          '[CoursesPage][Categories] ERROR stack:',
          error?.stack
        );

        setCategories([]);

        console.log(
          '[CoursesPage][Categories] ERROR STEP: categories reset to []'
        );
      }

      try {
        const data = await getCourses();
        if (Array.isArray(data) && data.length > 0) {
          fetchedCourses = data.map(normalizeCourseRecord);
        } else if (Array.isArray(data?.results) && data.results.length > 0) {
          fetchedCourses = data.results.map(normalizeCourseRecord);
        } else {
          fetchedCourses = [];
        }
      } catch (err) {
        console.warn('Could not load courses:', err);
        fetchedCourses = [];
      }
      setCourses(fetchedCourses);
      try {
        const instData = await getInstructors();
        const instList = Array.isArray(instData)
          ? instData
          : instData?.results || [];
        setInstructors(instList);
      } catch {
        setInstructors([]);
      }
      try {
        const stuData = await getStudents();
        setStudents(
          Array.isArray(stuData)
            ? stuData
            : Array.isArray(stuData?.results)
              ? stuData.results
              : []
        );
      } catch {
        setStudents([]);
      }
      try {
        const enrollmentData = await api.get(API_CONFIG.ENDPOINTS.ENROLLMENTS);
        const enrollList = Array.isArray(enrollmentData)
          ? enrollmentData
          : enrollmentData?.results || [];

        try {
          const enrolledStudentsData = await getEnrolledStudents();
          const enrolledList = Array.isArray(enrolledStudentsData)
            ? enrolledStudentsData
            : enrolledStudentsData?.results || [];

          const combined = [...enrollList];
          enrolledList.forEach((item) => {
            if (!combined.some((c) => String(c.id) === String(item.id))) {
              combined.push(item);
            }
          });
          setEnrollments(combined);
        } catch {
          setEnrollments(enrollList);
        }
      } catch {
        try {
          const enrolledStudentsData = await getEnrolledStudents();
          setEnrollments(
            Array.isArray(enrolledStudentsData)
              ? enrolledStudentsData
              : enrolledStudentsData?.results || []
          );
        } catch {
          setEnrollments([]);
        }
      }
      try {
        const statsData = await getCourseStats();
        if (statsData && statsData.total_courses !== undefined) {
          setStats(statsData);
        } else {
          calculateLocalStats(fetchedCourses);
        }
      } catch {
        calculateLocalStats(fetchedCourses);
      }
    } catch (err) {
      console.error('Error fetching courses data:', err);
      setApiError('Could not connect to the backend server.');
      setCourses([]);
      calculateLocalStats([]);
    } finally {
      console.log('[CoursesPage] fetchData STEP FINAL: fetchData() completed');
      console.log('[CoursesPage] fetchData FINAL categories state snapshot:', categories);
      console.log('[CoursesPage] fetchData FINAL categories count snapshot:', categories.length);
      setLoading(false);
      console.log('[CoursesPage] fetchData STEP FINAL: loading set to false');
    }
  };

  const calculateLocalStats = (courseList) => {
    const total_courses = courseList.length;
    const active_courses = courseList.filter((c) => c.status === 'active').length;
    const total_enrollments = courseList.reduce(
      (sum, c) => sum + (Number(c.enrolled_students) || 0),
      0
    );
    const total_revenue = total_enrollments * 4800;
    setStats({
      total_courses,
      active_courses,
      total_enrollments,
      total_revenue,
    });
  };

  const normalizeCourseRecord = (c) => {
    const selectedLevels =
      c.selected_levels ||
      (c.pricing && c.pricing.length > 0
        ? [...new Set(c.pricing.map((p) => p.level).filter(Boolean))]
        : [c.level || 'beginner']);

    const selectedModes =
      c.selected_modes ||
      (c.pricing && c.pricing.length > 0
        ? [...new Set(c.pricing.map((p) => p.mode?.code || (p.mode?.name === 'Offline / Institute' ? 'institute' : p.mode?.name) || 'institute'))]
        : lessonModes.length ? lessonModes.map((item) => item.code) : ['online', 'institute']);

    const selectedLessonDurations =
      c.selected_lesson_durations ||
      (c.pricing && c.pricing.length > 0
        ? [...new Set(c.pricing.map((p) => `${p.duration?.minutes || 45}_min`))]
        : lessonDurations.length ? lessonDurations.map((item) => `${item.minutes}_min`) : ['30_min', '45_min', '60_min']);

    const selectedPackages =
      c.selected_packages || c.selected_durations || ['2_lessons', '4_lessons', '6_lessons'];

    let combinationPricing = c.combination_pricing;
    if (!combinationPricing || combinationPricing.length === 0) {
      combinationPricing = createDefaultPricingCombinations(
        selectedLevels,
        selectedModes,
        selectedLessonDurations,
        selectedPackages,
        750,
        lessonModes,
        lessonDurations,
        packageOptions
      );
    }

    return {
      ...c,
      id: c.id,
      course_number: c.course_number || `CRS-${String(c.id).padStart(5, '0')}`,
      course_name: c.course_name || c.name || 'Untitled Music Course',
      category: c.category || 'Music',
      description: c.description || 'Professional music instruction tailored for all skill levels.',
      branch_name: c.branch_name || 'Main Campus',
      status: c.status || 'active',
      enrolled_students: c.enrolled_students || 0,
      instructors: c.instructors || [],
      selected_levels: selectedLevels,
      selected_modes: selectedModes,
      selected_lesson_durations: selectedLessonDurations,
      selected_packages: selectedPackages,
      combination_pricing: combinationPricing,
      image: c.image || null,
    };
  };

  useEffect(() => {
    console.log('[CoursesPage] INITIAL EFFECT: component mounted');
    console.log('[CoursesPage] INITIAL EFFECT: calling fetchData()');
    fetchData();
  }, []);

  

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter((c) => (
      !q ||
      c.course_name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    ));
  }, [courses, search]);

  

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseForm(createEmptyCourseForm(lessonModes, lessonDurations, packageOptions));
    setBasePriceAutofill(750);
    console.log('[CoursesPage] UI: opening Create Course modal'); setShowCreateModal(true);
  };

  useEffect(() => {
    const handleOpenNewCourse = () => openCreateModal();
    window.addEventListener('open-new-course', handleOpenNewCourse);
    console.log('[CoursesPage] RENDER: categories state:', categories);
  console.log('[CoursesPage] RENDER: categories count:', categories.length);
  console.log('[CoursesPage] RENDER: selected category:', courseForm.category);

  console.log('[CoursesPage] RENDER: showCreateModal:', showCreateModal);
  console.log('[CoursesPage] RENDER: categories count:', categories.length);
  console.log('[CoursesPage] RENDER: category names:', categories.map((category) => category?.name));
  console.log('[CoursesPage] RENDER: courseForm.category:', courseForm.category);

  return () => window.removeEventListener('open-new-course', handleOpenNewCourse);
  }, [packageOptions, lessonModes, lessonDurations]);

  const openEditModal = (course) => {
    setEditingCourse(course);
    setCourseForm({
      course_name: course.course_name,
      category: course.category,
      description: course.description,
      branch_name: course.branch_name || 'Main Campus',
      status: course.status || 'active',
      instructors: course.instructors.map((i) => (typeof i === 'object' ? i.id : i)),
      selected_levels: course.selected_levels || ['beginner'],
      selected_modes: course.selected_modes || lessonModes.map((item) => item.code),
      selected_lesson_durations: course.selected_lesson_durations || lessonDurations.map((item) => `${item.minutes}_min`),
      selected_packages: course.selected_packages || ['2_lessons', '4_lessons', '6_lessons'],
      combination_pricing:
        course.combination_pricing ||
        createDefaultPricingCombinations(
          course.selected_levels,
          course.selected_modes,
          course.selected_lesson_durations,
          course.selected_packages,
          750,
          lessonModes,
          lessonDurations,
          packageOptions
        ),
      image: null,
      imagePreview: typeof course.image === 'string' ? course.image : '',
    });
    console.log('[CoursesPage] UI: opening Create Course modal'); setShowCreateModal(true);
  };

  const toggleLevelSelection = (lvl) => {
    setCourseForm((prev) => {
      const exists = prev.selected_levels.includes(lvl);
      const nextLevels = exists
        ? prev.selected_levels.filter((l) => l !== lvl)
        : [...prev.selected_levels, lvl];

      if (nextLevels.length === 0) return prev;

      const nextCombinations = createDefaultPricingCombinations(
        nextLevels,
        prev.selected_modes,
        prev.selected_lesson_durations,
        prev.selected_packages,
        basePriceAutofill,
        lessonModes,
        lessonDurations,
        packageOptions
      );

      return {
        ...prev,
        selected_levels: nextLevels,
        combination_pricing: nextCombinations,
      };
    });
  };

  const toggleModeSelection = (mode) => {
    console.log('[CoursesPage] UI: toggleModeSelection called with:', mode);
    setCourseForm((prev) => {
      const exists = prev.selected_modes.includes(mode);
      const nextModes = exists
        ? prev.selected_modes.filter((m) => m !== mode)
        : [...prev.selected_modes, mode];

      if (nextModes.length === 0) return prev;

      const nextCombinations = createDefaultPricingCombinations(
        prev.selected_levels,
        nextModes,
        prev.selected_lesson_durations,
        prev.selected_packages,
        basePriceAutofill,
        lessonModes,
        lessonDurations,
        packageOptions
      );

      return {
        ...prev,
        selected_modes: nextModes,
        combination_pricing: nextCombinations,
      };
    });
  };

  const toggleLessonDurationSelection = (durKey) => {
    console.log('[CoursesPage] UI: toggleLessonDurationSelection called with:', durKey);
    setCourseForm((prev) => {
      const exists = prev.selected_lesson_durations.includes(durKey);
      const nextDurations = exists
        ? prev.selected_lesson_durations.filter((d) => d !== durKey)
        : [...prev.selected_lesson_durations, durKey];

      if (nextDurations.length === 0) return prev;

      const nextCombinations = createDefaultPricingCombinations(
        prev.selected_levels,
        prev.selected_modes,
        nextDurations,
        prev.selected_packages,
        basePriceAutofill,
        lessonModes,
        lessonDurations,
        packageOptions
      );

      return {
        ...prev,
        selected_lesson_durations: nextDurations,
        combination_pricing: nextCombinations,
      };
    });
  };

  const addPackageOption = () => {
    const lessons = Number(newPackageLessons);
    console.log('[CoursesPage] UI: addPackageOption called with:', lessons);

    if (!Number.isInteger(lessons) || lessons <= 0) {
      setPackageError('Enter a valid number of lessons.');
      return;
    }

    const value = `${lessons}_lessons`;
    const exists = packageOptions.some((pkg) => pkg.value === value);

    if (exists) {
      setPackageError(`${lessons} Lessons already exists.`);
      return;
    }

    const newOption = {
      value,
      label: `${lessons} Lessons`,
      lessons,
    };

    const nextOptions = [...packageOptions, newOption].sort(
      (a, b) => Number(a.lessons) - Number(b.lessons)
    );

    console.log('[CoursesPage] UI: adding package option:', newOption);
    setPackageOptions(nextOptions);
    setCourseForm((prev) => ({
      ...prev,
      selected_packages: prev.selected_packages.includes(value)
        ? prev.selected_packages
        : [...prev.selected_packages, value],
      combination_pricing: createDefaultPricingCombinations(
        prev.selected_levels,
        prev.selected_modes,
        prev.selected_lesson_durations,
        [...prev.selected_packages, value],
        basePriceAutofill,
        lessonModes,
        lessonDurations,
        nextOptions
      ),
    }));
    setNewPackageLessons('');
    setPackageError('');
  };

  const toggleInstructorSelection = (instructorId) => {
    console.log('[CoursesPage] UI: toggleInstructorSelection:', instructorId);
    setCourseForm((prev) => ({
      ...prev,
      instructors: prev.instructors.includes(instructorId)
        ? prev.instructors.filter((id) => id !== instructorId)
        : [...prev.instructors, instructorId],
    }));
  };

  const togglePackageSelection = (pkgKey) => {
    setCourseForm((prev) => {
      const exists = prev.selected_packages.includes(pkgKey);
      const nextPackages = exists
        ? prev.selected_packages.filter((p) => p !== pkgKey)
        : [...prev.selected_packages, pkgKey];

      if (nextPackages.length === 0) return prev;

      const nextCombinations = createDefaultPricingCombinations(
        prev.selected_levels,
        prev.selected_modes,
        prev.selected_lesson_durations,
        nextPackages,
        basePriceAutofill,
        lessonModes,
        lessonDurations,
        packageOptions
      );

      return {
        ...prev,
        selected_packages: nextPackages,
        combination_pricing: nextCombinations,
      };
    });
  };

  const updateCombinationPrice = (index, newPrice) => {
    setCourseForm((prev) => {
      const updated = [...prev.combination_pricing];
      updated[index] = {
        ...updated[index],
        price: Number(newPrice) || 0,
      };
      return { ...prev, combination_pricing: updated };
    });
  };

  const applyAutofillPricing = () => {
    const updated = createDefaultPricingCombinations(
      courseForm.selected_levels,
      courseForm.selected_modes,
      courseForm.selected_lesson_durations,
      courseForm.selected_packages,
      Number(basePriceAutofill) || 750,
      lessonModes,
      lessonDurations,
        packageOptions
    );
    setCourseForm((prev) => ({
      ...prev,
      combination_pricing: updated,
    }));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.course_name.trim()) {
      alert('Please enter a course name.');
      return;
    }

    const payload = {
      course_name: courseForm.course_name,
      category: courseForm.category,
      description: courseForm.description,
      branch_name: courseForm.branch_name,
      status: courseForm.status,
      selected_levels: courseForm.selected_levels,
      selected_modes: courseForm.selected_modes,
      selected_lesson_durations: courseForm.selected_lesson_durations,
      selected_packages: courseForm.selected_packages,
      combination_pricing: courseForm.combination_pricing,
      instructors: courseForm.instructors,
    };

    try {
      if (editingCourse) {
        try {
          await updateCourse(editingCourse.id, payload);
        } catch {
          console.warn('Backend update failed, updating local state');
        }

        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? {
                  ...c,
                  ...payload,
                  instructors: instructors.filter((i) =>
                    courseForm.instructors.includes(i.id)
                  ),
                  image: courseForm.imagePreview || c.image,
                }
              : c
          )
        );
      } else {
        const newId = Date.now();
        const newCourseObj = {
          ...payload,
          id: newId,
          course_number: `CRS-${String(newId).slice(-5)}`,
          enrolled_students: 0,
          instructors: instructors.filter((i) =>
            courseForm.instructors.includes(i.id)
          ),
          image:
            courseForm.imagePreview ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=700&auto=format&fit=crop&q=80',
        };

        try {
          await createCourse(payload);
        } catch {
          console.warn('Backend create failed, storing locally');
        }

        setCourses((prev) => [newCourseObj, ...prev]);
        setStats((prev) => ({
          ...prev,
          total_courses: prev.total_courses + 1,
          active_courses: prev.active_courses + 1,
        }));
      }

      setShowCreateModal(false);
    } catch (err) {
      alert(`Error saving course: ${err.message}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      try {
        await deleteCourse(courseToDelete.id);
      } catch {
        console.warn('Backend delete failed, removing locally');
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (err) {
      alert(`Error deleting course: ${err.message}`);
    }
  };

  

  const openEnrollmentModal = (course) => {
    setEnrollCourse(course);
    const initialLevel = course.selected_levels?.[0] || 'beginner';
    const initialMode = course.selected_modes?.[0] || lessonModes[0]?.code || 'institute';
    const initialLessonDuration = course.selected_lesson_durations?.[0] || (lessonDurations.find((item) => Number(item.minutes) === 45)?.value || lessonDurations[0]?.value || '45_min');
    const initialPackage = course.selected_packages?.[0] || '2_lessons';

    // Pick first student who is NOT yet enrolled in this course, if available
    const availableStudent = students.find((s) => !isStudentEnrolledInCourse(s.id, course));

    setEnrollForm({
      studentId: availableStudent ? availableStudent.id : (students[0]?.id || ''),
      customStudentName: '',
      level: initialLevel,
      mode: initialMode,
      lessonDuration: initialLessonDuration,
      packageDuration: initialPackage,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      instructorId: course.instructors?.[0]?.id || '',
      paymentMethod: 'card',
      notes: '',
    });
    setRegistrationFee('10');
    setShowEnrollModal(true);
  };
  const matchedFeeCalculation = useMemo(() => {
    if (!enrollCourse) return { baseFee: 0, discount: 0, finalAmount: 0, perLesson: 0 };

    const combinations = enrollCourse.combination_pricing || [];
    const matched = combinations.find(
      (c) =>
        c.level === enrollForm.level &&
        c.mode === enrollForm.mode &&
        c.lesson_duration === enrollForm.lessonDuration &&
        c.package === enrollForm.packageDuration
    );

    const durObj = getDurationOption(enrollForm.lessonDuration) || {
      minutes: Number(String(enrollForm.lessonDuration).replace('_min', '')) || 45,
      label: getDurationLabel(enrollForm.lessonDuration),
    };

    const pkgObj = packageOptions.find((p) => p.value === enrollForm.packageDuration) || {
      lessons: 2,
      label: '2 Lessons',
    };

    if (matched) {
      return {
        baseFee: matched.base_price || matched.price + (matched.discount || 0),
        discount: matched.discount || 0,
        finalAmount: matched.price,
        perLesson: matched.per_lesson_price || Math.round(matched.price / pkgObj.lessons),
        currency: matched.currency || '₹',
        lessonsCount: pkgObj.lessons,
        durationMinutes: durObj.minutes,
        durationLabel: durObj.label,
        packageLabel: pkgObj.label,
        discountPercent: 0,
      };
    }
    const durationMinutes = Number(durObj.minutes) || 30;
    const durationMultiplier = durationMinutes === 45 ? 1.4 : durationMinutes === 60 ? 1.8 : durationMinutes === 90 ? 2.5 : 1.0;
    const modeConfig = getModeOption(enrollForm.mode);
    const additionalFee = Number(modeConfig?.additional_fee || 0);
    let baseRate = Math.round((750 * durationMultiplier) + additionalFee);

    if (enrollForm.level === 'intermediate') baseRate = Math.round(baseRate * 1.25);
    if (enrollForm.level === 'advanced') baseRate = Math.round(baseRate * 1.5);

    const totalBase = baseRate * pkgObj.lessons;
    const discount = 0;
    const finalAmt = totalBase;

    return {
      baseFee: totalBase,
      discount,
      finalAmount: finalAmt,
      perLesson: baseRate,
      currency: '₹',
      lessonsCount: pkgObj.lessons,
      durationMinutes: durObj.minutes,
      durationLabel: durObj.label,
      packageLabel: pkgObj.label,
      discountPercent: 0,
    };
  }, [
    enrollCourse,
    enrollForm.level,
    enrollForm.mode,
    enrollForm.lessonDuration,
    enrollForm.packageDuration,
    lessonModes,
    lessonDurations,
    packageOptions,
  ]);

  const handleProceedToPayment = async (e) => {
    e.preventDefault();

    let selectedStudent = students.find(
      (s) => String(s.id) === String(enrollForm.studentId)
    );

    if (!selectedStudent && enrollForm.customStudentName.trim()) {
      selectedStudent = {
        id: Date.now(),
        name: enrollForm.customStudentName.trim(),
        studentId: `STU-${String(Date.now()).slice(-5)}`,
      };
    }

    if (!selectedStudent) {
      alert('Please select a student or enter student name.');
      return;
    }

    // Prevent duplicate enrollment for the same course
    if (isStudentEnrolledInCourse(selectedStudent.id, enrollCourse)) {
      alert(`Student "${selectedStudent.name}" is already enrolled in "${enrollCourse.course_name}". Duplicate enrollments for the same course are not allowed.`);
      return;
    }

    const enrollmentRef = `ENR-${String(Math.floor(10000 + Math.random() * 90000))}`;
    const courseFee = Number(matchedFeeCalculation.finalAmount) || 0;
    const enrollmentRegistrationFee = payableRegistrationFee;
    const totalAmount = courseFee + enrollmentRegistrationFee;
    const isCashAtCenter = enrollForm.paymentMethod === 'cash';
    let savedRegistrationFee = enrollmentRegistrationFee;
    let savedTotalAmount = totalAmount;

    const receipt = {
      enrollmentId: enrollmentRef,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      studentName: selectedStudent.name,
      studentId: selectedStudent.studentId,
      courseName: enrollCourse.course_name,
      category: enrollCourse.category,
      level: enrollForm.level,
      mode: enrollForm.mode,
      lessonDurationLabel: matchedFeeCalculation.durationLabel,
      packageLabel: matchedFeeCalculation.packageLabel,
      lessonsCount: matchedFeeCalculation.lessonsCount,
      perLesson: matchedFeeCalculation.perLesson,
      startDate: enrollForm.startDate,
      courseFee,
      registrationFee: enrollmentRegistrationFee,
      amount: totalAmount,
      currency: matchedFeeCalculation.currency,
      paymentMethod: enrollForm.paymentMethod,
    };
    
    try {
      try {
        const createdEnrollment = await api.post(API_CONFIG.ENDPOINTS.ENROLLMENTS, {
          student: selectedStudent.id,
          course: enrollCourse.id,
          start_date: enrollForm.startDate,
          end_date: enrollForm.endDate,
          pricing: matchedFeeCalculation.finalAmount,
          registration_fee: enrollmentRegistrationFee,
          total_amount: totalAmount,
          // The server determines the enrollment status and payment status
          // after it has successfully created the enrollment.
          payment_method: enrollForm.paymentMethod,
        });

        if (createdEnrollment) {
          // Cash at Center is the only confirmed payment method. All other
          // methods keep the student inactive with payment pending.
          await updateStudent(selectedStudent.id, {
            active: isCashAtCenter,
            payment_status: isCashAtCenter,
          });
          setEnrollments((previous) => [...previous, createdEnrollment]);
          savedRegistrationFee = Number(createdEnrollment.registration_fee) || 0;
          savedTotalAmount = Number(createdEnrollment.total_amount) || courseFee + savedRegistrationFee;
        }
      } catch (backendError) {
        console.error('Backend enrollment error:', backendError);
        const errorMsg =
          backendError?.response?.data?.message ||
          backendError?.response?.data?.detail ||
          backendError?.message ||
          'Backend enrollment failed.';
        alert(`Enrollment failed: ${errorMsg}`);
        return;
      }

      setStats((prev) => ({
        ...prev,
        total_enrollments: prev.total_enrollments + 1,
        total_revenue: prev.total_revenue + savedTotalAmount,
      }));

      setShowEnrollModal(false);
      setReceiptData({
        ...receipt,
        registrationFee: savedRegistrationFee,
        amount: savedTotalAmount,
      });
      setShowReceiptModal(true);
    } catch (err) {
      alert(`Enrollment failed: ${err.message}`);
    }
  };

  

  return (
    <div className="courses-page">
      

      <div className="course-toolbar">
        <div className="course-search">
          <svg className="course-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="text"
            className="course-search-input"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="course-toolbar-actions">
          <div className="course-view-toggle" role="group" aria-label="Change course layout">
            <button
              type="button"
              className={`course-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
              aria-label="Grid view"
              style={{
                color: '#7041df',
                background: viewMode === 'grid' ? '#f0ebff' : 'transparent',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              className={`course-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="List view"
              aria-label="List view"
              style={{
                color: '#7041df',
                background: viewMode === 'table' ? '#f0ebff' : 'transparent',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 6h12M8 12h12M8 18h12" />
                <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
                <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>

          <button type="button" className="add-course-btn" onClick={openCreateModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Course
          </button>
        </div>
      </div>

      {}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span>Loading music courses...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-state">
          <h3>No data</h3>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const pricing = course.combination_pricing || [];
            const prices = pricing.map((p) => Number(p.price) || 0).filter((p) => p > 0);
            const minPrice = prices.length ? Math.min(...prices) : 2800;

            return (
              <div className="course-card" key={course.id}>
                {}
                <div className="card-media">
                  {course.image ? (
                    <img src={course.image} alt={course.course_name} />
                  ) : (
                    <div className="card-media-fallback">
                      <span className="course-badge-text">{course.category}</span>
                    </div>
                  )}

                  <div className="card-badges-top">
                    <span className="badge-code">{course.course_number}</span>
                    <span className={`status-pill ${course.status}`}>{course.status}</span>
                  </div>
                </div>

                {}
                <div className="card-body">
                  <span className="category-tag">
                    {course.category}
                  </span>

                  {/* <h3 className="course-card-title">{course.course_name}</h3>
                  <p className="course-card-desc">{course.description}</p> */}

                  {}
                  <div className="card-feature-pills">
                    <div className="pill-row">
                      <span className="pill-row-label">Levels:</span>
                      {course.selected_levels.map((lvl) => (
                        <span key={lvl} className={`mini-chip ${lvl}`}>
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </span>
                      ))}
                    </div>

                    <div className="pill-row">
                      <span className="pill-row-label">Modes:</span>
                      {course.selected_modes.map((m) => (
                        <span key={m} className="mini-chip mode">
                          {m === 'online' ? '🌐 Online' : m === 'home_visit' ? '🏠 Home Visit' : '🏫 Offline'}
                        </span>
                      ))}
                    </div>

                    <div className="pill-row">
                      <span className="pill-row-label">Durations:</span>
                      {(course.selected_lesson_durations || ['30_min', '45_min', '60_min']).map((dur) => (
                        <span key={dur} className="mini-chip duration" style={{ background: '#fef3c7', color: '#b45309', fontWeight: '700' }}>
                          ⏱️ {dur.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="pill-row">
                      <span className="pill-row-label">Packages:</span>
                      {(course.selected_packages || ['2_lessons', '4_lessons', '6_lessons']).map((pkg) => (
                        <span key={pkg} className="mini-chip duration">
                          📦 {packageOptions.find((p) => p.value === pkg)?.label || pkg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {}
                  <div className="card-meta-row">
                    <div className="instructor-avatars-group" title={course.instructors.map((i) => i.instructor_name || i.name).join(', ')}>
                      {course.instructors.slice(0, 3).map((inst, i) => (
                        <div className="instructor-avatar-circle" key={inst.id || i}>
                          {inst.profile_image ? (
                            <img src={inst.profile_image} alt="Instructor" />
                          ) : (
                            (inst.instructor_name || inst.name || 'INS').charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {course.instructors.length > 3 && (
                        <div className="instructor-count-more">+{course.instructors.length - 3}</div>
                      )}
                      <span className="enrolled-meta" style={{ marginLeft: course.instructors.length ? '10px' : '0' }}>
                        👥 {getCourseEnrollmentCount(course)} Enrolled
                      </span>
                    </div>

                    {}
                  </div>

                  {}
                  <div className="card-actions-row">
                    <button
                      className="enroll-btn"
                      onClick={() => openEnrollmentModal(course)}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Enroll Now
                    </button>

                    <button
                      className="icon-btn"
                      title="View Course Details"
                      onClick={() => {
                        setSelectedCourseDetails(course);
                        setShowDetailsDrawer(true);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    <button
                      className="icon-btn"
                      title="Edit Course"
                      onClick={() => openEditModal(course)}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>

                    <button
                      className="icon-btn delete"
                      title="Delete Course"
                      onClick={() => {
                        setCourseToDelete(course);
                        setShowDeleteModal(true);
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Available Levels</th>
                  <th>Modes</th>
                  <th>Lesson Durations</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th>Fee Range</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => {
                  const pricing = course.combination_pricing || [];
                  const prices = pricing.map((p) => Number(p.price) || 0).filter((p) => p > 0);
                  const minPrice = prices.length ? Math.min(...prices) : 2800;
                  const maxPrice = prices.length ? Math.max(...prices) : 8000;

                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="table-course-info">
                          <div className="table-course-thumb">
                            {course.image ? (
                              <img src={course.image} alt={course.course_name} />
                            ) : (
                              <span>{course.category}</span>
                            )}
                          </div>
                          <div>
                            <div className="table-course-title">{course.course_name}</div>
                            <span className="table-course-code">{course.course_number}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-tag">
                          {course.category}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {course.selected_levels.map((lvl) => (
                            <span key={lvl} className={`mini-chip ${lvl}`}>
                              {lvl}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {course.selected_modes.map((m) => (
                            <span key={m} className="mini-chip mode">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(course.selected_lesson_durations || ['30_min', '45_min', '60_min']).map((dur) => (
                            <span key={dur} className="mini-chip duration" style={{ background: '#fef3c7', color: '#b45309' }}>
                              ⏱️ {dur.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <strong>{getCourseEnrollmentCount(course)}</strong> students
                      </td>

                      <td>
                        <span className={`status-pill ${course.status}`}>{course.status}</span>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--crs-primary)' }}>
                          {minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </strong>
                      </td>

                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="table-enroll-btn"
                            onClick={() => openEnrollmentModal(course)}
                          >
                            ⚡ Enroll
                          </button>
                          <button
                            className="icon-btn"
                            title="View"
                            onClick={() => {
                              setSelectedCourseDetails(course);
                              setShowDetailsDrawer(true);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => openEditModal(course)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn delete"
                            title="Delete"
                            onClick={() => {
                              setCourseToDelete(course);
                              setShowDeleteModal(true);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {showCreateModal && (
        <div
          className="instructor-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="instructor-modal">
            <div className="modal-header">
              <h3>{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSaveCourse}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Course Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Classical & Fingerstyle Guitar"
                    required
                    value={courseForm.course_name}
                    onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Instrument / Category *</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => {
                      setCourseForm({
                        ...courseForm,
                        category: e.target.value,
                      });
                    }}
                    required
                  >
                    <option value="">Select an instrument</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full">
                  <label>Course Description</label>
                  <textarea
                    placeholder="Describe the curriculum, goals, and syllabus for this course..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Branch / Campus</label>
                  <input
                    type="text"
                    value={courseForm.branch_name}
                    onChange={(e) => setCourseForm({ ...courseForm, branch_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Publishing Status</label>
                  <select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                  >
                    <option value="active">Active (Available for Enrollment)</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {}
                <div className="form-group full">
                  <label>Available Skill Levels *</label>
                  <div className="chips-selector">
                    {LEVEL_OPTIONS.map((lvl) => {
                      const isSelected = courseForm.selected_levels.includes(lvl.value);
                      return (
                        <label
                          key={lvl.value}
                          className={`chip-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLevelSelection(lvl.value)}
                          />
                          {lvl.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="form-group full">
                  <label>Available Teaching Modes *</label>
                  <div className="chips-selector">
                    {lessonModes.map((mode) => {
                      console.log('[CoursesPage] CREATE FORM: rendering lesson mode:', mode);
                      const modeValue = mode.code || mode.value;
                      const modeLabel = mode.name || mode.label || modeValue;
                      const isSelected = courseForm.selected_modes.includes(modeValue);
                      return (
                        <label
                          key={mode.id || modeValue}
                          className={`chip-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleModeSelection(modeValue)}
                          />
                          {mode.icon} {modeLabel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="form-group full">
                  <label>Available Lesson Durations (Session Length) *</label>
                  <div className="chips-selector">
                    {lessonDurations.map((dur) => {
                      const isSelected = courseForm.selected_lesson_durations.includes(dur.value);
                      return (
                        <label
                          key={dur.value}
                          className={`chip-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLessonDurationSelection(dur.value)}
                          />
                          {dur.icon} {dur.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="form-group full">
                  <label>Available Package Lessons *</label>
                  <div className="chips-selector">
                    {packageOptions.map((pkg) => {
                      const isSelected = courseForm.selected_packages.includes(pkg.value);
                      return (
                        <label
                          key={pkg.value}
                          className={`chip-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePackageSelection(pkg.value)}
                          />
                          📦 {pkg.label}
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newPackageLessons}
                      onChange={(e) => { setNewPackageLessons(e.target.value); setPackageError(''); }}
                      placeholder="Number of lessons"
                      className="form-control"
                      style={{ maxWidth: '190px' }}
                    />
                    <button type="button" className="save-button" onClick={addPackageOption}>
                      Add Package
                    </button>
                  </div>
                  {packageError && (
                    <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>
                      {packageError}
                    </div>
                  )}
                </div>

                {}
                <div className="form-group full">
                  <label>Assigned Instructors</label>
                  <div className={`multi-select-dropdown ${showInstructorDropdown ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="multi-select-trigger"
                      onClick={() => setShowInstructorDropdown((prev) => !prev)}
                      aria-expanded={showInstructorDropdown}
                      aria-haspopup="listbox"
                    >
                      <span className="multi-select-trigger-label">
                        {courseForm.instructors.length === 0
                          ? 'Select instructors'
                          : `${courseForm.instructors.length} instructor${courseForm.instructors.length > 1 ? 's' : ''} selected`}
                      </span>
                      <span className="multi-select-chevron" aria-hidden="true">⌄</span>
                    </button>

                    {showInstructorDropdown && (
                      <div
                        className="multi-select-menu"
                        role="listbox"
                        aria-label="Available instructors"
                      >
                        {instructors.length === 0 ? (
                          <div className="multi-select-empty">
                            No instructors available
                          </div>
                        ) : (
                          instructors.map((inst) => {
                            const instructorId = inst.id;
                            const instructorName =
                              inst.instructor_name || inst.name || inst.full_name || `Instructor ${instructorId}`;
                            const isSelected = courseForm.instructors.includes(instructorId);

                            return (
                              <label
                                key={instructorId}
                                className={`multi-select-option ${isSelected ? 'is-selected' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleInstructorSelection(instructorId)}
                                />
                                <span>👤 {instructorName}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {courseForm.instructors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {courseForm.instructors.map((id) => {
                        const inst = instructors.find((item) => String(item.id) === String(id));
                        return (
                          <span
                            key={id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 9px',
                              borderRadius: '999px',
                              background: '#ede9fe',
                              color: '#6d28d9',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            {inst?.instructor_name || inst?.name || `Instructor ${id}`}
                            <button
                              type="button"
                              onClick={() => toggleInstructorSelection(id)}
                              style={{ border: 0, background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                              aria-label="Remove instructor"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="form-group full">
                <div className="matrix-card">
                  <div className="matrix-header">
                    <h4>📊 Fees for Each Combination (Level × Mode × Lesson Duration × Package)</h4>
                    <div className="matrix-autofill-box">
                      {}
                    </div>
                  </div>

                  <div className="table-wrapper" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    <table className="matrix-table">
                      <thead>
                        <tr>
                          <th>Level</th>
                          <th>Mode</th>
                          <th>Session Duration</th>
                          <th>Package</th>
                          {}
                          <th>Final Package Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseForm.combination_pricing.map((comb, idx) => {
                          const durObj = getDurationOption(comb.lesson_duration);
                          const pkgObj = packageOptions.find((p) => p.value === comb.package);

                          return (
                            <tr key={`${comb.level}-${comb.mode}-${comb.lesson_duration}-${comb.package}`}>
                              <td>
                                <span className={`mini-chip ${comb.level}`}>
                                  {comb.level}
                                </span>
                              </td>
                              <td>
                                <span className="mini-chip mode">
                                  {`${getModeIcon(comb.mode)} ${getModeLabel(comb.mode)}`}
                                </span>
                              </td>
                              <td>
                                <span className="mini-chip duration" style={{ background: '#fef3c7', color: '#b45309', fontWeight: '700' }}>
                                  ⏱️ {durObj?.label || comb.lesson_duration}
                                </span>
                              </td>
                              <td>
                                <span className="mini-chip duration">
                                  📦 {pkgObj?.label || comb.package}
                                </span>
                              </td>
                              {}
                              <td>
                                <div className="matrix-price-input">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={comb.price}
                                    onChange={(e) => updateCombinationPrice(idx, e.target.value)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showEnrollModal && enrollCourse && (
        <div className="modal-overlay">
          <div className="modal-card enrollment-modal-card">
            <div className="modal-header">
              <div>
                <h2>⚡ Student Course Enrollment</h2>
                <p>Select student, skill level, teaching mode, and duration to match the dynamic course fee.</p>
              </div>
              <button className="close-btn" onClick={() => setShowEnrollModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} style={{ display: 'contents' }}>
              <div className="modal-body">
                {}
                <div className="enroll-course-banner">
                  <div>
                    <div className="banner-title">
                      {enrollCourse.course_name}
                    </div>
                    <div className="banner-sub">
                      Course Code: {enrollCourse.course_number} | Campus: {enrollCourse.branch_name}
                    </div>
                  </div>
                  <span className="status-pill active">Ready to Enroll</span>
                </div>

                {/* Warning if already enrolled */}
                {isCurrentStudentAlreadyEnrolled && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #f87171',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: '600',
                    fontSize: '0.88rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <span>
                      This student is already enrolled in <strong>{enrollCourse.course_name}</strong>. A student cannot be enrolled in the same course again.
                    </span>
                  </div>
                )}

                {}
                <div className="form-group">
                  <label>Select Enrolling Student <span>*</span></label>
                  <select
                    className="form-control"
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                    style={isCurrentStudentAlreadyEnrolled ? { borderColor: '#ef4444', backgroundColor: '#fff5f5' } : {}}
                  >
                    {students.map((s) => {
                      const alreadyEnrolled = isStudentEnrolledInCourse(s.id, enrollCourse);
                      return (
                        <option key={s.id} value={s.id}>
                          👤 {s.name} ({s.studentId}) {alreadyEnrolled ? '— ⛔ (Already Enrolled in this Course)' : `- ${s.phone || s.email}`}
                        </option>
                      );
                    })}
                    {/* <option value="custom">+ Enroll a New Student</option> */}
                  </select>

                  {enrollForm.studentId === 'custom' && (
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginTop: '8px' }}
                      placeholder="Enter new student's full name"
                      required
                      value={enrollForm.customStudentName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, customStudentName: e.target.value })}
                    />
                  )}
                </div>

                {}
                <div className="form-group">
                  <label>Select Skill Level <span>*</span></label>
                  <div className="chips-selector">
                    {(enrollCourse.selected_levels || ['beginner', 'intermediate', 'advanced']).map((lvl) => (
                      <label
                        key={lvl}
                        className={`chip-option ${enrollForm.level === lvl ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="enroll_level"
                          checked={enrollForm.level === lvl}
                          onChange={() => setEnrollForm({ ...enrollForm, level: lvl })}
                        />
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {}
                <div className="form-group">
                  <label>Select Teaching Mode <span>*</span></label>
                  <div className="chips-selector">
                    {(enrollCourse.selected_modes || lessonModes.map((item) => item.code)).map((mode) => (
                      <label
                        key={mode}
                        className={`chip-option ${enrollForm.mode === mode ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="enroll_mode"
                          checked={enrollForm.mode === mode}
                          onChange={() => setEnrollForm({ ...enrollForm, mode })}
                        />
                        {`${getModeIcon(mode)} ${getModeLabel(mode)}`}
                      </label>
                    ))}
                  </div>
                </div>

                {}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Select Lesson Duration (Session Length) *
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--crs-primary)', fontWeight: '700' }}>
                      Fee changes dynamically
                    </span>
                  </label>
                  <div className="chips-selector">
                    {(enrollCourse.selected_lesson_durations || lessonDurations.map((item) => `${item.minutes}_min`)).map((durKey) => {
                      const dObj = getDurationOption(durKey) || {
                        label: getDurationLabel(durKey),
                        icon: getDurationIcon(durKey),
                      };
                      return (
                        <label
                          key={durKey}
                          className={`chip-option ${enrollForm.lessonDuration === durKey ? 'selected' : ''}`}
                          style={{
                            borderColor:
                              enrollForm.lessonDuration === durKey
                                ? 'var(--crs-primary)'
                                : undefined,
                          }}
                        >
                          <input
                            type="radio"
                            name="enroll_lesson_duration"
                            checked={enrollForm.lessonDuration === durKey}
                            onChange={() => setEnrollForm({ ...enrollForm, lessonDuration: durKey })}
                          />
                          {dObj.icon} <strong>{dObj.label}</strong> / class
                        </label>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="form-group">
                  <label>Select Package Lessons <span>*</span></label>
                  <div className="chips-selector">
                    {(enrollCourse.selected_packages || ['2_lessons', '4_lessons', '6_lessons']).map((pkgKey) => {
                      const pObj = packageOptions.find((p) => p.value === pkgKey) || {
                        label: pkgKey,
                        lessons: 2,
                      };
                      return (
                        <label
                          key={pkgKey}
                          className={`chip-option ${enrollForm.packageDuration === pkgKey ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="enroll_package"
                            checked={enrollForm.packageDuration === pkgKey}
                            onChange={() => setEnrollForm({ ...enrollForm, packageDuration: pkgKey })}
                          />
                          📦 {pObj.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Program Start Date <span>*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={enrollForm.startDate}
                      onChange={(e) => setEnrollForm({ ...enrollForm, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Program End Date <span>*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      min={enrollForm.startDate || undefined}
                      value={enrollForm.endDate}
                      onChange={(e) => setEnrollForm({ ...enrollForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Preferred Instructor (Optional)</label>
                    <select
                      className="form-control"
                      value={enrollForm.instructorId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, instructorId: e.target.value })}
                    >
                      <option value="">Any Available Instructor</option>
                      {enrollCourse.instructors.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          👤 {inst.instructor_name || inst.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!registrationFeeAlreadyPaid && (
                  <div className="form-group registration-fee-field">
                    <label htmlFor="registration-fee">Registration Fee</label>
                    <div className="fee-input-wrap">
                      <input
                        id="registration-fee"
                        type="number"
                        min="0"
                        step="0.001"
                        className="form-control"
                        value={registrationFee}
                        onChange={(e) => setRegistrationFee(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {}
                <div className="payment-summary-card">
                  <div className="summary-header">
                    <h3>
                      <span>🧾</span> Payment & Fee Summary
                    </h3>
                    <span className="summary-badge-live">
                      ⏱️ Matched {matchedFeeCalculation.durationLabel} Rate
                    </span>
                  </div>

                  <div className="summary-rows">
                    <div className="summary-row">
                      <span>Course Program</span>
                      <strong>{enrollCourse.course_name} ({enrollCourse.category})</strong>
                    </div>

                    <div className="summary-row">
                      <span>Selected Level & Mode</span>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {enrollForm.level} • {`${getModeLabel(enrollForm.mode)} ${getModeIcon(enrollForm.mode)}`}
                      </strong>
                    </div>

                    <div className="summary-row" style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                      <span>Lesson Duration (Session Length)</span>
                      <strong style={{ color: 'var(--crs-primary)' }}>
                        ⏱️ {matchedFeeCalculation.durationLabel} 
                      </strong>
                    </div>

                    <div className="summary-row">
                      <span>Package & Lessons</span>
                      <strong>
                        {matchedFeeCalculation.packageLabel}
                      </strong>
                    </div>

                    <div className="summary-row muted">
                      <span>Standard Package Fee</span>
                      <span>{formatEnrollmentAmount(matchedFeeCalculation.baseFee)}</span>
                    </div>

                    {false && matchedFeeCalculation.discount > 0 && (
                      <div className="summary-row discount">
                        <span>Package Discount</span>
                        <span>- {formatEnrollmentAmount(matchedFeeCalculation.discount)}</span>
                      </div>
                    )}

                    <div className="summary-divider" />

                    <div className="summary-row">
                      <span>Course Fee</span>
                      <span>{formatEnrollmentAmount(matchedFeeCalculation.finalAmount)}</span>
                    </div>

                    {!registrationFeeAlreadyPaid && (
                      <div className="summary-row">
                        <span>Registration Fee</span>
                        <span>{formatEnrollmentAmount(payableRegistrationFee)}</span>
                      </div>
                    )}

                    <div className="summary-row total">
                      <span>Total Amount Payable</span>
                      <span className="total-amount">
                        {formatEnrollmentAmount((Number(matchedFeeCalculation.finalAmount) || 0) + payableRegistrationFee)}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="payment-methods-box">
                    <div className="payment-methods-title">Choose Payment Mode</div>
                    <div className="payment-options-grid">
                      {[
                        { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                        { id: 'cash', label: 'Cash at Center', icon: '💵' },
                        { id: 'upi', label: 'UPI / Online Transfer', icon: '📱' },
                        { id: 'bank', label: 'Bank Wire Transfer', icon: '🏦' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          className={`payment-option-btn ${enrollForm.paymentMethod === pm.id ? 'selected' : ''}`}
                          onClick={() => setEnrollForm({ ...enrollForm, paymentMethod: pm.id })}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{pm.icon}</span>
                          <span>{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowEnrollModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isCurrentStudentAlreadyEnrolled}
                  style={isCurrentStudentAlreadyEnrolled ? { opacity: 0.55, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                >
                  {isCurrentStudentAlreadyEnrolled
                    ? '⛔ Already Enrolled in this Course'
                    : `💳 Proceed to Payment (${formatEnrollmentAmount((Number(matchedFeeCalculation.finalAmount) || 0) + payableRegistrationFee)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showReceiptModal && receiptData && (
        <div className="modal-overlay">
          <div className="modal-card receipt-card">
            <div className="receipt-icon-circle">✓</div>
            <h2>Enrollment & Payment Successful!</h2>
            <p>The student has been successfully enrolled in the course with the selected lesson duration and schedule.</p>

            <div className="receipt-details-box">
              <div className="receipt-line">
                <span>Enrollment Ref:</span>
                <strong>{receiptData.enrollmentId}</strong>
              </div>
              <div className="receipt-line">
                <span>Student:</span>
                <strong>{receiptData.studentName} ({receiptData.studentId})</strong>
              </div>
              <div className="receipt-line">
                <span>Course Program:</span>
                <strong>{receiptData.courseName}</strong>
              </div>
              <div className="receipt-line">
                <span>Level & Mode:</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {receiptData.level} | {getModeLabel(receiptData.mode)}
                </strong>
              </div>
              <div className="receipt-line">
                <span>Lesson Duration:</span>
                <strong style={{ color: 'var(--crs-primary)' }}>
                  ⏱️ {receiptData.lessonDurationLabel} ({formatEnrollmentAmount(receiptData.perLesson)} / class)
                </strong>
              </div>
              <div className="receipt-line">
                <span>Course Fee:</span>
                <strong>{formatEnrollmentAmount(receiptData.courseFee)}</strong>
              </div>
              <div className="receipt-line">
                <span>Registration Fee:</span>
                <strong>{formatEnrollmentAmount(receiptData.registrationFee)}</strong>
              </div>
              <div className="receipt-line">
                <span>Package Booked:</span>
                <strong>
                  {receiptData.packageLabel}
                </strong>
              </div>
              <div className="receipt-line">
                <span>Start Date:</span>
                <strong>{receiptData.startDate}</strong>
              </div>
              <div className="receipt-line">
                <span>Payment Mode:</span>
                <strong style={{ textTransform: 'uppercase' }}>{receiptData.paymentMethod}</strong>
              </div>
              <div className="receipt-line" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>Amount Paid:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--crs-primary)' }}>
                  {formatEnrollmentAmount(receiptData.amount)}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="secondary-btn"
                onClick={() => window.print()}
              >
                🖨️ Print Receipt
              </button>
              <button
                className="primary-btn"
                onClick={() => setShowReceiptModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showDetailsDrawer && selectedCourseDetails && (
        <div className="drawer-overlay" onClick={() => setShowDetailsDrawer(false)}>
          <div className="details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Course Overview</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--crs-text-muted)' }}>
                  {selectedCourseDetails.course_number}
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowDetailsDrawer(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div style={{ height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: '18px' }}>
                {selectedCourseDetails.image ? (
                  <img
                    src={selectedCourseDetails.image}
                    alt={selectedCourseDetails.course_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="card-media-fallback" style={{ height: '100%' }}>
                    <span className="course-badge-text">{selectedCourseDetails.category}</span>
                  </div>
                )}
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem' }}>{selectedCourseDetails.course_name}</h3>
              <p style={{ color: 'var(--crs-text-muted)', lineHeight: '1.6', fontSize: '0.92rem' }}>
                {selectedCourseDetails.description}
              </p>

              <h4 style={{ margin: '20px 0 10px 0', fontSize: '0.95rem' }}>Instructors</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCourseDetails.instructors.map((inst, i) => (
                  <div key={inst.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div className="instructor-avatar-circle" style={{ margin: 0 }}>
                      {(inst.instructor_name || inst.name || 'I').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{inst.instructor_name || inst.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--crs-text-muted)' }}>{inst.specialization || 'Instructor'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: '24px 0 10px 0', fontSize: '0.95rem' }}>Duration-Based Pricing Matrix</h4>
              <div className="table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Mode</th>
                      <th>Duration</th>
                      <th>Package</th>
                      <th>Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourseDetails.combination_pricing.map((comb) => (
                      <tr key={`${comb.level}-${comb.mode}-${comb.lesson_duration}-${comb.package}`}>
                        <td><span className={`mini-chip ${comb.level}`}>{comb.level}</span></td>
                        <td><span className="mini-chip mode">{comb.mode}</span></td>
                        <td><span className="mini-chip duration" style={{ background: '#fef3c7', color: '#b45309' }}>⏱️ {comb.lesson_duration?.replace('_', ' ')}</span></td>
                        <td><span className="mini-chip duration">📦 {comb.package?.replace('_', ' ')}</span></td>
                        <td><strong>{formatCurrency(comb.price)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowDetailsDrawer(false);
                  openEditModal(selectedCourseDetails);
                }}
              >
                ✏️ Edit Course
              </button>
              <button
                className="primary-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowDetailsDrawer(false);
                  openEnrollmentModal(selectedCourseDetails);
                }}
              >
                ⚡ Enroll Student
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showDeleteModal && courseToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '28px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '1.6rem' }}>
              ⚠️
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>Delete Music Course</h3>
            <p style={{ color: 'var(--crs-text-muted)', fontSize: '0.92rem', margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>"{courseToDelete.course_name}"</strong>? This will remove its pricing and combinations data.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="secondary-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" style={{ background: '#dc2626' }} onClick={handleDeleteCourse}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


