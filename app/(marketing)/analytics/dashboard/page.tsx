import type { Metadata } from 'next'
import { DashboardPreview } from '@/components/sections/DashboardPreview'
import type { DashboardConfig } from '@/lib/cms/types'

export const metadata: Metadata = {
  title: 'Campaign Attribution Dashboard'
}

const dashboard: DashboardConfig = {
  headline: 'Monitor performance in real time',
  subheadline: 'Share dashboards with marketing leadership and partners to prove full-funnel impact.',
  widgets: [
    {
      title: 'Pipeline influence',
      description: 'Closed and forecasted listings by channel',
      chartType: 'bar',
      labels: ['Direct Mail', 'Paid Social', 'CTV', 'Retargeting'],
      dataset: [
        {
          label: 'Influenced volume ()',
          data: [2.3, 1.6, 1.1, 0.8],
          backgroundColor: ['#0BADD5', '#FF564F', '#051B35', '#4DD4AC']
        }
      ]
    },
    {
      title: 'Demo requests',
      description: 'Weekly demo requests from SmartLead campaigns',
      chartType: 'line',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      dataset: [
        { label: 'Demo requests', data: [14, 19, 25, 31], backgroundColor: ['#0BADD5'] }
      ]
    },
    {
      title: 'Lead quality mix',
      description: 'Share of leads by seller readiness stage',
      chartType: 'doughnut',
      labels: ['Hot', 'Warm', 'Nurture'],
      dataset: [
        { label: 'Lead mix', data: [42, 33, 25], backgroundColor: ['#FF564F', '#0BADD5', '#4DD4AC'] }
      ]
    }
  ]
}

export default function DashboardPage() {
  return <DashboardPreview config={dashboard} />
}
