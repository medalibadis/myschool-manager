import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AcademicCapIcon,
    UserGroupIcon,
    CalendarIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: AcademicCapIcon },
        { name: 'Groups', href: '/groups', icon: UserGroupIcon },
        { name: 'Teachers', href: '/teachers', icon: UsersIcon },
        { name: 'Attendance', href: '/attendance', icon: CalendarIcon },
    ];

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
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 