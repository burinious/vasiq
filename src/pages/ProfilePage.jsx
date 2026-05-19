import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import AvatarUploader from '../components/profile/AvatarUploader';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../firebase/cloudinary';
import { updateUserProfile } from '../firebase/firestore';
import {
  NIGERIAN_LEVELS,
  NIGERIAN_PROGRAMMES,
  NIGERIAN_UNIVERSITIES,
} from '../data/nigeriaAcademics';
import { getFallbackNameFromEmail, getUserDisplayName } from '../utils/userIdentity';

const universityOptions = NIGERIAN_UNIVERSITIES.map((university) => university.name);
const courseOptions = NIGERIAN_PROGRAMMES;

const profileAutocompleteSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 48,
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.74)',
    color: '#0f172a',
    font: 'inherit',
    '& fieldset': {
      borderColor: 'rgba(148, 163, 184, 0.28)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(15, 118, 110, 0.34)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(15, 118, 110, 0.72)',
    },
  },
  '& .MuiInputBase-input': {
    padding: '12px 10px !important',
  },
};

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function ProfilePage() {
  const { currentUser, profile } = useAuth();
  const [formValues, setFormValues] = useState({
    fullName: '',
    displayName: '',
    university: '',
    department: '',
    level: '',
    residence: '',
    statusText: '',
    showDepartment: true,
    showUniversity: true,
    showLevel: true,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const publicName = getUserDisplayName({
    ...profile,
    ...formValues,
    email: currentUser?.email,
  });
  const profileCompletion = Math.round(
    ([
      publicName,
      formValues.university || profile?.university,
      formValues.department || profile?.department,
      formValues.level || profile?.level,
      formValues.residence || profile?.residence,
      formValues.statusText || profile?.statusText,
      avatarPreview,
    ]
      .filter(Boolean).length /
      7) *
      100,
  );
  const levelOptions = NIGERIAN_LEVELS;
  const selectedProfileUniversity = universityOptions.includes(formValues.university)
    ? formValues.university
    : null;
  const selectedProfileCourse = courseOptions.includes(formValues.department)
    ? formValues.department
    : null;

  useEffect(() => {
    setFormValues({
      fullName: profile?.fullName || profile?.name || '',
      displayName: profile?.displayName || profile?.name || '',
      university: profile?.university || '',
      department: profile?.department || '',
      level: profile?.level || '',
      residence: profile?.residence || '',
      statusText: profile?.statusText || '',
      showUniversity: profile?.showUniversity !== false,
      showDepartment: profile?.showDepartment !== false,
      showLevel: profile?.showLevel !== false,
    });
    setAvatarPreview(profile?.avatarUrl || '');
  }, [profile]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    setAvatarFile(file || null);
    setAvatarPreview(file ? URL.createObjectURL(file) : profile?.avatarUrl || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedUniversity = formValues.university.trim();

    if (selectedUniversity && !universityOptions.includes(selectedUniversity)) {
      setStatus('Choose your university from the list.');
      return;
    }

    const selectedCourse = formValues.department.trim();

    if (selectedCourse && !courseOptions.includes(selectedCourse)) {
      setStatus('Choose your course of discipline from the list.');
      return;
    }

    setBusy(true);
    setStatus('');

    try {
      let avatarUrl = profile?.avatarUrl || '';
      const fullName = formValues.fullName.trim();
      const displayName = formValues.displayName.trim();
      const fallbackName =
        displayName || fullName || getFallbackNameFromEmail(currentUser.email);

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'varsiq/avatars');
      }

      await withTimeout(
        updateUserProfile(currentUser.uid, {
          fullName,
          displayName,
          name: fallbackName,
          university: formValues.university.trim(),
          department: formValues.department.trim(),
          level: formValues.level,
          residence: formValues.residence.trim(),
          statusText: formValues.statusText.trim(),
          showUniversity: formValues.showUniversity,
          showDepartment: formValues.showDepartment,
          showLevel: formValues.showLevel,
          avatarUrl,
        }),
        12000,
        'Profile save is taking too long. Check your connection and try again.',
      );

      setAvatarFile(null);
      setStatus('Profile updated successfully.');
    } catch (error) {
      setStatus(error.message || 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-grid profile-grid profile-layout">
      <section className="panel profile-card profile-editor-card">
        <div className="profile-hero">
          <div className="profile-hero-copy">
            <p className="eyebrow">Profile</p>
            <h2>Shape how campus sees you.</h2>
            <p>
              Keep your identity clear so your posts, chats, and communities always carry the
              right campus context.
            </p>
            <div className="profile-hero-badges">
              <span>{currentUser.emailVerified ? 'Email verified' : 'Email not verified'}</span>
              <span>{formValues.showUniversity ? (formValues.university || 'University pending') : 'University private'}</span>
              <span>{formValues.showDepartment ? (formValues.department || 'Course pending') : 'Course private'}</span>
              <span>{formValues.showLevel ? (formValues.level || 'Level pending') : 'Level private'}</span>
              <span>{formValues.residence || 'Residence pending'}</span>
            </div>
          </div>

          <div className="profile-hero-preview">
            <div className="avatar profile-hero-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt={publicName} />
              ) : (
                <span>{publicName[0]}</span>
              )}
            </div>
            <div className="profile-hero-meta">
              <strong>{publicName}</strong>
              <p>
                {formValues.showUniversity ? formValues.university || 'University pending' : 'Private university'}
              </p>
              <p>
                {formValues.showDepartment ? formValues.department || 'Campus community' : 'Private course'} / {formValues.showLevel ? formValues.level || 'Student' : 'Private level'}
              </p>
              <p>{formValues.residence || 'Residence not set yet'}</p>
            </div>
          </div>
        </div>

        <form className="profile-form profile-editor-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <div className="profile-form-section profile-form-section-media">
              <p className="section-label">Photo</p>
              <AvatarUploader preview={avatarPreview} onFileChange={handleAvatarChange} />
            </div>

            <div className="profile-form-section">
              <p className="section-label">Student Details</p>

              <div className="profile-field-stack">
                <label className="profile-field">
                  <span>Full name</span>
                  <input
                    className="input"
                    value={formValues.fullName}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Full name"
                  />
                </label>

                <label className="profile-field">
                  <span>Display name</span>
                  <input
                    className="input"
                    value={formValues.displayName}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    placeholder="Name people should see publicly"
                  />
                </label>

                <label className="profile-field profile-field-autocomplete">
                  <span>University</span>
                  <Autocomplete
                    disablePortal
                    autoHighlight
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    freeSolo={false}
                    options={universityOptions}
                    value={selectedProfileUniversity}
                    onChange={(_, nextValue) =>
                      setFormValues((current) => ({ ...current, university: nextValue || '' }))
                    }
                    isOptionEqualToValue={(option, value) => option === value}
                    noOptionsText="No university found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Start typing, then select"
                        sx={profileAutocompleteSx}
                      />
                    )}
                  />
                </label>

                <label className="profile-field profile-field-autocomplete">
                  <span>Course of discipline</span>
                  <Autocomplete
                    disablePortal
                    autoHighlight
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    freeSolo={false}
                    options={courseOptions}
                    value={selectedProfileCourse}
                    onChange={(_, nextValue) =>
                      setFormValues((current) => ({ ...current, department: nextValue || '' }))
                    }
                    isOptionEqualToValue={(option, value) => option === value}
                    noOptionsText="No programme found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Start typing, then select"
                        sx={profileAutocompleteSx}
                      />
                    )}
                  />
                </label>

                <label className="profile-field">
                  <span>Level</span>
                  <select
                    className="input"
                    value={formValues.level}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, level: event.target.value }))
                    }
                  >
                    <option value="">Select level</option>
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-field">
                  <span>Residence or hostel</span>
                  <input
                    className="input"
                    value={formValues.residence}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, residence: event.target.value }))
                    }
                    placeholder="Hostel, lodge, or off-campus area"
                  />
                </label>

                <label className="profile-field">
                  <span>Current status</span>
                  <textarea
                    className="input textarea"
                    value={formValues.statusText}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, statusText: event.target.value }))
                    }
                    placeholder="What are you working on, looking for, or heading to on campus?"
                    rows={3}
                  />
                </label>

                <div className="profile-visibility-grid">
                  <label className="profile-visibility-option">
                    <input
                      type="checkbox"
                      checked={formValues.showUniversity}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          showUniversity: event.target.checked,
                        }))
                      }
                    />
                    <div>
                      <strong>Show university publicly</strong>
                      <p>This helps students confirm your campus context before connecting.</p>
                    </div>
                  </label>

                  <label className="profile-visibility-option">
                    <input
                      type="checkbox"
                      checked={formValues.showDepartment}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          showDepartment: event.target.checked,
                        }))
                      }
                    />
                    <div>
                      <strong>Show course publicly</strong>
                      <p>This can appear on feed cards and chat discovery.</p>
                    </div>
                  </label>

                  <label className="profile-visibility-option">
                    <input
                      type="checkbox"
                      checked={formValues.showLevel}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          showLevel: event.target.checked,
                        }))
                      }
                    />
                    <div>
                      <strong>Show level publicly</strong>
                      <p>This can appear on your public student profile across the app.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-account-strip">
            <div>
              <p className="section-label">Account</p>
              <strong>{currentUser.email || 'No email'}</strong>
              <p>{currentUser.emailVerified ? 'Verified account' : 'Verification pending'}</p>
            </div>
            <div className="profile-account-completion">
              <span>Profile completion</span>
              <strong>{profileCompletion}%</strong>
            </div>
          </div>

          <div className="form-actions">
            {status ? <p className="status-text">{status}</p> : <span className="helper-text">Save changes to update your campus identity across the app.</span>}
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      <aside className="profile-side-stack">
        <section className="panel summary-card profile-summary-card">
          <p className="eyebrow">Overview</p>
          <h3>{publicName}</h3>
          <p>
            {formValues.showUniversity ? formValues.university || 'University not set' : 'University hidden'}
          </p>
          <p>
            {formValues.showDepartment ? formValues.department || 'Course not set' : 'Course hidden'} / {formValues.showLevel ? formValues.level || 'Level not set' : 'Level hidden'}
          </p>
          <p>{formValues.residence || 'Residence not added yet'}</p>
          <div className="profile-summary-progress">
            <div className="profile-summary-progress-bar">
              <span style={{ width: `${profileCompletion}%` }} />
            </div>
            <strong>{profileCompletion}% ready</strong>
          </div>
          <p>
            A complete profile makes your posts, comments, and chats feel more trustworthy,
            local, and easier to act on.
          </p>
        </section>

        <section className="panel profile-tips-card">
          <p className="eyebrow">Quick tips</p>
          <div className="profile-tips-list">
            <article>
              <strong>Add where you stay</strong>
              <p>Hostel and off-campus context makes gist, logistics, and discovery more relevant.</p>
            </article>
            <article>
              <strong>Keep your course current</strong>
              <p>Students in your discipline find you faster when your campus identity is accurate.</p>
            </article>
            <article>
              <strong>Use a living status</strong>
              <p>Students connect faster when they can see what you are looking for right now.</p>
            </article>
          </div>
        </section>
      </aside>
    </div>
  );
}

export default ProfilePage;
