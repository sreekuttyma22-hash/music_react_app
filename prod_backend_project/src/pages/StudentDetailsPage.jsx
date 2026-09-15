import { useEffect, useState } from 'react';
import { deleteStudent, getStudentById, imageToSrc, many2oneName } from '../apiClient';
import ConfirmDialog from '../component/ConfirmDialog';
import './studentregistration.css';

const displayValue = (value) => {
  if (value === false || value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
};

const StudentDetailsPage = ({ studentId, onBack, onEdit }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadStudent = async () => {
      setLoading(true);
      setError('');

      try {
        const record = await getStudentById(studentId);
        if (!cancelled) {
          setStudent(record);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to load student details.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStudent();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await deleteStudent(studentId);
      onBack?.();
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete student.');
      setDeleting(false);
    }
  };

  const name = student?.student_name || student?.name || many2oneName(student?.partner_id) || 'Student';
  const photo = imageToSrc(student?.image);

  return (
    <div className="page-container students-page">
      <div className="students-header-row">
        <div>
          <h2>Student Details</h2>
          <p>View student record information.</p>
        </div>
        <button type="button" className="filter-btn" onClick={onBack}>
          <span className="back-arrow">←</span><span className="back-arrow">←</span> Back to list
        </button>
      </div>

      {loading ? <div className="students-feedback">Loading student details...</div> : null}
      {error ? <div className="students-feedback error">{error}</div> : null}

      {!loading && student ? (
        <div className="student-details-card">
          <div className="student-details-hero">
            <div className="student-details-photo">
              {photo ? (
                <img src={photo} alt={name} />
              ) : (
                <span className="student-avatar large">
                  {name
                    .split(' ')
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3>{name}</h3>
              <span className={`status-badge ${student.active ? 'active' : 'inactive'}`}>
                {student.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="student-details-grid">
            <div>
              <span>Student Number</span>
              <strong>{displayValue(student.student_number)}</strong>
            </div>
            <div>
              <span>Date of Birth</span>
              <strong>{displayValue(student.date_of_birth)}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{displayValue(student.phone)}</strong>
            </div>
            <div>
              <span>Emergency Phone</span>
              <strong>{displayValue(student.emergency_phone)}</strong>
            </div>
            <div>
              <span>Parent Name</span>
              <strong>{displayValue(student.parent_name)}</strong>
            </div>
            <div>
              <span>Gender</span>
              <strong>{displayValue(student.gender)}</strong>
            </div>
            <div>
              <span>Relationship</span>
              <strong>{displayValue(student.relationship)}</strong>
            </div>
            <div>
              <span>Registration Date</span>
              <strong>{displayValue(student.registration_date)}</strong>
            </div>
            <div>
              <span>School</span>
              <strong>{displayValue(student.school)}</strong>
            </div>
            <div>
              <span>Address</span>
              <strong>{displayValue(student.address)}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{student.active ? 'true' : 'false'}</strong>
            </div>
            <div className="student-details-notes">
              <span>Notes</span>
              <strong>{displayValue(student.notes)}</strong>
            </div>
          </div>

          <div className="student-details-actions">
            <button type="button" className="action-primary small-action" onClick={() => onEdit(studentId)}>
              Update
            </button>
            <button type="button" className="delete-student-btn" onClick={() => setConfirmDelete(true)} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Confirmation"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await handleDelete();
          if (!deleting) setConfirmDelete(false);
        }}
      />
    </div>
  );
};

export default StudentDetailsPage;
