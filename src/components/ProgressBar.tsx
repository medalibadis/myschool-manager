import React from 'react';

interface ProgressBarProps {
    completed: number;
    total: number;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

export default function ProgressBar({
    completed,
    total,
    size = 'md',
    showText = true,
    className = ''
}: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 60) return 'bg-blue-500';
        if (percent >= 40) return 'bg-yellow-500';
        if (percent >= 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className={`w-full ${className}`}>
            {showText && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">
                        Sessions: {completed}/{total}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                        {percentage}%
                    </span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
                <div
                    className={`${getProgressColor(percentage)} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
} 