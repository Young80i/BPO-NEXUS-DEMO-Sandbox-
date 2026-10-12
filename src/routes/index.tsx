import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // This instantly catches anyone visiting the root URL (/) 
    // and sends them safely to your working dashboard
    throw redirect({
      to: '/executive-dashboard',
    })
  },
})