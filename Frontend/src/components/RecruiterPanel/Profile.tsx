import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Save, X, Camera, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { formatDate } from '../../utils/dateUtils';
import { getImageUrl } from '../../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        designation: user?.designation || '',
        department: user?.department || '',
        joinDate: user?.joinDate || '',
        appPassword: user?.appPassword || '',
        personalEmail: user?.personalEmail || '',
        dateOfBirth: user?.dateOfBirth || '',
    });

    // Sync formData when user context changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                designation: user.designation || '',
                department: user.department || '',
                joinDate: user.joinDate || '',
                appPassword: user.appPassword || '',
                personalEmail: user.personalEmail || '',
                dateOfBirth: user.dateOfBirth || '',
            });
        }
    }, [user]);

    // Initialize profile photo from user data
    useEffect(() => {
        if (user?.profilePhoto) {
            setProfilePhoto(getImageUrl(user.profilePhoto));
        }
    }, [user?.profilePhoto]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setRemovePhoto(false); // Cancel remove if uploading new photo
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setProfilePhoto(null);
        setSelectedFile(null);
        setRemovePhoto(true);
        console.log('🗑️ Profile photo marked for removal');
    };

    const handleSave = async () => {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('designation', formData.designation);
        data.append('department', formData.department);
        data.append('joinDate', formData.joinDate);
        data.append('appPassword', formData.appPassword);
        data.append('personalEmail', formData.personalEmail);
        data.append('dateOfBirth', formData.dateOfBirth);

        if (removePhoto) {
            console.log('🗑️ Removing profile photo');
            data.append('removePhoto', 'true');
        } else if (selectedFile) {
            console.log('📤 Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
            data.append('profilePhoto', selectedFile);
        } else {
            console.log('⚠️ No file selected');
        }

        console.log('📤 Sending profile update...');
        const success = await updateProfile(data);
        if (success) {
            console.log('✅ Profile updated successfully');
            setIsEditing(false);
        } else {
            console.log('❌ Profile update failed');
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                designation: user.designation || '',
                department: user.department || '',
                joinDate: user.joinDate || '',
                appPassword: user.appPassword || '',
                personalEmail: user.personalEmail || '',
                dateOfBirth: user.dateOfBirth || '',
            });
        }
        setRemovePhoto(false);
        setSelectedFile(null);
        // Restore original photo
        if (user?.profilePhoto) {
            setProfilePhoto(getImageUrl(user.profilePhoto));
        } else {
            setProfilePhoto(null);
        }
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">MY PROFILE</h1>
                    <p className="text-slate-600">Manage Your Personal Information</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Edit2 size={18} />
                        EDIT PROFILE
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                        >
                            <X size={18} />
                            CANCEL
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            <Save size={18} />
                            SAVE CHANGES
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-4xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            {isEditing && (
                                <>
                                    <label
                                        htmlFor="photo-upload"
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors shadow-lg"
                                    >
                                        <Camera size={16} className="text-blue-600" />
                                    </label>
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-1">{user?.name || 'User Name'}</h2>
                            <p className="text-blue-100 flex items-center gap-2">
                                <Briefcase size={16} />
                                {user?.designation || 'Recruiter'}
                            </p>
                            {isEditing && (profilePhoto || user?.profilePhoto) && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="mt-3 text-sm text-red-200 hover:text-white underline transition-colors"
                                >
                                    Remove Profile Picture
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="p-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">PERSONAL INFORMATION</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    FULL NAME
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {user?.name || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    EMAIL ADDRESS
                                </div>
                            </label>
                            <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                {user?.email || 'Not provided'}
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-slate-400" />
                                    PHONE NUMBER
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter Phone Number"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {formData.phone || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} className="text-slate-400" />
                                    DESIGNATION
                                </div>
                            </label>
                            <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                {user?.designation || 'Not provided'}
                            </p>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" />
                                    DEPARTMENT
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter Department"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {formData.department || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Joining Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    JOINING DATE
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.joinDate ? formData.joinDate.split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {formData.joinDate ? formatDate(formData.joinDate) : 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    DATE OF BIRTH
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Personal Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    PERSONAL EMAIL
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.personalEmail}
                                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter Personal Email"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {formData.personalEmail || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* App Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-slate-400" />
                                    APP PASSWORD
                                </div>
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.appPassword}
                                    onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter App Password"
                                />
                            ) : (
                                <p className="text-slate-800 font-medium px-4 py-2.5 bg-slate-50 rounded-lg">
                                    {user?.appPassword || 'Not provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
