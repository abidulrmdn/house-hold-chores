import { useMemo } from 'react'
import { TaskInstance, Routine, User as UserType } from '@/types'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, isSameDay, isToday, isPast, isFuture } from 'date-fns'
import { TrendingUp, Calendar, Award, Users, CheckCircle2 } from 'lucide-react'

interface StatisticsDashboardProps {
  tasks: TaskInstance[]
  routines: Routine[]
  users: UserType[]
  currentUserId?: string
}

export default function StatisticsDashboard({ tasks, routines, users, currentUserId }: StatisticsDashboardProps) {
  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Filter tasks for this week and month
    const weekTasks = tasks.filter(t => {
      const taskDate = new Date(t.dueDate)
      return taskDate >= weekStart && taskDate <= weekEnd
    })

    const monthTasks = tasks.filter(t => {
      const taskDate = new Date(t.dueDate)
      return taskDate >= monthStart && taskDate <= monthEnd
    })

    // Overall stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.isCompleted).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Week stats
    const weekCompleted = weekTasks.filter(t => t.isCompleted).length
    const weekCompletionRate = weekTasks.length > 0 ? (weekCompleted / weekTasks.length) * 100 : 0

    // Month stats
    const monthCompleted = monthTasks.filter(t => t.isCompleted).length
    const monthCompletionRate = monthTasks.length > 0 ? (monthCompleted / monthTasks.length) * 100 : 0

    // User stats
    const userStats = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.id)
      const userCompleted = userTasks.filter(t => t.isCompleted).length
      const userTotal = userTasks.length
      const userRate = userTotal > 0 ? (userCompleted / userTotal) * 100 : 0

      // Calculate current streak (consecutive completed tasks)
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      const sortedTasks = [...userTasks].sort((a, b) => b.dueDate - a.dueDate)
      
      for (const task of sortedTasks) {
        if (task.isCompleted) {
          tempStreak++
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak
          }
          if (currentStreak === 0 || isSameDay(new Date(task.dueDate), new Date(sortedTasks[sortedTasks.indexOf(task) - 1]?.dueDate || task.dueDate))) {
            currentStreak = tempStreak
          }
        } else {
          if (currentStreak === 0) {
            currentStreak = tempStreak
          }
          tempStreak = 0
        }
      }

      return {
        user,
        total: userTotal,
        completed: userCompleted,
        completionRate: userRate,
        currentStreak,
        longestStreak
      }
    })

    // Weekly completion chart data
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd })
    const weeklyData = weeks.map(week => {
      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.dueDate)
        return taskDate >= week && taskDate < endOfWeek(week, { weekStartsOn: 1 })
      })
      return {
        week: format(week, 'MMM d'),
        total: weekTasks.length,
        completed: weekTasks.filter(t => t.isCompleted).length
      }
    })

    // Task status breakdown
    const overdue = tasks.filter(t => !t.isCompleted && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length
    const today = tasks.filter(t => isToday(new Date(t.dueDate)) && !t.isCompleted).length
    const upcoming = tasks.filter(t => isFuture(new Date(t.dueDate)) && !t.isCompleted).length
    const completed = tasks.filter(t => t.isCompleted).length

    return {
      overall: {
        total: totalTasks,
        completed: completedTasks,
        rate: completionRate
      },
      week: {
        total: weekTasks.length,
        completed: weekCompleted,
        rate: weekCompletionRate
      },
      month: {
        total: monthTasks.length,
        completed: monthCompleted,
        rate: monthCompletionRate
      },
      userStats,
      weeklyData,
      statusBreakdown: {
        overdue,
        today,
        upcoming,
        completed
      }
    }
  }, [tasks, routines, users])

  return (
    <div className="space-y-6">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Completion</h3>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats.overall.rate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {stats.overall.completed} of {stats.overall.total} tasks
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.overall.rate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats.week.rate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {stats.week.completed} of {stats.week.total} tasks
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.week.rate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stats.month.rate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {stats.month.completed} of {stats.month.total} tasks
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.month.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.statusBreakdown.overdue}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.statusBreakdown.today}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.statusBreakdown.upcoming}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.statusBreakdown.completed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>
      </div>

      {/* User Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Performance
        </h3>
        <div className="space-y-4">
          {stats.userStats.map((userStat) => (
            <div key={userStat.user.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userStat.user.photoURL && (
                    <img 
                      src={userStat.user.photoURL} 
                      alt={userStat.user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {userStat.user.displayName || userStat.user.email}
                      {userStat.user.id === currentUserId && ' (You)'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userStat.completed} of {userStat.total} tasks completed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {userStat.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {userStat.currentStreak > 0 && `🔥 ${userStat.currentStreak} day streak`}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${userStat.completionRate}%` }}
                />
              </div>
              {(userStat.currentStreak > 0 || userStat.longestStreak > 0) && (
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {userStat.currentStreak > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Current: {userStat.currentStreak} days
                    </div>
                  )}
                  {userStat.longestStreak > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Longest: {userStat.longestStreak} days
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Completion</h3>
        <div className="space-y-3">
          {stats.weeklyData.map((week, index) => {
            const maxTasks = Math.max(...stats.weeklyData.map(w => w.total), 1)
            const completionRate = week.total > 0 ? (week.completed / week.total) * 100 : 0
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{week.week}</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {week.completed}/{week.total}
                  </span>
                </div>
                <div className="flex gap-1 h-6">
                  {/* Total tasks bar */}
                  <div 
                    className="bg-gray-200 dark:bg-gray-700 rounded"
                    style={{ width: `${(week.total / maxTasks) * 100}%` }}
                  />
                  {/* Completed overlay */}
                  {week.total > 0 && (
                    <div 
                      className="bg-green-500 rounded -ml-full"
                      style={{ width: `${(week.total / maxTasks) * 100}%` }}
                    >
                      <div 
                        className="bg-green-600 h-full rounded"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

