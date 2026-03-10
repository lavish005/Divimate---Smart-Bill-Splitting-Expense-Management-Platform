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
  User,
  Mail,
  Copy,
  Check,
  Camera,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Smartphone,
  Utensils
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"; // need to create or use div
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  if (!user) return <div className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  const avatarSrc = user.avatar ? `${BACKEND}${user.avatar}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col items-center sm:items-start gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Sidebar / Main Info */}
        <div className="md:col-span-4 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <CardContent className="pt-0 relative px-6">
              <div className="flex justify-center sm:justify-start -mt-12 mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={avatarSrc} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                    {avatarLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </label>
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1 mb-6">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <span>Dietary Preference</span>
                  </div>
                  <Button
                    variant={user.dietType === "Veg" ? "outline" : "destructive"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleDietToggle}
                    disabled={dietLoading}
                  >
                    {user.dietType || "Select"}
                  </Button>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase">DiviMate ID</div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded border text-xs flex-1 truncate font-mono">
                      {userId}
                    </code>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Share this ID so friends can add you.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms */}
        <div className="md:col-span-8 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm(p => ({ ...p, dob: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(p => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address</Label>
                    <Input
                      className="mb-2"
                      placeholder="Line 1"
                      value={profileForm.addressLine1}
                      onChange={(e) => setProfileForm(p => ({ ...p, addressLine1: e.target.value }))}
                    />
                    <Input
                      placeholder="Line 2"
                      value={profileForm.addressLine2}
                      onChange={(e) => setProfileForm(p => ({ ...p, addressLine2: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={profileForm.state}
                      onChange={(e) => setProfileForm(p => ({ ...p, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={profileForm.postalCode}
                      onChange={(e) => setProfileForm(p => ({ ...p, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                    Save Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Email</CardTitle>
                <CardDescription>Change your login email address.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Email</Label>
                    <Input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={emailForm.currentPassword}
                      onChange={(e) => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" variant="secondary" className="w-full" disabled={emailSaving}>
                    {emailSaving ? "Updating..." : "Update Email"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phone Verification</CardTitle>
                <CardDescription>
                  {user.phoneVerified ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium"><Check className="h-4 w-4" /> Phone Verified</span>
                  ) : (
                    <span className="text-rose-600 font-medium">Unverified</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePhoneUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+91..."
                      value={phoneForm.phone}
                      onChange={(e) => setPhoneForm(p => ({ ...p, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Enter OTP"
                      value={phoneForm.otp}
                      onChange={(e) => setPhoneForm(p => ({ ...p, otp: e.target.value }))}
                      disabled={!otpSending && !phoneForm.otp} // Allow typing if field is empty or after sending? Logic is fine as is
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendPhoneOtp}
                      disabled={otpSending}
                    >
                      {otpSending ? "Sending..." : "Get OTP"}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={phoneSaving}>
                    {phoneSaving ? "Verifying..." : "Verify & Save"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
