'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/page-layout'
import { WidgetRenderer } from '@/registry/blocks/widgets/widget-renderer'
import type { Widget, WidgetAction, WidgetFormData } from '@/registry/blocks/widgets/types'
import type { TocItem } from '@/registry/blocks/table-of-contents/table-of-contents'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Code } from 'lucide-react'
import { CodeBlock, CompactCodeBlock } from '@/registry/blocks/code-block/code-block'

const tocItems: TocItem[] = [
  { id: 'demo', title: 'how it works' },
  { id: 'gallery', title: 'gallery' },
  { id: 'real-world', title: 'real-world examples' },
  { id: 'text', title: 'text & content' },
  { id: 'layout', title: 'layout' },
  { id: 'forms', title: 'form elements' },
  { id: 'backgrounds', title: 'backgrounds' },
  { id: 'actions', title: 'actions' },
  { id: 'installation', title: 'installation' },
  { id: 'usage', title: 'usage' },
]

const usageCode = `import { WidgetRenderer } from '@/components/widgets/widget-renderer'
import type { Widget, WidgetAction } from '@/registry/blocks/widgets/types'

export function MyWidget() {
  const widget: Widget = {
    type: 'ui',
    title: 'Hello',
    children: [
      { type: 'text', value: 'Welcome to widgets!' },
      {
        type: 'button',
        label: 'Click me',
        onClickAction: { type: 'greet' }
      },
    ],
  }

  const handleAction = (action: WidgetAction) => {
    console.log('Action triggered:', action)
  }

  return <WidgetRenderer widget={widget} onAction={handleAction} />
}`

// Widget example wrapper with collapsible data view
function WidgetExample({
  title,
  description,
  widget,
  onAction,
}: {
  title: string
  description?: string
  widget: Widget
  onAction: (action: WidgetAction, formData?: WidgetFormData) => void
}) {
  const [showData, setShowData] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <button
          onClick={() => setShowData(!showData)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Code className="h-3 w-3" />
          {showData ? 'hide' : 'show'} data
          {showData ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </div>
      <div className={cn("grid", showData ? "md:grid-cols-2" : "grid-cols-1")}>
        <div className="p-4">
          <WidgetRenderer widget={widget} onAction={onAction} />
        </div>
        {showData && (
          <div className="border-t md:border-t-0 md:border-l bg-muted/30 max-h-[300px] overflow-y-auto">
            <CompactCodeBlock language="json">
              {JSON.stringify(widget, null, 2)}
            </CompactCodeBlock>
          </div>
        )}
      </div>
    </div>
  )
}

// Gallery widgets - smaller cards showing variety (all same width)
const galleryWidgets: Widget[] = [
  // Stock ticker
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: 4, radius: 'lg', children: [
          {
            type: 'row', justify: 'between', align: 'center', children: [
              {
                type: 'col', gap: 0, children: [
                  { type: 'caption', value: 'AAPL' },
                  { type: 'title', value: '$178.72', size: 'xl', weight: 'bold' },
                ]
              },
              { type: 'badge', label: '+2.4%', variant: 'secondary' },
            ]
          },
          { type: 'caption', value: 'Apple Inc. • NASDAQ' },
        ]
      },
    ],
  },
  // Music player mini
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-purple', padding: 4, radius: 'lg', children: [
          {
            type: 'row', gap: 3, align: 'center', children: [
              { type: 'image', src: 'https://picsum.photos/seed/album/60/60', alt: 'Album', width: 48, height: 48 },
              {
                type: 'col', gap: 0, children: [
                  { type: 'text', value: 'Blinding Lights', variant: 'bold' },
                  { type: 'caption', value: 'The Weeknd' },
                ]
              },
            ]
          },
          {
            type: 'row', justify: 'center', gap: 3, children: [
              { type: 'button', label: '⏮', variant: 'ghost', onClickAction: { type: 'prev' } },
              { type: 'button', label: '▶', variant: 'secondary', onClickAction: { type: 'play' } },
              { type: 'button', label: '⏭', variant: 'ghost', onClickAction: { type: 'next' } },
            ]
          },
        ]
      },
    ],
  },
  // Notification card
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'surface-secondary', padding: 3, radius: 'lg', children: [
          {
            type: 'row', gap: 3, align: 'start', children: [
              { type: 'icon', iconName: '🔔', size: 'lg' },
              {
                type: 'col', gap: 1, children: [
                  { type: 'text', value: 'New comment on your post', variant: 'bold' },
                  { type: 'caption', value: 'Sarah replied: "This looks amazing!"' },
                  { type: 'caption', value: '2 minutes ago' },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
  // Profile card
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-cool', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 2, children: [
              { type: 'image', src: 'https://picsum.photos/seed/avatar/80/80', alt: 'Avatar', width: 64, height: 64 },
              { type: 'title', value: 'Alex Chen', size: 'lg' },
              { type: 'caption', value: 'Product Designer' },
              {
                type: 'row', gap: 4, children: [
                  { type: 'col', align: 'center', gap: 0, children: [{ type: 'text', value: '142', variant: 'bold' }, { type: 'caption', value: 'posts' }] },
                  { type: 'col', align: 'center', gap: 0, children: [{ type: 'text', value: '8.2k', variant: 'bold' }, { type: 'caption', value: 'followers' }] },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
  // Order confirmation
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'surface-secondary', padding: 4, radius: 'lg', children: [
          {
            type: 'col', gap: 3, children: [
              {
                type: 'row', gap: 2, align: 'center', children: [
                  { type: 'icon', iconName: '✓', size: 'lg' },
                  { type: 'title', value: 'Order Confirmed', size: 'lg' },
                ]
              },
              { type: 'divider' },
              {
                type: 'row', justify: 'between', children: [
                  { type: 'caption', value: 'Order #' },
                  { type: 'text', value: '#ORD-2847', variant: 'bold' },
                ]
              },
              {
                type: 'row', justify: 'between', children: [
                  { type: 'caption', value: 'Delivery' },
                  { type: 'text', value: 'Jan 24, 2-4pm' },
                ]
              },
              {
                type: 'row', justify: 'between', children: [
                  { type: 'caption', value: 'Total' },
                  { type: 'title', value: '$84.50', size: 'md', weight: 'bold' },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
  // Weather mini
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 1, children: [
              { type: 'icon', iconName: '☀️', size: 'lg' },
              { type: 'title', value: '24°C', size: '2xl', weight: 'bold' },
              { type: 'caption', value: 'Sunny' },
              { type: 'caption', value: 'San Francisco' },
            ]
          },
        ]
      },
    ],
  },
  // Stats card
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-warm', padding: 4, radius: 'lg', children: [
          {
            type: 'col', gap: 2, children: [
              { type: 'caption', value: 'MONTHLY REVENUE' },
              {
                type: 'row', align: 'baseline', gap: 2, children: [
                  { type: 'title', value: '$48,290', size: '2xl', weight: 'bold' },
                  { type: 'badge', label: '+12%', variant: 'secondary' },
                ]
              },
              { type: 'caption', value: 'vs $43,120 last month' },
            ]
          },
        ]
      },
    ],
  },
  // Timer card
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-midnight', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 2, children: [
              { type: 'caption', value: 'FOCUS TIME' },
              { type: 'title', value: '24:59', size: '3xl', weight: 'bold' },
              {
                type: 'row', gap: 2, children: [
                  { type: 'button', label: 'Pause', variant: 'outline', onClickAction: { type: 'pause' } },
                  { type: 'button', label: 'Reset', variant: 'ghost', onClickAction: { type: 'reset' } },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
  // Ride ETA
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'surface-secondary', padding: 4, radius: 'lg', children: [
          {
            type: 'row', justify: 'between', align: 'center', children: [
              {
                type: 'col', gap: 1, children: [
                  { type: 'title', value: '3 min', size: 'xl', weight: 'bold' },
                  { type: 'caption', value: 'Driver arriving' },
                ]
              },
              { type: 'image', src: 'https://picsum.photos/seed/driver/50/50', alt: 'Driver', width: 44, height: 44 },
            ]
          },
          { type: 'divider' },
          {
            type: 'row', justify: 'between', children: [
              { type: 'caption', value: 'Pickup' },
              { type: 'text', value: '123 Main St' },
            ]
          },
          {
            type: 'row', gap: 2, justify: 'end', children: [
              { type: 'button', label: 'Contact', variant: 'outline', onClickAction: { type: 'contact' } },
              { type: 'button', label: 'Cancel', variant: 'ghost', onClickAction: { type: 'cancel' } },
            ]
          },
        ]
      },
    ],
  },
  // Booking confirmation
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-ocean', padding: 4, radius: 'lg', children: [
          {
            type: 'col', gap: 2, children: [
              {
                type: 'row', gap: 2, align: 'center', children: [
                  { type: 'icon', iconName: '✈️', size: 'lg' },
                  { type: 'title', value: 'Flight Booked', size: 'lg' },
                ]
              },
              { type: 'divider' },
              {
                type: 'row', justify: 'between', align: 'center', children: [
                  { type: 'col', gap: 0, children: [{ type: 'title', value: 'SFO', size: 'xl' }, { type: 'caption', value: '10:30 AM' }] },
                  { type: 'caption', value: '→' },
                  { type: 'col', gap: 0, align: 'end', children: [{ type: 'title', value: 'NYC', size: 'xl' }, { type: 'caption', value: '6:45 PM' }] },
                ]
              },
              { type: 'caption', value: 'United Airlines • UA 234 • Jan 28' },
            ]
          },
        ]
      },
    ],
  },
  // Payment success
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: 4, radius: 'lg', children: [
          {
            type: 'col', align: 'center', gap: 2, children: [
              { type: 'icon', iconName: '✓', size: 'lg' },
              { type: 'title', value: 'Payment Sent', size: 'lg', weight: 'bold' },
              { type: 'title', value: '$250.00', size: '2xl', weight: 'bold' },
              { type: 'caption', value: 'to @johndoe' },
            ]
          },
        ]
      },
    ],
  },
  // Meeting reminder
  {
    type: 'ui',
    children: [
      {
        type: 'box', background: 'gradient-sunset', padding: 4, radius: 'lg', children: [
          {
            type: 'row', gap: 3, align: 'start', children: [
              {
                type: 'col', gap: 0, align: 'center', minWidth: 50, children: [
                  { type: 'title', value: 'MON', size: 'sm' },
                  { type: 'title', value: '24', size: '2xl', weight: 'bold' },
                ]
              },
              {
                type: 'col', gap: 1, children: [
                  { type: 'title', value: 'Design Review', size: 'md', weight: 'bold' },
                  { type: 'caption', value: '2:00 PM - 3:00 PM' },
                  { type: 'caption', value: 'Zoom • 4 attendees' },
                ]
              },
            ]
          },
          {
            type: 'row', gap: 2, justify: 'end', children: [
              { type: 'button', label: 'Join', variant: 'secondary', onClickAction: { type: 'join' } },
            ]
          },
        ]
      },
    ],
  },
]

// Real-world demo widgets
const realWorldExamples: { title: string; description: string; widget: Widget }[] = [
  {
    title: 'flight tracker',
    description: 'real-time flight status card with minHeight',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'box', background: 'gradient-ocean', padding: 4, radius: 'lg', children: [
            {
              type: 'row', justify: 'between', align: 'start', children: [
                {
                  type: 'col', gap: 1, children: [
                    { type: 'caption', value: 'DEPARTURE' },
                    { type: 'title', value: 'SFO', size: '2xl', weight: 'bold' },
                    { type: 'text', value: 'San Francisco' },
                  ]
                },
                {
                  type: 'col', gap: 1, align: 'center', children: [
                    { type: 'icon', iconName: '✈️', size: 'lg' },
                    { type: 'caption', value: '5h 45m' },
                    { type: 'badge', label: 'on time', variant: 'secondary' },
                  ]
                },
                {
                  type: 'col', gap: 1, align: 'end', children: [
                    { type: 'caption', value: 'ARRIVAL' },
                    { type: 'title', value: 'JFK', size: '2xl', weight: 'bold' },
                    { type: 'text', value: 'New York' },
                  ]
                },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'weather forecast',
    description: 'current conditions with minHeight',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'box', background: 'gradient-cool', padding: 4, radius: 'lg', children: [
            {
              type: 'row', justify: 'between', align: 'start', children: [
                {
                  type: 'col', gap: 1, children: [
                    { type: 'title', value: 'San Francisco', size: 'lg' },
                    { type: 'caption', value: 'Partly Cloudy' },
                    { type: 'title', value: '68°', size: '3xl', weight: 'bold' },
                  ]
                },
                {
                  type: 'col', align: 'end', gap: 1, children: [
                    { type: 'icon', iconName: '⛅', size: 'lg' },
                    { type: 'caption', value: 'H: 72° L: 58°' },
                  ]
                },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'task checklist',
    description: 'interactive to-do list with button actions',
    widget: {
      type: 'ui',
      title: 'Today\'s Tasks',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'checkbox', name: 'task1', label: 'Review pull requests', defaultChecked: true },
            { type: 'checkbox', name: 'task2', label: 'Deploy to staging', defaultChecked: true },
            { type: 'checkbox', name: 'task3', label: 'Write documentation' },
            { type: 'checkbox', name: 'task4', label: 'Team standup at 10am' },
            { type: 'divider' },
            {
              type: 'row', gap: 2, justify: 'end', children: [
                { type: 'button', label: 'Add Task', variant: 'outline', onClickAction: { type: 'add-task' } },
                { type: 'button', label: 'Save Progress', variant: 'default', onClickAction: { type: 'save-tasks', loadingBehavior: 'self' } },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'email composer',
    description: 'draft email with form fields',
    widget: {
      type: 'ui',
      title: 'New Email',
      asForm: true,
      children: [
        {
          type: 'col', gap: 3, children: [
            {
              type: 'row', gap: 2, align: 'center', children: [
                { type: 'caption', value: 'FROM' },
                { type: 'text', value: 'you@company.com', variant: 'muted' },
              ]
            },
            { type: 'divider' },
            {
              type: 'row', gap: 2, align: 'center', children: [
                { type: 'caption', value: 'TO' },
                { type: 'input', name: 'to', placeholder: 'recipient@example.com', defaultValue: 'team@acme.co' },
              ]
            },
            { type: 'divider' },
            {
              type: 'row', gap: 2, align: 'center', children: [
                { type: 'caption', value: 'SUBJECT' },
                { type: 'input', name: 'subject', placeholder: 'Email subject', defaultValue: 'Q1 Planning Update' },
              ]
            },
            { type: 'divider' },
            { type: 'textarea', name: 'body', placeholder: 'Write your message...', rows: 5, defaultValue: 'Hi team,\n\nJust wanted to share the latest updates on our Q1 planning...' },
            {
              type: 'row', gap: 2, justify: 'end', children: [
                { type: 'button', label: 'Discard', variant: 'ghost', onClickAction: { type: 'discard' } },
                { type: 'button', label: 'Send', variant: 'default', onClickAction: { type: 'send-email', loadingBehavior: 'self' } },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'calendar event',
    description: 'event creation with date and time',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 4, align: 'start', children: [
            {
              type: 'col', gap: 1, minWidth: 80, children: [
                { type: 'caption', value: 'FRIDAY' },
                { type: 'title', value: '28', size: '3xl', weight: 'bold' },
              ]
            },
            {
              type: 'col', gap: 2, children: [
                {
                  type: 'box', background: 'surface-secondary', padding: 3, radius: 'lg', children: [
                    {
                      type: 'row', gap: 3, align: 'center', children: [
                        { type: 'box', background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)', padding: 0, radius: 'full', minWidth: 4, minHeight: 40, children: [] },
                        {
                          type: 'col', gap: 0, children: [
                            { type: 'text', value: 'Lunch', variant: 'bold' },
                            { type: 'caption', value: '12:00 - 12:45 PM' },
                          ]
                        },
                      ]
                    },
                  ]
                },
                {
                  type: 'box', background: 'transparent', padding: 3, radius: 'lg', children: [
                    {
                      type: 'row', gap: 3, align: 'center', children: [
                        { type: 'box', background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)', padding: 0, radius: 'full', minWidth: 4, minHeight: 40, children: [] },
                        {
                          type: 'col', gap: 0, children: [
                            { type: 'text', value: 'Q1 Roadmap Review', variant: 'bold' },
                            { type: 'caption', value: '1:00 - 2:00 PM' },
                          ]
                        },
                      ]
                    },
                  ]
                },
                {
                  type: 'box', background: 'surface-secondary', padding: 3, radius: 'lg', children: [
                    {
                      type: 'row', gap: 3, align: 'center', children: [
                        { type: 'box', background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)', padding: 0, radius: 'full', minWidth: 4, minHeight: 40, children: [] },
                        {
                          type: 'col', gap: 0, children: [
                            { type: 'text', value: 'Team Standup', variant: 'bold' },
                            { type: 'caption', value: '3:30 - 4:00 PM' },
                          ]
                        },
                      ]
                    },
                  ]
                },
              ]
            },
          ]
        },
        { type: 'divider' },
        {
          type: 'row', gap: 2, justify: 'end', children: [
            { type: 'button', label: 'Add to Calendar', variant: 'default', onClickAction: { type: 'add-to-calendar', loadingBehavior: 'self' } },
          ]
        },
      ],
    },
  },
  {
    title: 'shopping cart',
    description: 'order summary with items and totals',
    widget: {
      type: 'ui',
      title: 'Your Order',
      children: [
        {
          type: 'col', gap: 3, children: [
            {
              type: 'row', gap: 3, align: 'center', children: [
                { type: 'image', src: 'https://picsum.photos/seed/boba1/60/60', alt: 'Item', width: 48, height: 48 },
                {
                  type: 'col', gap: 0, children: [
                    { type: 'text', value: 'Brown Sugar Latte', variant: 'bold' },
                    { type: 'caption', value: 'Large • Oat Milk • Less Ice' },
                  ]
                },
                { type: 'text', value: '$6.50' },
              ]
            },
            {
              type: 'row', gap: 3, align: 'center', children: [
                { type: 'image', src: 'https://picsum.photos/seed/boba2/60/60', alt: 'Item', width: 48, height: 48 },
                {
                  type: 'col', gap: 0, children: [
                    { type: 'text', value: 'Taro Milk Tea', variant: 'bold' },
                    { type: 'caption', value: 'Medium • Regular Sugar' },
                  ]
                },
                { type: 'text', value: '$5.75' },
              ]
            },
            { type: 'divider' },
            {
              type: 'row', justify: 'between', children: [
                { type: 'caption', value: 'Subtotal' },
                { type: 'text', value: '$12.25' },
              ]
            },
            {
              type: 'row', justify: 'between', children: [
                { type: 'caption', value: 'Tax' },
                { type: 'text', value: '$1.07' },
              ]
            },
            {
              type: 'row', justify: 'between', children: [
                { type: 'text', value: 'Total', variant: 'bold' },
                { type: 'title', value: '$13.32', size: 'lg', weight: 'bold' },
              ]
            },
            { type: 'button', label: 'Place Order', variant: 'default', onClickAction: { type: 'place-order', loadingBehavior: 'self' } },
          ]
        },
      ],
    },
  },
]

// Text examples
const textExamples: { title: string; widget: Widget }[] = [
  {
    title: 'text variants',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'text', value: 'Default text - standard body copy' },
            { type: 'text', value: 'Bold text variant', variant: 'bold' },
            { type: 'text', value: 'Muted text for secondary info', variant: 'muted' },
          ]
        },
      ],
    },
  },
  {
    title: 'title sizes',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'title', value: 'Small (sm)', size: 'sm' },
            { type: 'title', value: 'Medium (md)', size: 'md' },
            { type: 'title', value: 'Large (lg)', size: 'lg' },
            { type: 'title', value: 'Extra Large (xl)', size: 'xl' },
          ]
        },
      ],
    },
  },
  {
    title: 'badges',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 2, children: [
            { type: 'badge', label: 'default', variant: 'default' },
            { type: 'badge', label: 'secondary', variant: 'secondary' },
            { type: 'badge', label: 'outline', variant: 'outline' },
            { type: 'badge', label: 'destructive', variant: 'destructive' },
          ]
        },
      ],
    },
  },
]

// Layout examples
const layoutExamples: { title: string; widget: Widget }[] = [
  {
    title: 'row - horizontal layout',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 2, children: [
            { type: 'badge', label: 'A' },
            { type: 'badge', label: 'B' },
            { type: 'badge', label: 'C' },
          ]
        },
      ],
    },
  },
  {
    title: 'box - container with background',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 2, children: [
            {
              type: 'box', background: 'surface-secondary', padding: 3, radius: 'md', children: [
                { type: 'text', value: 'Surface' },
              ]
            },
            {
              type: 'box', background: 'gradient-purple', padding: 3, radius: 'md', children: [
                { type: 'text', value: 'Gradient' },
              ]
            },
          ]
        },
      ],
    },
  },
]

// Form examples
const formExamples: { title: string; widget: Widget }[] = [
  {
    title: 'input',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'label', value: 'Username', fieldName: 'username' },
            { type: 'input', name: 'username', placeholder: 'Enter your username' },
          ]
        },
      ],
    },
  },
  {
    title: 'select',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'label', value: 'Country', fieldName: 'country' },
            {
              type: 'select', name: 'country', placeholder: 'Select a country', options: [
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'checkbox',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            { type: 'checkbox', name: 'agree', label: 'I agree to the terms of service' },
            { type: 'checkbox', name: 'newsletter', label: 'Subscribe to newsletter', defaultChecked: true },
          ]
        },
      ],
    },
  },
]

// Background examples
const backgroundExamples: { title: string; widget: Widget }[] = [
  {
    title: 'gradient presets',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 2, children: [
            {
              type: 'row', gap: 2, children: [
                {
                  type: 'box', background: 'gradient-blue', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'blue' },
                  ]
                },
                {
                  type: 'box', background: 'gradient-purple', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'purple' },
                  ]
                },
                {
                  type: 'box', background: 'gradient-warm', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'warm' },
                  ]
                },
              ]
            },
            {
              type: 'row', gap: 2, children: [
                {
                  type: 'box', background: 'gradient-cool', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'cool' },
                  ]
                },
                {
                  type: 'box', background: 'gradient-sunset', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'sunset' },
                  ]
                },
                {
                  type: 'box', background: 'gradient-midnight', padding: 3, radius: 'md', children: [
                    { type: 'text', value: 'midnight' },
                  ]
                },
              ]
            },
          ]
        },
      ],
    },
  },
]

// Action examples
const actionExamples: { title: string; description?: string; widget: Widget }[] = [
  {
    title: 'button variants',
    description: 'buttons with onClickAction',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 2, children: [
            { type: 'button', label: 'Default', variant: 'default', onClickAction: { type: 'default' } },
            { type: 'button', label: 'Secondary', variant: 'secondary', onClickAction: { type: 'secondary' } },
            { type: 'button', label: 'Outline', variant: 'outline', onClickAction: { type: 'outline' } },
            { type: 'button', label: 'Ghost', variant: 'ghost', onClickAction: { type: 'ghost' } },
          ]
        },
      ],
    },
  },
  {
    title: 'loading behavior',
    description: 'buttons show loading state during action execution',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'col', gap: 3, children: [
            { type: 'text', value: 'loadingBehavior: "self" shows spinner on the clicked button' },
            {
              type: 'row', gap: 2, children: [
                { type: 'button', label: 'Save', variant: 'default', onClickAction: { type: 'save', loadingBehavior: 'self' } },
                { type: 'button', label: 'Delete', variant: 'destructive', onClickAction: { type: 'delete', loadingBehavior: 'self' } },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'action with payload',
    description: 'actions can include data payloads',
    widget: {
      type: 'ui',
      children: [
        {
          type: 'row', gap: 2, children: [
            { type: 'button', label: 'Edit Item #1', variant: 'outline', onClickAction: { type: 'edit', payload: { itemId: 1 } } },
            { type: 'button', label: 'Edit Item #2', variant: 'outline', onClickAction: { type: 'edit', payload: { itemId: 2 } } },
            { type: 'button', label: 'Edit Item #3', variant: 'outline', onClickAction: { type: 'edit', payload: { itemId: 3 } } },
          ]
        },
      ],
    },
  },
  {
    title: 'confirmation dialog',
    description: 'inline buttons instead of card footer actions',
    widget: {
      type: 'ui',
      title: 'Delete Project?',
      children: [
        {
          type: 'col', gap: 3, children: [
            { type: 'text', value: 'This action cannot be undone. All data will be permanently deleted.' },
            {
              type: 'row', gap: 2, justify: 'end', children: [
                { type: 'button', label: 'Cancel', variant: 'ghost', onClickAction: { type: 'cancel' } },
                { type: 'button', label: 'Delete', variant: 'destructive', onClickAction: { type: 'confirm-delete', loadingBehavior: 'self' } },
              ]
            },
          ]
        },
      ],
    },
  },
  {
    title: 'form with actions',
    description: 'card as form with inputs and submit button',
    widget: {
      type: 'ui',
      title: 'Quick Feedback',
      asForm: true,
      confirmAction: { type: 'submit-feedback' },
      children: [
        {
          type: 'col', gap: 3, children: [
            {
              type: 'col', gap: 2, children: [
                { type: 'label', value: 'How was your experience?', fieldName: 'rating' },
                {
                  type: 'select', name: 'rating', placeholder: 'Select rating', options: [
                    { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
                    { value: '4', label: '⭐⭐⭐⭐ Good' },
                    { value: '3', label: '⭐⭐⭐ Average' },
                    { value: '2', label: '⭐⭐ Poor' },
                    { value: '1', label: '⭐ Very Poor' },
                  ],
                },
              ]
            },
            {
              type: 'col', gap: 2, children: [
                { type: 'label', value: 'Comments', fieldName: 'comments' },
                { type: 'textarea', name: 'comments', placeholder: 'Share your thoughts...' },
              ]
            },
            {
              type: 'row', gap: 2, justify: 'end', children: [
                { type: 'button', label: 'Skip', variant: 'ghost', onClickAction: { type: 'skip' } },
                { type: 'button', label: 'Submit', variant: 'default', onClickAction: { type: 'submit-feedback', loadingBehavior: 'self' } },
              ]
            },
          ]
        },
      ],
    },
  },
]

export default function WidgetsDemoPage() {
  const [lastAction, setLastAction] = useState<{ action: WidgetAction; formData?: WidgetFormData } | null>(null)

  const handleAction = (action: WidgetAction, formData?: WidgetFormData) => {
    setLastAction({ action, formData })
  }

  return (
    <PageLayout toc={tocItems}>
      <div className="max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">widget renderer</h1>
          <p className="text-lg text-muted-foreground">
            renders declarative ui from json. agents return widget data, the renderer turns it into interactive components.
          </p>
        </header>

        {/* Demo / How it works */}
        <section id="demo" className="space-y-4">
          <h2 className="text-2xl font-semibold">how it works</h2>
          <p className="text-muted-foreground">
            widgets are json objects describing ui structure. the renderer recursively builds react components from nodes like <code className="text-sm bg-muted px-1 rounded">box</code>, <code className="text-sm bg-muted px-1 rounded">row</code>, <code className="text-sm bg-muted px-1 rounded">text</code>, <code className="text-sm bg-muted px-1 rounded">button</code>, etc.
          </p>
          <CodeBlock language="json">{`{
  "type": "ui",
  "children": [
    {
      "type": "box",
      "background": "gradient-purple",
      "padding": 4,
      "radius": "lg",
      "children": [
        { "type": "title", "value": "Hello World", "size": "xl" },
        { "type": "caption", "value": "This is a widget" },
        {
          "type": "button",
          "label": "Click me",
          "onClickAction": { "type": "greet" }
        }
      ]
    }
  ]
}`}</CodeBlock>
          <p className="text-muted-foreground text-sm">
            click &quot;show data&quot; on any example below to see its json structure.
          </p>
          {lastAction && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">last action triggered:</p>
              <CompactCodeBlock language="json">
                {JSON.stringify(lastAction, null, 2)}
              </CompactCodeBlock>
            </div>
          )}
        </section>

        {/* Gallery */}
        <section id="gallery" className="space-y-6">
          <h2 className="text-2xl font-semibold">gallery</h2>
          <p className="text-muted-foreground">
            compact widgets for card-style layouts.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 space-y-4">
              {galleryWidgets.slice(0, 6).map((widget, idx) => (
                <div key={idx}>
                  <WidgetRenderer widget={widget} onAction={handleAction} />
                </div>
              ))}
            </div>
            <div className="col-span-1 space-y-4">
              {galleryWidgets.slice(6).map((widget, idx) => (
                <div key={idx}>
                  <WidgetRenderer widget={widget} onAction={handleAction} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real-World Examples */}
        <section id="real-world" className="space-y-6">
          <h2 className="text-2xl font-semibold">real-world examples</h2>
          <p className="text-muted-foreground">
            production-ready widget patterns inspired by popular apps.
          </p>
          <div className="space-y-4">
            {realWorldExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                description={example.description}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Text & Content */}
        <section id="text" className="space-y-6">
          <h2 className="text-2xl font-semibold">text & content</h2>
          <p className="text-muted-foreground">
            primitives for displaying text, titles, captions, and badges.
          </p>
          <div className="space-y-4">
            {textExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Layout */}
        <section id="layout" className="space-y-6">
          <h2 className="text-2xl font-semibold">layout</h2>
          <p className="text-muted-foreground">
            row, column, and box for composing complex layouts.
          </p>
          <div className="space-y-4">
            {layoutExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Form Elements */}
        <section id="forms" className="space-y-6">
          <h2 className="text-2xl font-semibold">form elements</h2>
          <p className="text-muted-foreground">
            interactive inputs, selects, and checkboxes.
          </p>
          <div className="space-y-4">
            {formExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Backgrounds */}
        <section id="backgrounds" className="space-y-6">
          <h2 className="text-2xl font-semibold">backgrounds</h2>
          <p className="text-muted-foreground">
            gradient presets and semantic surfaces.
          </p>
          <div className="space-y-4">
            {backgroundExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Actions */}
        <section id="actions" className="space-y-6">
          <h2 className="text-2xl font-semibold">actions</h2>
          <p className="text-muted-foreground">
            interactive elements with <code className="text-sm bg-muted px-1 rounded">onClickAction</code> and loading states.
          </p>
          <div className="space-y-4">
            {actionExamples.map((example, idx) => (
              <WidgetExample
                key={idx}
                title={example.title}
                description={example.description}
                widget={example.widget}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Installation */}
        <section id="installation" className="space-y-4">
          <h2 className="text-2xl font-semibold">installation</h2>
          <CodeBlock language="bash">
            npx shadcn@latest add https://ui.inference.sh/r/widgets.json
          </CodeBlock>
        </section>

        {/* Usage */}
        <section id="usage" className="space-y-4">
          <h2 className="text-2xl font-semibold">usage</h2>
          <CodeBlock language="tsx">{usageCode}</CodeBlock>
        </section>
      </div>
    </PageLayout>
  )
}
