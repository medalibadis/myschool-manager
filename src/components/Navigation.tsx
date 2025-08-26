'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import {
    AcademicCapIcon,
    UserGroupIcon,
    CalendarIcon,
    UsersIcon,
    ClockIcon,
    ArrowRightOnRectangleIcon,
    UserIcon,
    Bars3Icon,
    XMarkIcon,
    PhoneIcon,
    ShieldCheckIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isSuperuser } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: AcademicCapIcon },
        { name: 'Registration', href: '/waiting-list', icon: ClockIcon },
        { name: 'Groups', href: '/groups', icon: UserGroupIcon },
        { name: 'Students', href: '/students', icon: UsersIcon },
        { name: 'Teachers', href: '/teachers', icon: UserIcon },
        { name: 'Attendance', href: '/attendance', icon: CalendarIcon },
        { name: 'Call Logs', href: '/call-logs', icon: PhoneIcon },
        { name: 'Payments', href: '/payments', icon: CreditCardIcon },
    ];

    // Add superuser dashboard link for Raouf
    if (isSuperuser) {
        navigation.push({ name: 'Superuser', href: '/superuser', icon: ShieldCheckIcon });
    }

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white shadow-lg"
                >
                    {sidebarOpen ? (
                        <XMarkIcon className="h-5 w-5" />
                    ) : (
                        <Bars3Icon className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 w-16 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 border-b border-gray-200">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group relative flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-orange-100 text-orange-600 shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    title={item.name}
                                >
                                    <item.icon className="h-6 w-6" />

                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                        {item.name}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info and Logout */}
                    <div className="px-2 py-1 border-t border-gray-200">
                        {user && (
                            <div className="mb-2">
                                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="mt-1 text-xs text-center text-gray-500 truncate px-1">
                                    {user.name}
                                </div>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="w-12 h-12 mx-auto p-0 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                            title="Logout"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content wrapper */}
            <div className="lg:ml-16">
                {/* This div ensures content is pushed to the right on desktop */}
            </div>
        </>
    );
};

export default Navigation; 