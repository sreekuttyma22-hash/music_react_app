import { useEffect, useState } from 'react';
import { createRoom, deleteRoom, getRooms, updateRoom } from '../apiClient';
import ConfirmDialog from '../component/ConfirmDialog';

const emptyForm = { name: '', capacity: 1, active: true };

const normalizeRoom = (room) => ({
  ...room,
  id: room.id ?? room.pk,
  name: room.name || 'Unnamed Room',
  capacity: Number(room.capacity || 1),
  active: room.active !== false,
});

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRooms();
      setRooms(data.map(normalizeRoom));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!success) return undefined;

    const timeoutId = window.setTimeout(() => setSuccess(''), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const openCreate = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({ name: room.name, capacity: room.capacity, active: room.active });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || Number(form.capacity) < 1) return;

    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      active: Boolean(form.active),
    };

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        setSuccess('Room updated successfully.');
      } else {
        await createRoom(payload);
        setSuccess('Room created successfully.');
      }
      setShowForm(false);
      await loadRooms();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (deletingRoomId || !room) return;

    setDeletingRoomId(room.id);
    setError('');
    setSuccess('');
    try {
      await deleteRoom(room.id);
      setSuccess('Room deleted successfully.');
      if (editingRoom?.id === room.id) setShowForm(false);
      await loadRooms();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete room.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  return (
    <div className="page-container rooms-page">
      <div className="rooms-header">
        <div>
          {/* <p className="eyebrow">Practice Spaces</p>
          <h2>Rooms</h2> */}
        </div>
        <button type="button" className="add-button" onClick={openCreate}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Room
        </button>
      </div>

      {success && <div className="rooms-feedback success">{success}</div>}
      {error && <div className="rooms-feedback error">{error}</div>}

      {showForm && (
        <form className="room-form" onSubmit={handleSubmit}>
          <div className="room-form-heading">
            <h3>{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
            <button type="button" className="location-close" onClick={() => setShowForm(false)} disabled={saving}>×</button>
          </div>
          <label>
            Room name
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </label>
          <label>
            Capacity
            <input type="number" min="1" value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))} required />
          </label>
          <label className="room-active-toggle">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
            Active room
          </label>
          <button type="submit" className="location-save" disabled={saving}>{saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}</button>
        </form>
      )}

      {loading ? (
        <div className="rooms-feedback">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="rooms-feedback">No rooms available for this location.</div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => (
            <article key={room.id} className="room-card purple">
              <div className="room-top">
                <span className="room-tag">Practice Room</span>
                <span className={`status-pill ${room.active ? 'available' : 'inactive'}`}>
                  {room.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3>{room.name}</h3>
              <div className="room-meta"><span>Capacity: {room.capacity}</span></div>
              <div className="room-footer">
                <span>{room.active ? 'Available for appointments' : 'Cannot be selected'}</span>
                <div className="room-actions">
                  <button
                    type="button"
                    className="room-icon-button edit"
                    onClick={() => openEdit(room)}
                    aria-label={`Edit ${room.name}`}
                    title="Edit room"
                    disabled={Boolean(deletingRoomId)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="room-icon-button delete"
                    onClick={() => setRoomToDelete(room)}
                    aria-label={`Delete ${room.name}`}
                    title="Delete room"
                    disabled={deletingRoomId === room.id}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(roomToDelete)}
        title="Delete Confirmation"
        message={roomToDelete ? `Are you sure you want to delete ${roomToDelete.name}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        busy={Boolean(deletingRoomId)}
        onCancel={() => setRoomToDelete(null)}
        onConfirm={async () => {
          await handleDelete(roomToDelete);
          setRoomToDelete(null);
        }}
      />
      </div>
  );
};

export default RoomsPage;
