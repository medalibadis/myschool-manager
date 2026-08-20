'use client';

import React from 'react';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useMySchoolStore } from '../store';
import AuthGuard from '../components/AuthGuard';
import {
  UserGroupIcon,
  UsersIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Dashboard() {
  const { groups, teachers } = useMySchoolStore();

  const activeGroups = groups.filter(g => {
    const completed = g.progress?.completedSessions || 0;
    return g.isActive !== false && completed < g.totalSessions;
  });

  const inactiveGroups = groups.filter(g => {
    const completed = g.progress?.completedSessions || 0;
    return g.isActive === false || completed >= g.totalSessions;
  });

  const activeStudentsCount = activeGroups.reduce((sum, group) => sum + group.students.length, 0);

  const stats = [
    {
      name: 'Active Groups',
      value: activeGroups.length,
      subtext: `${inactiveGroups.length} finished / inactive`,
      icon: UserGroupIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Total Teachers',
      value: teachers.length,
      subtext: 'Active staff',
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Students',
      value: activeStudentsCount,
      subtext: 'Enrolled in active groups',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="lg:ml-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome to MySchool Manager. Here&apos;s an overview of your active educational groups.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.name} className="border border-gray-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        {stat.subtext && (
                          <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions & Recent Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks to help you manage your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/groups/new">
                      <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Group
                      </Button>
                    </Link>
                    <Link href="/waiting-list">
                      <Button variant="outline" className="w-full justify-start">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add New Student
                      </Button>
                    </Link>
                    <Link href="/teachers/new">
                      <Button variant="outline" className="w-full justify-start">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add New Teacher
                      </Button>
                    </Link>
                    <Link href="/attendance">
                      <Button variant="outline" className="w-full justify-start">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Manage Attendance
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Active Groups</CardTitle>
                    <CardDescription>
                      Groups currently in progress
                    </CardDescription>
                  </div>
                  <Link href="/groups" className="text-xs font-semibold text-orange-600 hover:text-orange-800">
                    View All ({groups.length}) →
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(activeGroups.length > 0 ? activeGroups.slice(0, 4) : groups.slice(0, 4)).map((group) => {
                      const isCompleted = (group.progress?.completedSessions || 0) >= group.totalSessions;
                      return (
                        <div key={group.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{group.name}</p>
                              {isCompleted ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Finished
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {group.students.length} students • {group.progress?.completedSessions || 0}/{group.totalSessions} sessions
                            </p>
                          </div>
                          <Link href={`/groups/${group.id}`}>
                            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                              View
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                    {groups.length === 0 && (
                      <p className="text-sm text-gray-500 py-4 text-center">No groups created yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
