import { getHolidays } from '@/features/settings/queries'
import { HolidaysClient } from '@/components/settings/holidays-client'

export const metadata = { title: 'Holidays' }

export default async function HolidaysPage() {
  const holidays = await getHolidays()
  return <HolidaysClient initialHolidays={holidays} />
}
