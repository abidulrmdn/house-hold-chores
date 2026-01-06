import { useMemo } from 'react'
import { TaskInstance, Routine, User as UserType } from '@/types'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, isSameDay, isToday, isPast, isFuture, subDays, eachDayOfInterval } from 'date-fns'
import { TrendingUp, Calendar, Award, Users, CheckCircle2, Zap, Activity } from 'lucide-react'

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

    // Efficiency Score Calculation
    // Factors: completion rate (40%), on-time completion (30%), consistency (20%), streak bonus (10%)
    const onTimeTasks = tasks.filter(t => {
      if (!t.isCompleted) return false
      const dueDate = new Date(t.dueDate)
      const completedDate = t.completedDate ? new Date(t.completedDate) : null
      if (!completedDate) return false
      // Completed on or before due date
      return completedDate <= dueDate || isSameDay(completedDate, dueDate)
    }).length
    
    const onTimeRate = completed > 0 ? (onTimeTasks / completed) * 100 : 0
    
    // Consistency: variance in daily completion (lower variance = higher consistency)
    const dailyCompletions: Record<string, number> = {}
    tasks.filter(t => t.isCompleted && t.completedDate).forEach(t => {
      const dateKey = format(new Date(t.completedDate!), 'yyyy-MM-dd')
      dailyCompletions[dateKey] = (dailyCompletions[dateKey] || 0) + 1
    })
    const completionValues = Object.values(dailyCompletions)
    const avgDaily = completionValues.length > 0 
      ? completionValues.reduce((a, b) => a + b, 0) / completionValues.length 
      : 0
    const variance = completionValues.length > 0
      ? completionValues.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / completionValues.length
      : 0
    const consistencyScore = Math.max(0, 100 - (variance * 10)) // Lower variance = higher score
    
    // Streak bonus (from user stats)
    const maxStreak = Math.max(...userStats.map(u => u.currentStreak), 0)
    const streakBonus = Math.min(maxStreak * 2, 20) // Max 20 points for streaks
    
    const efficiencyScore = Math.round(
      (completionRate * 0.4) +
      (onTimeRate * 0.3) +
      (consistencyScore * 0.2) +
      (streakBonus * 0.1)
    )

    // Completion Heatmap Data (last 90 days)
    const heatmapStart = subDays(now, 89)
    const heatmapDays = eachDayOfInterval({ start: heatmapStart, end: now })
    const heatmapData = heatmapDays.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayTasks = tasks.filter(t => {
        if (!t.isCompleted || !t.completedDate) return false
        return isSameDay(new Date(t.completedDate), day)
      })
      const completedCount = dayTasks.length
      
      // Intensity levels: 0-1 tasks = level 1, 2-3 = level 2, 4-5 = level 3, 6+ = level 4
      let intensity = 0
      if (completedCount > 0) intensity = 1
      if (completedCount >= 2) intensity = 2
      if (completedCount >= 4) intensity = 3
      if (completedCount >= 6) intensity = 4
      
      return {
        date: day,
        dateKey: dayKey,
        count: completedCount,
        intensity
      }
    })

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
      },
      efficiency: {
        score: efficiencyScore,
        completionRate,
        onTimeRate,
        consistencyScore,
        streakBonus
      },
      heatmapData
    }
  }, [tasks, routines, users])

  return (
    <div className="space-y-6">
      {/* Efficiency Score Card */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 shadow-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Efficiency Score</h2>
              <p className="text-purple-100 text-sm">Based on completion rate, timeliness, consistency, and streaks</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{stats.efficiency.score}</div>
            <div className="text-purple-100 text-sm">out of 100</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-purple-100 mb-1">Completion Rate</div>
            <div className="text-xl font-bold">{stats.efficiency.completionRate.toFixed(0)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-purple-100 mb-1">On-Time Rate</div>
            <div className="text-xl font-bold">{stats.efficiency.onTimeRate.toFixed(0)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-purple-100 mb-1">Consistency</div>
            <div className="text-xl font-bold">{stats.efficiency.consistencyScore.toFixed(0)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs text-purple-100 mb-1">Streak Bonus</div>
            <div className="text-xl font-bold">+{stats.efficiency.streakBonus.toFixed(0)}</div>
          </div>
        </div>
      </div>

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

      {/* Completion Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Completion Heatmap (Last 90 Days)
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {stats.heatmapData.map((day) => {
              const bgColors = [
                'bg-gray-100 dark:bg-gray-700', // 0 tasks
                'bg-green-200 dark:bg-green-900', // 1 task
                'bg-green-400 dark:bg-green-700', // 2-3 tasks
                'bg-green-600 dark:bg-green-500', // 4-5 tasks
                'bg-green-800 dark:bg-green-400' // 6+ tasks
              ]
              
              return (
                <div
                  key={day.dateKey}
                  className={`w-3 h-3 rounded-sm ${bgColors[day.intensity]} hover:scale-125 transition-transform cursor-help`}
                  title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} task${day.count !== 1 ? 's' : ''} completed`}
                />
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
              <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
              <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-400" />
            </div>
            <span>More</span>
          </div>
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

