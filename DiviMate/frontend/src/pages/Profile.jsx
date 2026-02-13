import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  updateDietType,
  uploadAvatar,
  updateProfile,
  updateEmail,
  requestPhoneOtp,
  updatePhone,
} from "../services/api";
import {
  FiUser,
  FiMail,
  FiCopy,
  FiCheck,
  FiCamera,
  FiPhone,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/profile.css";

const BACKEND = "http://localhost:5000";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [dietLoading, setDietLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    dob: "",
    gender: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });

  const [phoneForm, setPhoneForm] = useState({
    phone: "",
    otp: "",
  });

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || "",
      dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : "",
      gender: user.gender || "",
      addressLine1: user.addressLine1 || "",
      addressLine2: user.addressLine2 || "",
      city: user.city || "",
      state: user.state || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
    });
    setPhoneForm((prev) => ({
      ...prev,
      phone: user.phone || "",
    }));
  }, [user]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("DiviMate ID copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleDietToggle = async () => {
    const newType = user?.dietType === "Veg" ? "Non-Veg" : "Veg";
    setDietLoading(true);
    try {
      const res = await updateDietType({ dietType: newType });
      setUser(res.data.user || { ...user, dietType: newType });
      toast.success(`Diet type updated to ${newType}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update diet type");
    } finally {
      setDietLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await uploadAvatar(formData);
      setUser(res.data.user || { ...user, avatar: res.data.user?.avatar });
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        ...profileForm,
        dob: profileForm.dob ? new Date(profileForm.dob) : null,
      };
      const res = await updateProfile(payload);
      setUser(res.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const res = await updateEmail(emailForm);
      setUser(res.data.user);
      setEmailForm({ newEmail: "", currentPassword: "" });
      toast.success("Email updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update email");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setOtpSending(true);
    try {
      await requestPhoneOtp();
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    setPhoneSaving(true);
    try {
      const res = await updatePhone(phoneForm);
      setUser(res.data.user);
      setPhoneForm({ phone: res.data.user.phone || "", otp: "" });
      toast.success("Phone updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update phone");
    } finally {
      setPhoneSaving(false);
    }
  };

  if (!user) return <div className="page-loader">Loading profile...</div>;

  const avatarSrc = user.avatar ? `${BACKEND}${user.avatar}` : null;

  return (
    <div className="profile-page">
      <h1 className="page-title">
        <FiUser /> My Profile
      </h1>

      <div className="profile-card">
        <div className="profile-avatar-wrapper">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <label className="avatar-upload-btn" title="Change photo">
            {avatarLoading ? <span className="spinner" /> : <FiCamera />}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </label>
        </div>

        <div className="profile-info">
          <div className="profile-row">
            <label>Name</label>
            <p>{user.name}</p>
          </div>

          <div className="profile-row">
            <label>
              <FiMail size={14} /> Email
            </label>
            <p>{user.email}</p>
          </div>

          <div className="profile-row">
            <label>
              <FiPhone size={14} /> Phone
            </label>
            <p>{user.phone || "Not set"}</p>
            <span className={`status-chip ${user.phoneVerified ? "verified" : "unverified"}`}>
              {user.phoneVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          <div className="profile-row">
            <label>Diet Type</label>
            <div className="diet-toggle-row">
              <span className={`diet-badge ${user.dietType === "Veg" ? "veg" : "nonveg"}`}>
                {user.dietType || "Not set"}
              </span>
              <button
                className="btn-secondary btn-sm"
                onClick={handleDietToggle}
                disabled={dietLoading}
              >
                Switch to {user.dietType === "Veg" ? "Non-Veg" : "Veg"}
              </button>
            </div>
          </div>

          <div className="profile-row divimate-id-row">
            <label>DiviMate ID</label>
            <div className="id-box">
              <code>{userId}</code>
              <button
                className="copy-btn"
                onClick={handleCopy}
                title="Copy ID"
              >
                {copied ? <FiCheck className="green" /> : <FiCopy />}
              </button>
            </div>
            <p className="id-hint">
              Share this ID so friends can add you to groups
            </p>
          </div>
        </div>
      </div>

      <div className="profile-card profile-form-card">
        <h2 className="profile-section-title">Personal Details</h2>
        <form className="profile-form" onSubmit={handleProfileSave}>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>
                <FiCalendar size={14} /> Date of Birth
              </label>
              <input
                type="date"
                value={profileForm.dob}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, dob: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>Gender</label>
              <select
                value={profileForm.gender}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="profile-field full">
              <label>
                <FiMapPin size={14} /> Address Line 1
              </label>
              <input
                type="text"
                value={profileForm.addressLine1}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                }
              />
            </div>
            <div className="profile-field full">
              <label>Address Line 2</label>
              <input
                type="text"
                value={profileForm.addressLine2}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, addressLine2: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>City</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>State</label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, state: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>Postal Code</label>
              <input
                type="text"
                value={profileForm.postalCode}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, postalCode: e.target.value }))
                }
              />
            </div>
            <div className="profile-field">
              <label>Country</label>
              <input
                type="text"
                value={profileForm.country}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, country: e.target.value }))
                }
              />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={profileSaving}>
            {profileSaving ? <span className="spinner" /> : "Save Details"}
          </button>
        </form>
      </div>

      <div className="profile-card profile-form-card">
        <h2 className="profile-section-title">Update Email</h2>
        <form className="profile-form" onSubmit={handleEmailUpdate}>
          <div className="profile-grid">
            <div className="profile-field">
              <label>New Email</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
                }
                required
              />
            </div>
            <div className="profile-field">
              <label>Current Password</label>
              <input
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <button className="btn-secondary" type="submit" disabled={emailSaving}>
            {emailSaving ? <span className="spinner" /> : "Update Email"}
          </button>
        </form>
      </div>

      <div className="profile-card profile-form-card">
        <h2 className="profile-section-title">Verify Phone Number</h2>
        <form className="profile-form" onSubmit={handlePhoneUpdate}>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={phoneForm.phone}
                onChange={(e) =>
                  setPhoneForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
              />
            </div>
            <div className="profile-field">
              <label>OTP (sent to email)</label>
              <input
                type="text"
                value={phoneForm.otp}
                onChange={(e) =>
                  setPhoneForm((prev) => ({ ...prev, otp: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="btn-outline"
              type="button"
              onClick={handleSendPhoneOtp}
              disabled={otpSending}
            >
              {otpSending ? <span className="spinner" /> : "Send OTP"}
            </button>
            <button className="btn-primary" type="submit" disabled={phoneSaving}>
              {phoneSaving ? <span className="spinner" /> : "Verify & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
