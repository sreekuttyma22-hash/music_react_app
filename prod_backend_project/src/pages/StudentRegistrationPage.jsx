import { useEffect, useMemo, useRef, useState } from 'react';
import { createStudent, getEnrolledStudents, getStudentById, imageToSrc, many2oneName, updateStudent } from '../apiClient';
import './studentregistration.css';

const courseOptions = ['Piano', 'Guitar', 'Violin', 'Vocals', 'Ukulele', 'Drums', 'Keyboard'];
const classTypeOptions = ['Group Class', 'Single Lesson', 'Custom Duration'];
const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];

const emptyForm = {
  name: '',
  studentNumber: '',
  dateOfBirth: '',
  image: null,
  imagePreview: '',
  email: '',
  phone: '',
  emergencyPhone: '',
  parentName: '',
  gender: '',
  relationship: '',
  registrationDate: new Date().toISOString().slice(0, 10),
  school: '',
  address: '',
  notes: '',
  active: false,
  paymentStatus: false,
};

const emptyCourseDraft = {
  course: '',
  classMode: '',
  classType: '',
  level: '',
  courseAmount: '',
};

const formatAmount = (value) =>
  `OMR ${Number(value || 0).toFixed(3)}`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({ preview: result, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const recordToForm = (record) => ({
  name: record.student_name || record.name || many2oneName(record.partner_id) || '',
  studentNumber: record.student_number || '',
  dateOfBirth: record.date_of_birth || '',
  image: null,
  imagePreview: imageToSrc(record.image),
  email: record.email || '',
  phone: record.phone || '',
  emergencyPhone: record.emergency_phone || '',
  parentName: record.parent_name || '',
  gender: record.gender || '',
  relationship: record.relationship || '',
  registrationDate: record.registration_date || new Date().toISOString().slice(0, 10),
  school: record.school && record.school !== false ? record.school : '',
  address: record.address && record.address !== false ? record.address : '',
  notes: record.notes && record.notes !== false ? record.notes : '',
  active: Boolean(record.active),
  paymentStatus: Boolean(record.payment_status),
});

function StudentRegistrationPage({ mode = 'create', studentId = null, onBack, onSuccess }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const [formData, setFormData] = useState(emptyForm);
  const imageInputRef = useRef(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDraft, setCourseDraft] = useState(emptyCourseDraft);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loadingStudent, setLoadingStudent] = useState(Boolean(studentId));
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loadingPendingPayments, setLoadingPendingPayments] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setFormData({
        ...emptyForm,
        registrationDate: new Date().toISOString().slice(0, 10),
      });
      setLoadingStudent(false);
      return;
    }

    let cancelled = false;

    const loadStudent = async () => {
      setLoadingStudent(true);
      setFeedback({ type: '', message: '' });

      try {
        const record = await getStudentById(studentId);
        if (!cancelled) {
          setFormData(recordToForm(record));
          const details = record.course_details;
          if (details && typeof details === 'object') {
            setSelectedCourse(details);
          } else {
            setSelectedCourse(null);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setFeedback({
            type: 'error',
            message: loadError?.message || 'Unable to load student details.',
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingStudent(false);
        }
      }
    };

    loadStudent();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateCourseDraft = (field, value) => {
    setCourseDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      updateField('image', null);
      updateField('imagePreview', '');
      return;
    }

    try {
      const { preview } = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, image: file, imagePreview: preview }));
    } catch {
      setFeedback({ type: 'error', message: 'Unable to read the selected image. Please try another file.' });
    }
  };

  const removeImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    setFormData((previous) => ({
      ...previous,
      image: null,
      imagePreview: '',
    }));
  };

  const openCourseModal = () => {
    setCourseDraft(
      selectedCourse
        ? {
            course: selectedCourse.course,
            classMode: selectedCourse.classMode,
            classType: selectedCourse.classType,
            level: selectedCourse.level,
            courseAmount: String(selectedCourse.courseAmount),
          }
        : emptyCourseDraft
    );
    setShowCourseModal(true);
  };

  const confirmCourse = () => {
    if (!courseDraft.course || !courseDraft.classMode || !courseDraft.classType || !courseDraft.level || !courseDraft.courseAmount) {
      setFeedback({ type: 'error', message: 'Please complete all course details before clicking OK.' });
      return;
    }

    const amount = Number(courseDraft.courseAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid course amount.' });
      return;
    }

    setSelectedCourse({ ...courseDraft, courseAmount: amount });
    setShowCourseModal(false);
    setFeedback({ type: '', message: '' });
  };

  const clearSelectedCourse = () => {
    setSelectedCourse(null);
  };

  const openPendingPaymentModal = async () => {
    setShowPendingPaymentModal(true);
    setLoadingPendingPayments(true);
    setFeedback({ type: '', message: '' });

    try {
      const enrollments = await getEnrolledStudents();
      setPendingEnrollments(
        enrollments.filter(
          (enrollment) => String(enrollment.student_details?.id) === String(studentId)
        )
      );
    } catch (error) {
      setPendingEnrollments([]);
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to load enrollment payment details.',
      });
    } finally {
      setLoadingPendingPayments(false);
    }
  };

  const markPendingPaymentAsPaid = async () => {
    setSavingPayment(true);

    try {
      await updateStudent(studentId, {
        payment_status: true,
        active: true,
      });
      setFormData((previous) => ({
        ...previous,
        active: true,
        paymentStatus: true,
      }));
      setShowPendingPaymentModal(false);
      setFeedback({ type: 'success', message: 'Payment marked as successful.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to update the payment status.',
      });
    } finally {
      setSavingPayment(false);
    }
  };

  const payload = useMemo(
    () => ({
      student_name: formData.name.trim(),
      date_of_birth: formData.dateOfBirth,
      image: formData.image instanceof File ? formData.image : null,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      emergency_phone: formData.emergencyPhone.trim(),
      parent_name: formData.parentName.trim(),
      gender: formData.gender,
      relationship: formData.relationship,
      registration_date: formData.registrationDate,
      school: formData.school.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      active: Boolean(formData.active),
      payment_status: Boolean(formData.paymentStatus),
      branch_name: selectedCourse?.course || '',
      course_details: selectedCourse,
    }),
    [formData, selectedCourse]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    if (isView) {
      onBack?.();
      return;
    }

    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Student name is required.' });
      return;
    }

    setSubmitting(true);

    try {
      const data = isEdit
        ? await updateStudent(studentId, payload)
        : await createStudent(payload);

      const successMessage =
        data?.message ||
        (isEdit ? 'Student updated successfully.' : 'Student registered successfully.');

      setFeedback({ type: 'success', message: successMessage });

      if (!isEdit) {
        setFormData({
          ...emptyForm,
          registrationDate: new Date().toISOString().slice(0, 10),
        });
        setSelectedCourse(null);
        onSuccess?.();
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to submit registration. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-registration-page">
      <div className="instructor-modal">
        <div className="modal-header">
          <h3>{isView ? 'View Student' : isEdit ? 'Edit Student' : 'Add Student'}</h3>
          {onBack ? (
            <button type="button" className="modal-close" onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {loadingStudent && (
            <div className="form-feedback" role="status">
              Loading student details...
            </div>
          )}

          {feedback.message && (
            <div className={`form-feedback ${feedback.type}`} role="alert">
              {feedback.message}
            </div>
          )}

          <fieldset className="student-form-fieldset" disabled={isView || loadingStudent}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="student-name">Student Name *</label>
                <input
                  id="student-name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter the name of student"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Enter the email id"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="enter the mobile number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="date-of-birth">Date of Birth</label>
                <input
                  id="date-of-birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={formData.gender} onChange={(e) => updateField('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="parent-name">Parent Name</label>
                <input
                  id="parent-name"
                  value={formData.parentName}
                  onChange={(e) => updateField('parentName', e.target.value)}
                  placeholder="enter the parent name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relationship">Relationship</label>
                <select
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) => updateField('relationship', e.target.value)}
                >
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="emergency-phone">Emergency Phone</label>
                <input
                  id="emergency-phone"
                  value={formData.emergencyPhone}
                  onChange={(e) => updateField('emergencyPhone', e.target.value)}
                  placeholder="enter the Emergency Phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="registration-date">Registration Date</label>
                <input
                  id="registration-date"
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => updateField('registrationDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="school">School</label>
                <input
                  id="school"
                  value={formData.school}
                  onChange={(e) => updateField('school', e.target.value)}
                  placeholder="Enter the School name"
                />
              </div>
              <div className="form-group full">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Enter the student's address"
                />
              </div>
              <div className="form-group full">
                <label htmlFor="student-image">Profile Image</label>
                <div className="image-upload">
                  <div className="image-preview">
                    {formData.imagePreview ? (
                      <>
                        <img src={formData.imagePreview} alt="Student preview" />
                        <button
                          type="button"
                          className="student-image-remove-icon"
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
                      <label htmlFor="student-image" className="image-upload-placeholder">
                        Upload image
                      </label>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    id="student-image"
                    className="student-image-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="form-group full">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="If you have any notes, write them here"
                />
              </div>
            </div>
          </fieldset>

          {selectedCourse && !isView && (
            <div className="selected-course-card">
              <div>
                <strong>{selectedCourse.course}</strong>
                <p>
                  {selectedCourse.classMode} · {selectedCourse.classType} · {selectedCourse.level}
                </p>
              </div>
              <div className="selected-course-actions">
                <span>{formatAmount(selectedCourse.courseAmount)}</span>
                <button type="button" className="cancel-button" onClick={clearSelectedCourse}>
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="modal-footer">
            {isEdit && !formData.paymentStatus && (
              <button
                type="button"
                className="pending-payment-btn"
                onClick={openPendingPaymentModal}
                disabled={loadingStudent}
              >
                Pay Pending Payment
              </button>
            )}
            {onBack ? (
              <button type="button" className="cancel-button" onClick={onBack} disabled={submitting}>
                {isView ? 'Close' : 'Cancel'}
              </button>
            ) : null}
            {isView ? null : (
              <button type="submit" className="save-button" disabled={submitting || loadingStudent}>
                {submitting ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
              </button>
            )}
          </div>
        </form>
      </div>

      {showCourseModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-course-title">
          <div className="course-modal">
            <div className="form-panel-header">
              <span className="panel-step-badge">♪</span>
              <div>
                <h3 id="add-course-title">Add Course</h3>
                <span>Select course details and fee</span>
              </div>
            </div>

            <div className="form-grid two-col">
              <div className="field-group">
                <label htmlFor="course">Course</label>
                <select id="course" value={courseDraft.course} onChange={(e) => updateCourseDraft('course', e.target.value)}>
                  <option value="">Select course</option>
                  {courseOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Class Mode</label>
                <div className="segmented-select">
                  <button
                    type="button"
                    className={`segment-btn ${courseDraft.classMode === 'Online' ? 'selected' : ''}`}
                    onClick={() => updateCourseDraft('classMode', 'Online')}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${courseDraft.classMode === 'Offline' ? 'selected' : ''}`}
                    onClick={() => updateCourseDraft('classMode', 'Offline')}
                  >
                    Offline
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="class-type">Class Type</label>
                <select
                  id="class-type"
                  value={courseDraft.classType}
                  onChange={(e) => updateCourseDraft('classType', e.target.value)}
                >
                  <option value="">Select class type</option>
                  {classTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="level">Level</label>
                <select id="level" value={courseDraft.level} onChange={(e) => updateCourseDraft('level', e.target.value)}>
                  <option value="">Select level</option>
                  {levelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group full-width">
                <label htmlFor="course-amount">Course Amount</label>
                <input
                  id="course-amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={courseDraft.courseAmount}
                  onChange={(e) => updateCourseDraft('courseAmount', e.target.value)}
                  placeholder="13.500"
                />
              </div>
            </div>

            <div className="registration-footer-actions split-footer">
              <button type="button" className="secondary-btn" onClick={() => setShowCourseModal(false)}>
                Cancel
              </button>
              <button type="button" className="next-btn" onClick={confirmCourse}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingPaymentModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-payment-title"
        >
          <div className="course-modal pending-payment-modal">
            <div className="form-panel-header">
              <span className="panel-step-badge">₹</span>
              <div>
                <h3 id="pending-payment-title">Pending Payment</h3>
                <span>{formData.name}'s enrollment details — cash payment confirmation</span>
              </div>
              <button
                type="button"
                className="filter-btn"
                onClick={() => setShowPendingPaymentModal(false)}
                disabled={savingPayment}
              >
                Close
              </button>
            </div>

            {loadingPendingPayments ? (
              <div className="form-feedback">Loading enrollment details...</div>
            ) : pendingEnrollments.length === 0 ? (
              <div className="form-feedback">No enrollments found for this student.</div>
            ) : (
              <div className="pending-enrollment-list">
                {pendingEnrollments.map((enrollment) => (
                  <div className="pending-enrollment-item" key={enrollment.id}>
                    <strong>{enrollment.course_details?.course_name || '-'}</strong>
                    <span>{enrollment.enrollment_number || '-'}</span>
                    <span>
                      Total: ₹{Number(enrollment.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="registration-footer-actions">
              <button
                type="button"
                className="confirm-pay-btn"
                onClick={markPendingPaymentAsPaid}
                disabled={loadingPendingPayments || pendingEnrollments.length === 0 || savingPayment}
              >
                {savingPayment ? 'Saving...' : 'Confirm Cash at Center Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentRegistrationPage;
