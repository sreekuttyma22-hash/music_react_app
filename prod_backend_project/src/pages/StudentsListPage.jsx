

import { useEffect, useMemo, useState } from 'react';

import {
  deleteStudent,
  getStudents,
  getEnrolledStudents,
} from '../apiClient';


// =====================================================
// ICONS
// =====================================================

const renderIcon = (name, size = 16) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'list':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );

    case 'grid':
      return (
        <svg {...common} fill="currentColor" stroke="none" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.2" />
          <rect x="14" y="3" width="7" height="7" rx="1.2" />
          <rect x="3" y="14" width="7" height="7" rx="1.2" />
          <rect x="14" y="14" width="7" height="7" rx="1.2" />
        </svg>
      );

    case 'edit':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );

    case 'delete':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M6 6l1 14h10l1-14" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );

    case 'plus':
      return (
        <svg
          {...common}
          stroke="white"
          strokeWidth="3"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      );

    case 'more':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'email':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case 'phone':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6.5 3.5h3l1.5 4-2 1.5a14 14 0 0 0 6 6l1.5-2 4 1.5v3c0 1-1 2-2 2C10.5 19.5 4.5 13.5 4.5 6.5c0-2 1-3 2-3Z" />
        </svg>
      );

    case 'location':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    default:
      return null;
  }
};


// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value || value === '-') {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Enrollment created_at values are UTC timestamps. Preserve the date sent by
// the backend instead of converting it to the browser's local timezone.
const formatEnrollmentDate = (value) => {
  if (!value || value === '-') {
    return '-';
  }

  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return formatDate(value);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};


// =====================================================
// FORMAT AMOUNT
// =====================================================

const formatAmount = (value, currency = 'INR') => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value || '0';
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
};


// =====================================================
// NORMALIZE NORMAL STUDENT
// =====================================================

const normalizeStudent = (student) => {
  const name =
    student?.name ||
    student?.student_name ||
    '-';

  return {
    ...student,

    id: student?.id,

    name,

    studentId:
      student?.studentId ||
      student?.student_number ||
      '-',

    email:
      student?.email ||
      '-',

    phone:
      student?.phone ||
      '-',

    status:
      student?.status ||
      (student?.active ? 'Active' : 'Inactive'),

    photo:
      student?.photo ||
      student?.image ||
      null,

    address:
      student?.address ||
      '-',

    avatar:
      student?.avatar ||
      name.charAt(0).toUpperCase(),
  };
};


// =====================================================
// NORMALIZE ENROLLMENT
// =====================================================

const normalizeEnrolledStudent = (enrollment) => {
  const student =
    enrollment?.student_details || {};

  const course =
    enrollment?.course_details || {};

  const pricing =
    enrollment?.pricing_details || {};

  const packageDetails =
    enrollment?.package_details || null;

  const studentName =
    student?.student_name || '-';

  const mode =
    pricing?.mode?.name ||
    pricing?.mode?.code ||
    '-';

  const lessonType =
    pricing?.lesson_type?.name ||
    pricing?.lesson_type?.code ||
    '-';

  const duration =
    pricing?.duration?.minutes
      ? `${pricing.duration.minutes} min`
      : '-';

  const level =
    pricing?.level || '-';

  const totalLessons =
    Number(enrollment?.total_lessons ?? 0);

  const lessonsUsed =
    Number(enrollment?.lessons_used ?? 0);

  const lessonsRemaining =
    Number(enrollment?.lessons_remaining ?? 0);

  return {
    ...enrollment,

    id: enrollment?.id,

    // Keep the actual student record id separate from the enrollment id. The
    // enrolled-students endpoint returns one record for each enrollment.
    studentRecordId:
      student?.id ??
      (typeof enrollment?.student === 'object'
        ? enrollment.student?.id
        : enrollment?.student) ??
      student?.student_number ??
      null,

    enrollmentNumber:
      enrollment?.enrollment_number || '-',

    status:
      enrollment?.status || 'active',

    startDate:
      enrollment?.start_date || null,

    // This is the top-level date of this exact enrollment record (identified
    // by enrollment_number), not student_details.created_at.
    enrollmentCreatedAt:
      enrollment?.created_at ||
      null,

    endDate:
      enrollment?.end_date || null,

    totalAmount:
      enrollment?.total_amount || '0',

    currency:
      pricing?.currency || 'INR',

    name: studentName,

    studentId:
      student?.student_number || '-',

    email:
      student?.email || '-',

    phone:
      student?.phone || '-',

    emergencyPhone:
      student?.emergency_phone || '-',

    parentName:
      student?.parent_name || '-',

    gender:
      student?.gender || '-',

    relationship:
      student?.relationship || '-',

    dateOfBirth:
      student?.date_of_birth || null,

    school:
      student?.school || '-',

    address:
      student?.address || '-',

    notes:
      student?.notes || '-',

    registrationDate:
      student?.registration_date || null,

    studentActive:
      student?.active ?? true,

    paymentStatus:
      student?.payment_status ?? false,

    photo:
      student?.image || null,

    branchName:
      student?.branch_name || '-',

    avatar:
      studentName.charAt(0).toUpperCase(),

    courseId:
      course?.id || enrollment?.course,

    courseNumber:
      course?.course_number || '-',

    course:
      course?.course_name || '-',

    courseCategory:
      course?.category || '-',

    courseDescription:
      course?.description || '-',

    courseStatus:
      course?.status || '-',

    courseBranch:
      course?.branch_name || '-',

    pricingId:
      pricing?.id || enrollment?.pricing,

    level,

    mode,

    modeCode:
      pricing?.mode?.code || '-',

    lessonType,

    duration,

    price:
      pricing?.price || '0',

    pricingActive:
      pricing?.active ?? true,

    packageId:
      enrollment?.package || null,

    packageName:
      packageDetails?.name ||
      packageDetails?.package_name ||
      '-',

    packageDetails,

    totalLessons,

    lessonsUsed,

    lessonsRemaining,

    appointments:
      Array.isArray(enrollment?.appointments)
        ? enrollment.appointments
        : [],
  };
};


// The enrolled-students API has one item per enrollment. Present a student
// only once in the list while retaining every enrollment for the detail view.
const groupEnrolledStudents = (enrollments) => {
  const groupedStudents = new Map();

  enrollments.forEach((enrollment) => {
    const studentKey =
      enrollment.studentRecordId ||
      (enrollment.studentId !== '-' ? enrollment.studentId : enrollment.id);

    const existing = groupedStudents.get(String(studentKey));
    const enrollmentHistory = existing
      ? [...existing.enrollmentHistory, enrollment]
      : [enrollment];

    enrollmentHistory.sort(
      (first, second) =>
        new Date(second.enrollmentCreatedAt || 0) -
        new Date(first.enrollmentCreatedAt || 0)
    );

    groupedStudents.set(String(studentKey), {
      ...enrollmentHistory[0],
      enrollmentHistory,
    });
  });

  return [...groupedStudents.values()];
};


// =====================================================
// STUDENT ACTIONS
// =====================================================

const StudentActions = ({
  student,
  onEdit,
  onDelete,
  showEdit = true,
}) => {
  return (
    <div
      className="row-actions"
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      {/* EDIT BUTTON
          Hidden for enrolled students */}
      {showEdit && (
        <button
          type="button"
          className="icon-btn edit-btn"
          aria-label={`Edit ${student.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.(student.id);
          }}
        >
          {renderIcon('edit', 15)}
        </button>
      )}

      {/* DELETE BUTTON
          Always visible */}
      <button
        type="button"
        className="icon-btn delete-btn"
        aria-label={`Delete ${student.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(student);
        }}
      >
        {renderIcon('delete', 15)}
      </button>

    </div>
  );
};


// =====================================================
// ENROLLED STUDENT DETAILS MODAL
// =====================================================

const EnrolledStudentDetailsModal = ({
  student,
  onClose,
}) => {
  if (!student) {
    return null;
  }

  const lessonProgress =
    student.totalLessons > 0
      ? Math.min(
          100,
          (student.lessonsUsed /
            student.totalLessons) *
            100
        )
      : 0;

  const enrollmentHistory =
    student.enrollmentHistory?.length
      ? student.enrollmentHistory
      : [student];

  return (
    <div
      className="enrollment-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="enrollment-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="enrollment-modal-header">
          <div>
            <h3>{student.name}</h3>

            <p>
              {student.studentId}

              {student.enrollmentNumber !== '-' &&
                ` • ${student.enrollmentNumber}`}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            {renderIcon('close', 18)}
          </button>
        </div>


        <div className="enrollment-student-summary">

          <div className="detail-avatar">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
              />
            ) : (
              student.avatar
            )}
          </div>

          <div>
            <strong>{student.name}</strong>

            <span>{student.email}</span>

            <span>{student.phone}</span>
          </div>

        </div>


        <div className="details-section">

          <h4>Student Information</h4>

          <div className="details-grid">

            <div className="detail-item">
              <span>Student Number</span>
              <strong>{student.studentId}</strong>
            </div>

            <div className="detail-item">
              <span>Date of Birth</span>
              <strong>
                {formatDate(student.dateOfBirth)}
              </strong>
            </div>

            <div className="detail-item">
              <span>Parent Name</span>
              <strong>{student.parentName}</strong>
            </div>

            <div className="detail-item">
              <span>Relationship</span>
              <strong>{student.relationship}</strong>
            </div>

            <div className="detail-item">
              <span>Gender</span>
              <strong>{student.gender}</strong>
            </div>

            <div className="detail-item">
              <span>School</span>
              <strong>{student.school}</strong>
            </div>

            <div className="detail-item">
              <span>Branch</span>
              <strong>{student.branchName}</strong>
            </div>

            <div className="detail-item">
              <span>Emergency Phone</span>
              <strong>{student.emergencyPhone}</strong>
            </div>

          </div>
        </div>


        <div className="details-section">

          <h4>
            Enrollment History ({enrollmentHistory.length}{' '}
            {enrollmentHistory.length === 1 ? 'course' : 'courses'})
          </h4>

          <div className="enrollment-history-list">
            {enrollmentHistory.map((enrollment) => (
              <article
                className="enrollment-history-card"
                key={enrollment.id || enrollment.enrollmentNumber}
              >
                <div className="enrollment-history-heading">
                  <div>
                    <strong>{enrollment.course}</strong>
                    <span>
                      {enrollment.courseNumber !== '-' &&
                        `${enrollment.courseNumber} • `}
                      {enrollment.enrollmentNumber}
                    </span>
                  </div>

                  <span className="history-status">
                    {enrollment.status}
                  </span>
                </div>

                <div className="enrollment-history-details">
                  <span>
                    <b>Enrolled on:</b>{' '}
                    {formatEnrollmentDate(enrollment.enrollmentCreatedAt)}
                  </span>
                  <span>
                    <b>Period:</b> {formatDate(enrollment.startDate)} -{' '}
                    {formatDate(enrollment.endDate)}
                  </span>
                  <span>
                    <b>Level / Mode:</b> {enrollment.level} / {enrollment.mode}
                  </span>
                  <span>
                    <b>Lessons:</b> {enrollment.lessonsUsed}/
                    {enrollment.totalLessons} used
                  </span>
                  <span>
                    <b>Amount:</b>{' '}
                    {formatAmount(enrollment.totalAmount, enrollment.currency)}
                  </span>
                </div>
              </article>
            ))}
          </div>

        </div>


        <div className="details-section">

          <h4>Course Details</h4>

          <div className="details-grid">

            <div className="detail-item">
              <span>Course</span>
              <strong>{student.course}</strong>
            </div>

            <div className="detail-item">
              <span>Course Number</span>
              <strong>{student.courseNumber}</strong>
            </div>

            <div className="detail-item">
              <span>Category</span>
              <strong>{student.courseCategory}</strong>
            </div>

            <div className="detail-item">
              <span>Course Branch</span>
              <strong>{student.courseBranch}</strong>
            </div>

          </div>

          {student.courseDescription !== '-' && (
            <div className="course-description">
              <span>Description</span>
              <p>{student.courseDescription}</p>
            </div>
          )}

        </div>


        <div className="details-section">

          <h4>Enrollment Details</h4>

          <div className="details-grid">

            <div className="detail-item">
              <span>Enrollment Number</span>
              <strong>
                {student.enrollmentNumber}
              </strong>
            </div>

            <div className="detail-item">
              <span>Enrolled on</span>
              <strong>
                {formatEnrollmentDate(student.enrollmentCreatedAt)}
              </strong>
            </div>

            <div className="detail-item">
              <span>Level</span>
              <strong>{student.level}</strong>
            </div>

            <div className="detail-item">
              <span>Lesson Type</span>
              <strong>{student.lessonType}</strong>
            </div>

            <div className="detail-item">
              <span>Mode</span>
              <strong>{student.mode}</strong>
            </div>

            <div className="detail-item">
              <span>Lesson Duration</span>
              <strong>{student.duration}</strong>
            </div>

            <div className="detail-item">
              <span>Price</span>
              <strong>
                {formatAmount(
                  student.price,
                  student.currency
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>Total Amount</span>
              <strong>
                {formatAmount(
                  student.totalAmount,
                  student.currency
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>Status</span>
              <strong className="capitalize">
                {student.status}
              </strong>
            </div>

            <div className="detail-item">
              <span>Start Date</span>
              <strong>
                {formatDate(student.startDate)}
              </strong>
            </div>

            <div className="detail-item">
              <span>End Date</span>
              <strong>
                {formatDate(student.endDate)}
              </strong>
            </div>

            <div className="detail-item">
              <span>Payment</span>

              <strong
                className={
                  student.paymentStatus
                    ? 'payment-paid'
                    : 'payment-pending'
                }
              >
                {student.paymentStatus
                  ? 'Paid'
                  : 'Pending'}
              </strong>
            </div>

          </div>

        </div>


        <div className="details-section">

          <h4>Lesson Progress</h4>

          <div className="lesson-summary-grid">

            <div>
              <strong>
                {student.totalLessons}
              </strong>
              <span>Total Lessons</span>
            </div>

            <div>
              <strong>
                {student.lessonsUsed}
              </strong>
              <span>Lessons Used</span>
            </div>

            <div>
              <strong>
                {student.lessonsRemaining}
              </strong>
              <span>Remaining</span>
            </div>

          </div>

          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${lessonProgress}%`,
              }}
            />
          </div>

        </div>


        <div className="details-section">

          <div className="appointments-heading">

            <h4>Appointments</h4>

            <span>
              {student.appointments.length}
            </span>

          </div>

          {student.appointments.length === 0 ? (
            <div className="empty-appointments">
              No appointments found.
            </div>
          ) : (
            <div className="appointments-list">

              {student.appointments.map(
                (appointment) => (
                  <div
                    className="appointment-item"
                    key={appointment.id}
                  >
                    <div>

                      <strong>
                        {appointment.lesson ||
                          'Lesson'}
                      </strong>

                      <span>
                        {formatDate(
                          appointment.appointment_date
                        )}

                        {appointment.start_time &&
                          ` • ${appointment.start_time}`}

                        {appointment.end_time &&
                          ` - ${appointment.end_time}`}
                      </span>

                      <span>
                        Branch:{' '}
                        {appointment.branch_name ||
                          '-'}
                      </span>

                      {appointment.instructor && (
                        <span>
                          Instructor:{' '}
                          {appointment.instructor
                            ?.instructor_name || '-'}
                        </span>
                      )}

                    </div>

                    <span
                      className={`status-badge ${String(
                        appointment.status ||
                          'pending'
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          '-'
                        )}`}
                    >
                      {appointment.status ||
                        'Pending'}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        </div>


        {student.notes &&
          student.notes !== '-' && (
            <div className="details-section">

              <h4>Notes</h4>

              <div className="notes-box">
                {student.notes}
              </div>

            </div>
          )}

      </div>
    </div>
  );
};


// =====================================================
// MAIN COMPONENT
// =====================================================

const StudentsListPage = ({
  onAddStudent,
  onViewStudent,
  onEditStudent,
  activeType = 'all',
}) => {

  const [viewMode, setViewMode] =
    useState('list');

  const [studentType, setStudentType] =
    useState(activeType);

  const [students, setStudents] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [studentToDelete, setStudentToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [openGridMenuId, setOpenGridMenuId] =
    useState(null);

  const [
    selectedEnrolledStudent,
    setSelectedEnrolledStudent,
  ] = useState(null);

  useEffect(() => {
    if (activeType) {
      setStudentType(activeType);
      setSearch('');
      setSelectedEnrolledStudent(null);
      setError('');
    }
  }, [activeType]);


  // ===================================================
  // LOAD STUDENTS
  // ===================================================

  useEffect(() => {

    let cancelled = false;

    const loadStudents = async () => {

      setLoading(true);
      setError('');

      try {

        let records = [];

        if (studentType === 'all') {

          records = await getStudents();

          records =
            (records || []).map(
              normalizeStudent
            );

        } else {

          records =
            await getEnrolledStudents();

          records =
            (records || []).map(
              normalizeEnrolledStudent
            );

          records = groupEnrolledStudents(records);

        }

        if (!cancelled) {
          setStudents(records);
        }

      } catch (loadError) {

        console.error(
          'Student loading error:',
          loadError
        );

        if (!cancelled) {

          setError(
            loadError?.response?.data?.message ||
            loadError?.response?.data?.detail ||
            loadError?.message ||
            'Unable to load students.'
          );

          setStudents([]);
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };

  }, [studentType]);


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredStudents = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {

      let values = [];

      if (studentType === 'enrolled') {

        values = [
          student.name,
          student.studentId,
          student.email,
          student.phone,
          student.course,
          student.courseNumber,
          ...(student.enrollmentHistory || []).flatMap((enrollment) => [
            enrollment.course,
            enrollment.courseNumber,
          ]),
          student.level,
          student.mode,
          student.lessonType,
          student.packageName,
          student.enrollmentNumber,
          student.status,
          student.parentName,
        ];

      } else {

        values = [
          student.name,
          student.studentId,
          student.email,
          student.phone,
          student.course,
          student.address,
        ];

      }

      return values
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

    });

  }, [
    students,
    search,
    studentType,
  ]);


  // ===================================================
  // ANALYTICS
  // ===================================================

  const studentAnalytics = useMemo(() => {

    const total = students.length;

    const active =
      students.filter(
        (student) =>
          String(student.status || '')
            .toLowerCase() === 'active'
      ).length;

    const inactive =
      students.filter(
        (student) =>
          String(student.status || '')
            .toLowerCase() === 'inactive'
      ).length;

    return {
      total,
      active,
      inactive,
    };

  }, [students]);


  // ===================================================
  // STUDENT TYPE
  // ===================================================

  const handleStudentTypeChange = (type) => {

    setStudentType(type);
    setSearch('');
    setSelectedEnrolledStudent(null);
    setError('');

  };


  // ===================================================
  // ROW CLICK
  // ===================================================

  const handleRowClick = (student) => {

    if (studentType === 'enrolled') {

      if (student.enrollmentHistory?.length) {
        setSelectedEnrolledStudent(student);
        return;
      }

      const enrollmentHistory = students
        .filter((candidate) => {
          if (student.studentRecordId && candidate.studentRecordId) {
            return String(candidate.studentRecordId) === String(student.studentRecordId);
          }

          return (
            student.studentId !== '-' &&
            String(candidate.studentId) === String(student.studentId)
          );
        })
        .sort(
          (first, second) =>
            new Date(second.startDate || 0) - new Date(first.startDate || 0)
        );

      setSelectedEnrolledStudent({
        ...student,
        enrollmentHistory,
      });

      return;
    }

    onViewStudent?.(student.id);
  };


  // ===================================================
  // DELETE STUDENT
  // ===================================================

  const handleDeleteClick = (student) => {

    if (deleting) {
      return;
    }

    setError('');
    setStudentToDelete(student);
  };


  const handleConfirmDelete = async () => {

    if (!studentToDelete?.id || deleting) {
      return;
    }

    const studentId =
      studentToDelete.id;

    setDeleting(true);
    setError('');

    try {

      console.log(
        'Deleting student:',
        studentId
      );

      await deleteStudent(studentId);

      console.log(
        'Student deleted successfully:',
        studentId
      );


      // Remove deleted student immediately
      setStudents((previousStudents) =>
        previousStudents.filter(
          (student) =>
            Number(student.id) !==
            Number(studentId)
        )
      );


      // Close modal
      setStudentToDelete(null);

    } catch (deleteError) {

      console.error(
        'Delete student error:',
        deleteError
      );

      const message =
        deleteError?.response?.data?.detail ||
        deleteError?.response?.data?.message ||
        deleteError?.message ||
        '';


      // Handle empty JSON response error
      if (
        message.includes(
          'Unexpected end of JSON input'
        ) ||
        message.includes(
          "Failed to execute 'json'"
        )
      ) {

        console.warn(
          'Delete succeeded but response had no JSON body.'
        );

        setStudents((previousStudents) =>
          previousStudents.filter(
            (student) =>
              Number(student.id) !==
              Number(studentId)
          )
        );

        setStudentToDelete(null);

        return;
      }


      setError(
        message ||
        'Unable to delete student.'
      );

    } finally {

      setDeleting(false);

    }
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="page-container students-page">

      <style>{`

        .students-analytics {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin: 0 0 20px;
        }

        .analytics-card {
          min-height: 100px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 18px;
          border: 1px solid #e9e9ef;
          border-radius: 12px;
          background: #fff;
          box-shadow:
            0 2px 8px rgba(30, 33, 54, 0.035);
        }

        .analytics-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          font-size: 18px;
          font-weight: 700;
        }

        .analytics-purple {
          background: #f0ebff;
          color: #6d3df5;
        }

        .analytics-green {
          background: #e7f8ef;
          color: #19a568;
        }

        .analytics-orange {
          background: #fff0e4;
          color: #ed9146;
        }

        .analytics-card strong {
          display: block;
          color: #272a3c;
          font-size: 20px;
          line-height: 1.1;
          font-weight: 700;
        }

        .analytics-card span {
          display: block;
          margin-top: 5px;
          color: #777b8c;
          font-size: 11px;
          font-weight: 500;
        }

        .add-student-btn {
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

        .add-student-btn:hover {
          background: #6133d0;
        }

        .action-icon {
          display: flex;
          align-items: center;
        }

        .student-filter-buttons {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .student-filter-buttons .filter-btn {
          border: 1px solid #e4e1ed;
          background: #fff;
          color: #666;
          padding: 8px 14px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: .2s ease;
        }

        .student-filter-buttons
        .filter-btn:hover {
          border-color: #7041df;
          color: #7041df;
        }

        .student-filter-buttons
        .filter-btn.active {
          background: #7041df;
          color: #fff;
          border-color: #7041df;
        }

        .enrolled-table {
          min-width: 850px;
        }

        .enrolled-table th {
          white-space: nowrap;
        }

        .enrolled-table td {
          vertical-align: middle;
        }

        .table-subtext {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          color: #8a8d9b;
        }

        .enrolled-course-list {
          display: grid;
          gap: 7px;
          min-width: 150px;
        }

        .enrolled-course-item {
          display: grid;
          gap: 2px;
        }

        .enrolled-course-item strong {
          color: #303344;
          font-size: 12px;
        }

        .enrolled-course-item small {
          color: #8a8d9b;
          font-size: 10px;
        }

        .info-badge {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f0ebff;
          color: #7041df;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .lesson-progress strong {
          display: block;
          font-size: 12px;
          color: #292c3d;
        }

        .lesson-progress small {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          color: #19a568;
        }
        

        /* =====================================
           DELETE MODAL
        ===================================== */

        .delete-confirm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(25, 25, 38, .48);
        }

        .delete-confirm-modal {
          width: min(480px, 100%);
          padding: 28px;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 20px 60px rgba(25, 25, 38, .25);
          animation: deleteModalIn .18s ease-out;
        }

        @keyframes deleteModalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .delete-confirm-modal h3 {
          margin: 0;
          color: #272a3c;
          font-size: 20px;
        }

        .delete-confirm-modal p {
          margin: 12px 0 24px;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }

        .delete-confirm-modal p strong {
          color: #272a3c;
        }

        .delete-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .delete-confirm-actions .filter-btn {
          border: 1px solid #e4e1ed;
          background: #fff;
          color: #555;
          padding: 9px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .delete-confirm-actions
        .filter-btn:hover:not(:disabled) {
          background: #f7f6fa;
        }

        .delete-confirm-actions
        .filter-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .delete-confirm-btn {
          min-width: 80px;
          border: 0;
          padding: 9px 18px;
          border-radius: 8px;
          background: #df3d58;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .delete-confirm-btn:hover:not(:disabled) {
          background: #ca2e49;
        }

        .delete-confirm-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }


        /* =====================================
           ENROLLMENT MODAL
        ===================================== */

        .enrollment-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(25, 25, 38, .48);
        }

        .enrollment-modal {
          width: min(800px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 16px;
          box-shadow:
            0 20px 60px rgba(25, 25, 38, .2);
        }

        .enrollment-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 24px 16px;
          border-bottom: 1px solid #eeeef3;
        }

        .enrollment-modal-header h3 {
          margin: 0;
          color: #272a3c;
          font-size: 20px;
        }

        .enrollment-modal-header p {
          margin: 5px 0 0;
          color: #858897;
          font-size: 12px;
        }

        .modal-close-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: #f4f3f7;
          color: #555867;
          cursor: pointer;
        }

        .enrollment-student-summary {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          background: #faf9fd;
        }

        .detail-avatar {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 50%;
          background: #ede7ff;
          color: #7041df;
          font-size: 21px;
          font-weight: 700;
        }

        .detail-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .enrollment-student-summary strong,
        .enrollment-student-summary span {
          display: block;
        }

        .enrollment-student-summary strong {
          color: #272a3c;
          font-size: 15px;
        }

        .enrollment-student-summary span {
          margin-top: 3px;
          color: #777b8c;
          font-size: 11px;
        }

        .details-section {
          padding: 20px 24px;
          border-bottom: 1px solid #eeeef3;
        }

        .details-section h4 {
          margin: 0 0 14px;
          color: #272a3c;
          font-size: 13px;
        }

        .enrollment-history-list {
          display: grid;
          gap: 10px;
        }

        .enrollment-history-card {
          padding: 14px;
          border: 1px solid #e7e4ef;
          border-radius: 10px;
          background: #fcfbff;
        }

        .enrollment-history-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .enrollment-history-heading strong,
        .enrollment-history-heading span {
          display: block;
        }

        .enrollment-history-heading strong {
          color: #303344;
          font-size: 13px;
        }

        .enrollment-history-heading div > span {
          margin-top: 4px;
          color: #858897;
          font-size: 10px;
        }

        .history-status {
          padding: 4px 8px;
          border-radius: 99px;
          background: #f0ebff;
          color: #7041df;
          font-size: 10px;
          text-transform: capitalize;
        }

        .enrollment-history-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 14px;
          margin-top: 12px;
        }

        .enrollment-history-details span {
          color: #606475;
          font-size: 11px;
        }

        .enrollment-history-details b {
          color: #303344;
          font-weight: 600;
        }

        .details-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .detail-item {
          padding: 12px;
          border: 1px solid #eeeef3;
          border-radius: 9px;
          background: #fff;
        }

        .detail-item span,
        .detail-item strong {
          display: block;
        }

        .detail-item span {
          margin-bottom: 5px;
          color: #858897;
          font-size: 10px;
        }

        .detail-item strong {
          color: #303344;
          font-size: 12px;
          text-transform: capitalize;
        }

        .capitalize {
          text-transform: capitalize;
        }

        .payment-paid {
          color: #19a568 !important;
        }

        .payment-pending {
          color: #ed9146 !important;
        }

        .course-description {
          margin-top: 12px;
          padding: 12px;
          border-radius: 9px;
          background: #f8f7fb;
        }

        .course-description span {
          display: block;
          margin-bottom: 5px;
          color: #858897;
          font-size: 10px;
        }

        .course-description p {
          margin: 0;
          color: #303344;
          font-size: 12px;
        }

        .lesson-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
        }

        .lesson-summary-grid > div {
          padding: 14px;
          border-radius: 9px;
          background: #f8f7fb;
          text-align: center;
        }

        .lesson-summary-grid strong,
        .lesson-summary-grid span {
          display: block;
        }

        .lesson-summary-grid strong {
          color: #7041df;
          font-size: 20px;
        }

        .lesson-summary-grid span {
          margin-top: 4px;
          color: #777b8c;
          font-size: 10px;
        }

        .progress-bar {
          height: 7px;
          margin-top: 15px;
          overflow: hidden;
          border-radius: 99px;
          background: #eceaf1;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: inherit;
          background: #7041df;
          transition: width .25s ease;
        }

        .appointments-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .appointments-heading h4 {
          margin-bottom: 0;
        }

        .appointments-heading > span {
          min-width: 24px;
          padding: 4px 7px;
          border-radius: 99px;
          background: #f0ebff;
          color: #7041df;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .appointments-list {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .appointment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid #eeeef3;
          border-radius: 9px;
        }

        .appointment-item strong,
        .appointment-item div > span {
          display: block;
        }

        .appointment-item strong {
          color: #303344;
          font-size: 12px;
        }

        .appointment-item div > span {
          margin-top: 4px;
          color: #858897;
          font-size: 10px;
        }

        .empty-appointments {
          margin-top: 12px;
          padding: 18px;
          border-radius: 9px;
          background: #f8f7fb;
          color: #858897;
          font-size: 11px;
          text-align: center;
        }

        .notes-box {
          padding: 12px;
          border-radius: 9px;
          background: #f8f7fb;
          color: #555867;
          font-size: 12px;
          line-height: 1.6;
        }

        /* =====================================
           COMPACT STUDENT GRID CARDS
        ===================================== */

        .student-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          width: 100%;
          padding: 2px 0 8px;
          box-sizing: border-box;
        }

        .student-grid-card {
          position: relative;
          width: 100%;
          min-width: 0;
          min-height: 142px;
          padding: 12px 13px 11px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid #e9e9ee;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(30, 33, 54, .055);
          cursor: pointer;
          overflow: visible;
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
        }

        .student-grid-card:hover {
          transform: translateY(-1px);
          border-color: #dedee6;
          box-shadow: 0 5px 14px rgba(30, 33, 54, .09);
        }

        .student-card-top {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
        }

        .student-card-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 50%;
          background: #f1f2f4;
          color: #626773;
          font-size: 12px;
          font-weight: 600;
        }

        .student-card-avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .student-card-heading {
          flex-direction: column;
          min-width: 0;
          flex: 1;
          padding-top: 1px;
        }

        .student-card-name {
          min-width: 0;
          color: #30323a;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-card-id {
          margin-top: 2px;
          color: #8a8d97;
          font-size: 9px;
          line-height: 1.2;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-card-more {
          width: 22px;
          height: 24px;
          min-width: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -3px -3px 0 0;
          padding: 0;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: #8c8f98;
          cursor: pointer;
        }

        .student-card-more:hover {
          background: #f5f5f7;
          color: #555963;
        }

        .student-card-details {
          display: grid;
          gap: 6px;
          margin-top: 12px;
          padding-top: 9px;
          border-top: 1px solid #f0f0f3;
          min-width: 0;
        }

        .student-card-detail-row {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .student-card-detail-icon {
          width: 14px;
          height: 14px;
          min-width: 14px;
          flex: 0 0 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7d818b;
        }

        .student-card-detail-text {
          min-width: 0;
          flex: 1;
          color: #656873;
          font-size: 9px;
          line-height: 1.25;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-card-footer {
          display: flex;
          align-items: center;
          margin-top: auto;
          padding-top: 9px;
        }

        .student-card-status {
          display: inline-flex;
          align-items: center;
          min-height: 18px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 9px;
          line-height: 1;
          font-weight: 600;
          text-transform: capitalize;
        }

        .student-card-status.active {
          background: #e7f8ee;
          color: #1ca566;
        }

        .student-card-status.inactive {
          background: #f1f1f3;
          color: #858892;
        }

        .student-card-menu {
          position: absolute;
          top: 34px;
          right: 9px;
          z-index: 100;
          width: 116px;
          padding: 4px;
          background: #fff;
          border: 1px solid #e6e6eb;
          border-radius: 7px;
          box-shadow: 0 8px 24px rgba(30, 33, 54, .14);
        }

        .student-card-menu-item {
          width: 100%;
          height: 29px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 8px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: #555862;
          font-size: 10px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
        }

        .student-card-menu-item:hover {
          background: #f5f2ff;
          color: #7041df;
        }

        .student-card-delete-item:hover {
          background: #fff1f3;
          color: #df3d58;
        }

        @media (max-width: 900px) {

          .student-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 1000px) {

          .students-analytics {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 600px) {

          .student-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .students-analytics {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .lesson-summary-grid {
            grid-template-columns: 1fr;
          }

          .enrollment-history-details {
            grid-template-columns: 1fr;
          }

          .enrollment-modal-backdrop,
          .delete-confirm-backdrop {
            padding: 10px;
          }

          .enrollment-modal-header,
          .enrollment-student-summary,
          .details-section {
            padding-left: 16px;
            padding-right: 16px;
          }

          .delete-confirm-modal {
            padding: 22px;
          }

        }

      `}</style>


      

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="students-toolbar">

        <div className="search-box">

          <span className="search-icon">
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
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <line
                x1="16.5"
                y1="16.5"
                x2="21"
                y2="21"
              />
            </svg>
          </span>

          <input
            type="text"
            placeholder={
              studentType === 'enrolled'
                ? 'Search student, course, package...'
                : 'Search student'
            }
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <div className="students-toolbar-actions">

          <div
            className="students-view-toggle"
            role="group"
            aria-label="Change student layout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '3px',
              border: '1px solid #e4e2e9',
              borderRadius: '8px',
              background: '#f8f7fa',
            }}
          >

            <button
              type="button"
              className={`students-view-toggle-btn ${
                viewMode === 'grid'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setViewMode('grid')
              }
              title="Grid view"
              aria-label="Grid view"
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 0,
                borderRadius: '6px',
                background: viewMode === 'grid' ? '#f0ebff' : 'transparent',
                color: viewMode === 'grid' ? '#7041df' : '#8c8c98',
                cursor: 'pointer',
              }}
            >
              {renderIcon('grid', 14)}
            </button>

            <button
              type="button"
              className={`students-view-toggle-btn ${
                viewMode === 'list'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setViewMode('list')
              }
              title="List view"
              aria-label="List view"
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 0,
                borderRadius: '6px',
                background: viewMode === 'list' ? '#f0ebff' : 'transparent',
                color: viewMode === 'list' ? '#7041df' : '#8c8c98',
                cursor: 'pointer',
              }}
            >
              {renderIcon('list', 15)}
            </button>

          </div>

          <button
            type="button"
            className="add-student-btn"
            onClick={onAddStudent}
          >
            <span className="action-icon">
              {renderIcon('plus', 16)}
            </span>
            Add Student
          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="students-feedback error">
          {error}
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="students-feedback">
          Loading{' '}
          {studentType === 'enrolled'
            ? 'enrolled students'
            : 'students'}
          ...
        </div>
      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!loading &&
        !error &&
        filteredStudents.length === 0 && (
          <div className="students-feedback">
            {studentType === 'enrolled'
              ? 'No enrolled students found.'
              : 'No students found.'}
          </div>
        )}


      {/* =================================================
          TABLE
      ================================================= */}

      {!loading &&
        filteredStudents.length > 0 &&
        viewMode === 'list' && (

          <div className="students-table-wrap">

            {/* ==========================================
                ALL STUDENTS TABLE
            ========================================== */}

            {studentType === 'all' && (

              <table className="students-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredStudents.map(
                    (student) => (

                      <tr
                        key={student.id}
                        className="student-row"
                        onClick={() =>
                          handleRowClick(student)
                        }
                      >

                        <td>

                          <div className="student-cell">

                            <span className="student-avatar">

                              {student.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                  }}
                                />
                              ) : (
                                student.avatar
                              )}

                            </span>

                            <div className="student-meta">

                              <strong>
                                {student.name}
                              </strong>

                              <small>
                                {student.studentId}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>
                          <p>{student.email}</p>
                        </td>

                        <td>
                          <p>{student.phone}</p>
                        </td>

                        <td>

                          <span
                            className={`status-badge ${String(
                              student.status
                            )
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                '-'
                              )}`}
                          >
                            {student.status}
                          </span>

                        </td>

                        <td>

                          {/* ALL STUDENTS:
                              Edit + Delete */}
                          <StudentActions
                            student={student}
                            onEdit={onEditStudent}
                            onDelete={handleDeleteClick}
                            showEdit={true}
                          />

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}


            {/* ==========================================
                ENROLLED STUDENTS TABLE
            ========================================== */}

            {studentType === 'enrolled' && (

              <table className="students-table enrolled-table">

                <thead>

                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Last Enrolled Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredStudents.map(
                    (student) => (

                      <tr
                        key={`${student.id}-${student.enrollmentNumber}`}
                        className="student-row"
                        onClick={() =>
                          handleRowClick(student)
                        }
                      >

                        <td>

                          <div className="student-cell">

                            <span className="student-avatar">

                              {student.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                  }}
                                />
                              ) : (
                                student.avatar
                              )}

                            </span>

                            <div className="student-meta">

                              <strong>
                                {student.name}
                              </strong>

                              <small>
                                {student.studentId}
                              </small>

                              <small>
                                {student.email}
                              </small>

                              <small>
                                {student.phone}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="enrolled-course-list">
                            {(student.enrollmentHistory || [student]).map(
                              (enrollment) => (
                                <div
                                  className="enrolled-course-item"
                                  key={enrollment.id || enrollment.enrollmentNumber}
                                >
                                  <strong>{enrollment.course}</strong>
                                  {enrollment.courseNumber !== '-' && (
                                    <small>{enrollment.courseNumber}</small>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                        </td>


                        <td>
                          <strong>
                            {formatEnrollmentDate(student.enrollmentCreatedAt)}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`status-badge ${String(
                              student.status
                            )
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                '-'
                              )}`}
                          >
                            {student.status}
                          </span>

                        </td>


                        <td>

                          {/* ENROLLED STUDENTS:
                              ONLY DELETE
                              EDIT IS HIDDEN */}
                          <StudentActions
                            student={student}
                            onEdit={onEditStudent}
                            onDelete={handleDeleteClick}
                            showEdit={false}
                          />

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        )}


      {/* =================================================
          GRID VIEW
      ================================================= */}

      {!loading &&
        filteredStudents.length > 0 &&
        viewMode === 'grid' && (
          <div className="student-grid">
            {filteredStudents.map((student) => {
              const gridMenuId =
                studentType === 'enrolled'
                  ? `${student.id}-${student.enrollmentNumber}`
                  : String(student.id);

              const isMenuOpen =
                openGridMenuId === gridMenuId;

              const status = String(
                student.status ||
                  (student.studentActive ? 'Active' : 'Inactive')
              );

              return (
                <article
                  key={gridMenuId}
                  className="student-grid-card"
                  onClick={() => handleRowClick(student)}
                >
                  <div className="student-card-top">
                    <div className="student-card-avatar">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                        />
                      ) : (
                        student.avatar
                      )}
                    </div>

                    <div className="student-card-heading">
                      <div
                        className="student-card-name"
                        title={student.name}
                      >
                        {student.name}
                      </div>

                      <div className="student-card-id">
                        ID: {student.studentId}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="student-card-more"
                      aria-label={`Actions for ${student.name}`}
                      aria-expanded={isMenuOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenGridMenuId(
                          isMenuOpen ? null : gridMenuId
                        );
                      }}
                    >
                      {renderIcon('more', 16)}
                    </button>

                    {isMenuOpen && (
                      <div
                        className="student-card-menu"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        {studentType !== 'enrolled' && (
                          <button
                            type="button"
                            className="student-card-menu-item"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenGridMenuId(null);
                              onEditStudent?.(student.id);
                            }}
                          >
                            {renderIcon('edit', 14)}
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="student-card-menu-item student-card-delete-item"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenGridMenuId(null);
                            handleDeleteClick(student);
                          }}
                        >
                          {renderIcon('delete', 14)}
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="student-card-details">
                    <div
                      className="student-card-detail-row"
                      title={student.email || '-'}
                    >
                      <span className="student-card-detail-icon">
                        {renderIcon('email', 13)}
                      </span>
                      <span className="student-card-detail-text">
                        {student.email || '-'}
                      </span>
                    </div>

                    <div
                      className="student-card-detail-row"
                      title={student.phone || '-'}
                    >
                      <span className="student-card-detail-icon">
                        {renderIcon('phone', 13)}
                      </span>
                      <span className="student-card-detail-text">
                        {student.phone || '-'}
                      </span>
                    </div>

                    <div
                      className="student-card-detail-row"
                      title={student.address || '-'}
                    >
                      <span className="student-card-detail-icon">
                        {renderIcon('location', 13)}
                      </span>
                      <span className="student-card-detail-text">
                        {student.address || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="student-card-footer">
                    <span
                      className={`student-card-status ${
                        status.toLowerCase() === 'active'
                          ? 'active'
                          : 'inactive'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {studentToDelete && (

        <div
          className="delete-confirm-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-student-title"
        >

          <div className="delete-confirm-modal">

            <h3 id="delete-student-title">
              Delete student
            </h3>

            <p>
              Are you sure you want to delete{' '}
              <strong>
                {studentToDelete.name}
              </strong>
              ?
            </p>

            <div className="delete-confirm-actions">

              <button
                type="button"
                className="filter-btn"
                onClick={() =>
                  setStudentToDelete(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete'}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          ENROLLED DETAILS MODAL
      ================================================= */}

      {selectedEnrolledStudent && (

        <EnrolledStudentDetailsModal
          student={selectedEnrolledStudent}
          onClose={() =>
            setSelectedEnrolledStudent(null)
          }
        />

      )}

    </div>
  );
};


export default StudentsListPage;
