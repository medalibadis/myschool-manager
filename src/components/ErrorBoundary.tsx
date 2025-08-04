'use client';

import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} />;
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div className="mt-4 text-center">
                            <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </p>
                            <div className="mt-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function SupabaseErrorFallback({ error }: { error: Error }) {
    const isConnectionError = error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Supabase');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                    <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <div className="mt-4 text-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        {isConnectionError ? 'Database Connection Error' : 'Application Error'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {isConnectionError
                            ? 'Unable to connect to the database. Please check your internet connection and try again.'
                            : error.message
                        }
                    </p>
                    {isConnectionError && (
                        <div className="mt-4 text-xs text-gray-400">
                            <p>Make sure your Supabase environment variables are configured correctly.</p>
                            <p className="mt-1">Check the setup guide for more information.</p>
                        </div>
                    )}
                    <div className="mt-4 space-y-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 