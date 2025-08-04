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
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Dashboard() {
  const { groups, teachers } = useMySchoolStore();

  const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);

  const stats = [
    {
      name: 'Total Groups',
      value: groups.length,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Teachers',
      value: teachers.length,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Students',
      value: totalStudents,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to MySchool Manager. Here&apos;s an overview of your educational groups.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to help you manage your school
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/groups/new">
                    <Button className="w-full justify-start">
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create New Group
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

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groups.slice(0, 3).map((group) => (
                    <div key={group.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">{group.students.length} students</p>
                      </div>
                      <Link href={`/groups/${group.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-sm text-gray-500">No groups created yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
