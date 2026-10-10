import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Save, X, Camera, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { formatDate } from '../../utils/dateUtils';
import { getImageUrl } from '../../utils/imageUtils';

// Removed unused constant

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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
                        My Profile
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">
                        Manage your personal information and account settings
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleCancel}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-green-200 active:scale-95"
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gray-900 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl -ml-24 -mb-24 rounded-full" />

                    <div className="relative flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt="Profile"
                                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 object-cover relative z-10 shadow-2xl"
                                />
                            ) : (
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white relative z-10 shadow-2xl">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            {isEditing && (
                                <>
                                    <label
                                        htmlFor="photo-upload"
                                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-all shadow-xl z-20 group-hover:scale-110 active:scale-95 border-2 border-white"
                                    >
                                        <Camera size={20} className="text-blue-600" />
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
                        <div className="flex-1 relative z-10 space-y-3">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{user?.name || 'User Name'}</h2>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-widest mt-2 backdrop-blur-sm">
                                    <Briefcase size={14} />
                                    {user?.designation || 'Recruiter'}
                                </div>
                            </div>
                            {isEditing && (profilePhoto || user?.profilePhoto) && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="block text-xs font-bold text-red-300 hover:text-red-200 uppercase tracking-widest transition-colors py-1"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="p-6 sm:p-10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono mb-8 flex items-center gap-2">
                        <div className="w-6 h-px bg-gray-200" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { label: 'Full Name', value: formData.name, key: 'name', icon: User, editable: true },
                            { label: 'Email Address', value: user?.email, key: 'email', icon: Mail, editable: false },
                            { label: 'Phone Number', value: formData.phone, key: 'phone', icon: Phone, editable: true, placeholder: 'Enter Phone Number' },
                            { label: 'Designation', value: user?.designation, key: 'designation', icon: Briefcase, editable: false },
                            { label: 'Department', value: formData.department, key: 'department', icon: MapPin, editable: true, placeholder: 'Enter Department' },
                            { label: 'Joining Date', value: formData.joinDate, key: 'joinDate', icon: Calendar, editable: true, type: 'date' },
                            { label: 'Date of Birth', value: formData.dateOfBirth, key: 'dateOfBirth', icon: Calendar, editable: true, type: 'date' },
                            { label: 'Personal Email', value: formData.personalEmail, key: 'personalEmail', icon: Mail, editable: true, placeholder: 'Enter Personal Email' },
                            { label: 'App Password', value: user?.appPassword, key: 'appPassword', icon: Shield, editable: true, placeholder: 'Enter App Password' }
                        ].map((field, idx) => (
                            <div key={idx} className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono ml-1">
                                    <field.icon size={14} className="text-gray-300" />
                                    {field.label}
                                </label>
                                {isEditing && field.editable ? (
                                    field.type === 'date' ? (
                                        <input
                                            type="date"
                                            value={field.value ? field.value.split('T')[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-sm font-bold text-gray-700 outline-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className="w-full px-5 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-sm font-bold text-gray-700 outline-none"
                                        />
                                    )
                                ) : (
                                    <div className="w-full px-5 py-3.5 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 shadow-inner">
                                        {field.type === 'date' ? (field.value ? formatDate(field.value) : 'Not provided') : (field.value || 'Not provided')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
