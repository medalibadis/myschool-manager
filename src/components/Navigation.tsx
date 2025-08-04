'use client';

import React from 'react';
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
} from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: AcademicCapIcon },
        { name: 'Groups', href: '/groups', icon: UserGroupIcon },
        { name: 'Teachers', href: '/teachers', icon: UsersIcon },
        { name: 'Attendance', href: '/attendance', icon: CalendarIcon },
        { name: 'Waiting List', href: '/waiting-list', icon: ClockIcon },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-orange-600">MySchool Manager</h1>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Info and Logout */}
                    <div className="flex items-center space-x-4">
                        {user && (
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <UserIcon className="h-4 w-4" />
                                <span>Welcome, {user.name}</span>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="flex items-center space-x-2"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 