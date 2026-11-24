import { Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Please log in to view your profile.
          </p>
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const infoItems = [
    {
      icon: User,
      label: 'Name',
      value: user.name,
    },
    {
      icon: Mail,
      label: 'Email',
      value: user.email,
    },
    {
      icon: Shield,
      label: 'Role',
      value: isAdmin ? 'Administrator' : 'Customer',
      badge: true,
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : '—',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        My Profile
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Avatar & Name Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
            {user.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'U'}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">{user.name}</h2>
          <p className="mt-1 text-sm text-indigo-100">{user.email}</p>
        </div>

        {/* Info Items */}
        <div className="divide-y divide-gray-100">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 px-6 py-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {item.label}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {item.value}
                  </p>
                  {item.badge && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isAdmin ? 'Admin' : 'Customer'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Package className="w-4 h-4" />
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
